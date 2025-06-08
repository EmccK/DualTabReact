/**
 * WebDAV客户端核心模块
 * 处理所有WebDAV请求，避免浏览器认证弹窗
 */

import type { 
  WebDAVRequestOptions, 
  WebDAVResponse, 
  WebDAVFileInfo, 
  WebDAVConfig 
} from './types';
import { 
  WEBDAV_STATUS, 
  WEBDAV_HEADERS, 
  WEBDAV_CONTENT_TYPES, 
  PROPFIND_BODY, 
  MKCOL_BODY,
  SYNC_CONSTANTS,
  ERROR_MESSAGES,
} from './constants';
import { createAuthHeader, createAuthConfigFromWebDAV } from './auth';

/**
 * WebDAV客户端类
 */
export class WebDAVClient {
  private config: WebDAVConfig;
  private baseUrl: string;

  constructor(config: WebDAVConfig) {
    this.config = config;
    this.baseUrl = this.normalizeUrl(config.serverUrl);
  }

  /**
   * 标准化URL
   */
  private normalizeUrl(url: string): string {
    if (!url) return '';
    
    // 移除末尾的斜杠
    let normalized = url.replace(/\/+$/, '');
    
    // 确保以http://或https://开头
    if (!normalized.match(/^https?:\/\//)) {
      normalized = `https://${normalized}`;
    }
    
    return normalized;
  }

  /**
   * 构建完整的请求URL
   */
  private buildUrl(path: string): string {
    if (!path.startsWith('/')) {
      path = '/' + path;
    }
    
    const syncPath = this.config.syncPath || '/DualTab';
    const fullPath = syncPath + path;
    
    return this.baseUrl + fullPath;
  }

  /**
   * 创建请求头
   */
  private createHeaders(additionalHeaders: Record<string, string> = {}, includeDefaultContentType: boolean = true): Record<string, string> {
    const authConfig = createAuthConfigFromWebDAV(this.config);
    const authHeader = createAuthHeader(authConfig);
    
    const baseHeaders = {
      [WEBDAV_HEADERS.AUTHORIZATION]: authHeader,
      'User-Agent': 'DualTab WebDAV Client/2.0.0',
    };
    
    // 只在需要时添加默认Content-Type
    if (includeDefaultContentType) {
      baseHeaders[WEBDAV_HEADERS.CONTENT_TYPE] = WEBDAV_CONTENT_TYPES.XML;
    }
    
    return {
      ...baseHeaders,
      ...additionalHeaders,
    };
  }

  /**
   * 执行WebDAV请求的核心方法
   */
  async request(options: WebDAVRequestOptions): Promise<WebDAVResponse> {
    const { method, url, headers = {}, body, timeout = SYNC_CONSTANTS.DEFAULT_TIMEOUT, useDefaultContentType = true } = options;
    

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const response = await fetch(url, {
        method,
        headers: this.createHeaders(headers, useDefaultContentType),
        body,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const responseHeaders: Record<string, string> = {};
      response.headers.forEach((value, key) => {
        responseHeaders[key.toLowerCase()] = value;
      });

      let data: string | ArrayBuffer | undefined;
      const contentType = responseHeaders['content-type'] || '';
      
      if (contentType.includes('application/json') || contentType.includes('text/')) {
        data = await response.text();
      } else {
        data = await response.arrayBuffer();
      }

      const result: WebDAVResponse = {
        status: response.status,
        statusText: response.statusText,
        headers: responseHeaders,
        data,
      };


      return result;
    } catch (error) {
      
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error(ERROR_MESSAGES.TIMEOUT);
      }
      
      // 提供更详细的错误信息用于调试
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      
      throw new Error(`${ERROR_MESSAGES.NETWORK_ERROR}: ${errorMessage}`);
    }
  }

  /**
   * 清理请求头中的敏感信息（用于日志）
   */
  private sanitizeHeaders(headers: Record<string, string>): Record<string, string> {
    const sanitized = { ...headers };
    if (sanitized[WEBDAV_HEADERS.AUTHORIZATION]) {
      sanitized[WEBDAV_HEADERS.AUTHORIZATION] = '[REDACTED]';
    }
    return sanitized;
  }

  /**
   * 检查路径是否存在（相对于同步目录）
   */
  async exists(path: string): Promise<boolean> {
    try {
      const url = this.buildUrl(path);
      const response = await this.request({
        method: 'PROPFIND',
        url,
        headers: {
          [WEBDAV_HEADERS.DEPTH]: '0',
        },
        body: PROPFIND_BODY,
      });

      return response.status === WEBDAV_STATUS.OK || response.status === WEBDAV_STATUS.MULTI_STATUS;
    } catch (error) {
      return false;
    }
  }

  /**
   * 检查绝对路径是否存在
   */
  async existsAbsolute(absolutePath: string): Promise<boolean> {
    try {
      const url = this.baseUrl + absolutePath;
      
      const response = await this.request({
        method: 'PROPFIND',
        url,
        headers: {
          [WEBDAV_HEADERS.DEPTH]: '0',
        },
        body: PROPFIND_BODY,
      });

      return response.status === WEBDAV_STATUS.OK || response.status === WEBDAV_STATUS.MULTI_STATUS;
    } catch (error) {
      return false;
    }
  }

  /**
   * 创建目录（相对于同步目录）
   */
  async createDirectory(path: string): Promise<boolean> {
    try {
      const url = this.buildUrl(path);
      
      // 先尝试不带请求体的MKCOL请求
      let response = await this.request({
        method: 'MKCOL',
        url,
        useDefaultContentType: false,
      });

      // 如果失败，再尝试带XML请求体的方式
      if (response.status >= 400) {
        response = await this.request({
          method: 'MKCOL',
          url,
          body: MKCOL_BODY,
        });
      }

      // 目录创建成功的状态码
      const isSuccess = response.status === WEBDAV_STATUS.CREATED || 
                       response.status === WEBDAV_STATUS.OK ||
                       response.status === WEBDAV_STATUS.NO_CONTENT;
      
      // 如果返回409，可能是目录已存在，需要检查一下
      if (!isSuccess && response.status === WEBDAV_STATUS.CONFLICT) {
        // 检查目录是否实际存在
        return await this.exists(path);
      }
      
      return isSuccess;
    } catch (error) {
      return false;
    }
  }

  /**
   * 创建绝对路径目录
   */
  async createDirectoryAbsolute(absolutePath: string): Promise<boolean> {
    try {
      const url = this.baseUrl + absolutePath;
      
      // 先尝试不带请求体的MKCOL请求
      let response = await this.request({
        method: 'MKCOL',
        url,
        useDefaultContentType: false,
      });

      // 如果失败，再尝试带XML请求体的方式
      if (response.status >= 400) {
        response = await this.request({
          method: 'MKCOL',
          url,
          body: MKCOL_BODY,
        });
      }

      // 目录创建成功的状态码
      const isSuccess = response.status === WEBDAV_STATUS.CREATED || 
                       response.status === WEBDAV_STATUS.OK ||
                       response.status === WEBDAV_STATUS.NO_CONTENT;
      
      // 如果返回409，可能是目录已存在，需要检查一下
      if (!isSuccess && response.status === WEBDAV_STATUS.CONFLICT) {
        // 检查目录是否实际存在
        return await this.existsAbsolute(absolutePath);
      }
      
      return isSuccess;
    } catch (error) {
      return false;
    }
  }

  /**
   * 确保同步根目录存在（/DualTab）
   */
  async ensureSyncDirectory(): Promise<boolean> {
    try {
      const syncPath = this.config.syncPath || '/DualTab';
      
      // 检查同步目录是否存在
      const syncDirExists = await this.existsAbsolute(syncPath);
      if (syncDirExists) {
        return true;
      }

      // 创建同步目录
      const created = await this.createDirectoryAbsolute(syncPath);
      if (created) {
        // 再次验证目录是否真的创建成功
        return await this.existsAbsolute(syncPath);
      }
      
      return false;
    } catch (error) {
      return false;
    }
  }

  /**
   * 确保目录存在（相对于同步目录）
   */
  async ensureDirectory(path: string): Promise<boolean> {
    try {
      // 规范化路径
      const normalizedPath = path === '/' ? '/' : path.replace(/\/+$/, '');
      
      // 检查目录是否已存在
      if (await this.exists(normalizedPath)) {
        return true;
      }

      // 递归创建父目录
      const parentPath = normalizedPath.substring(0, normalizedPath.lastIndexOf('/'));
      if (parentPath && parentPath !== normalizedPath && parentPath !== '') {
        const parentSuccess = await this.ensureDirectory(parentPath);
        if (!parentSuccess) {
          return false;
        }
      }

      // 创建当前目录
      const created = await this.createDirectory(normalizedPath);
      if (created) {
        // 再次验证目录是否真的创建成功
        return await this.exists(normalizedPath);
      }
      
      return false;
    } catch (error) {
      return false;
    }
  }

  /**
   * 读取文件内容
   */
  async getFile(path: string): Promise<string | ArrayBuffer> {
    const url = this.buildUrl(path);
    
    
    const response = await this.request({
      method: 'GET',
      url,
      headers: {
        [WEBDAV_HEADERS.CONTENT_TYPE]: WEBDAV_CONTENT_TYPES.OCTET_STREAM,
      },
    });


    // WebDAV服务器可能返回200或207状态码
    if (response.status !== WEBDAV_STATUS.OK && response.status !== WEBDAV_STATUS.MULTI_STATUS) {
      if (response.status === WEBDAV_STATUS.NOT_FOUND) {
        throw new Error(ERROR_MESSAGES.FILE_NOT_FOUND);
      }
      throw new Error(`${ERROR_MESSAGES.SERVER_ERROR}: ${response.status}`);
    }

    const data = response.data || '';
    

    return data;
  }

  /**
   * 上传文件内容
   */
  async putFile(path: string, content: string | ArrayBuffer, contentType?: string): Promise<boolean> {
    try {
      const url = this.buildUrl(path);
      
      // 首先确保同步根目录存在（/DualTab）
      const syncPath = this.config.syncPath || '/DualTab';
      const ensureSyncDirResult = await this.ensureSyncDirectory();
      if (!ensureSyncDirResult) {
        throw new Error(`无法创建同步目录: ${syncPath}`);
      }
      
      // 然后确保文件的父目录存在（如果有子目录）
      const parentPath = path.substring(0, path.lastIndexOf('/'));
      if (parentPath && parentPath !== '') {
        // 这里的parentPath是相对于同步目录的路径
        const ensureResult = await this.ensureDirectory(parentPath);
        if (!ensureResult) {
          throw new Error(`无法创建目录: ${syncPath}${parentPath}`);
        }
      }

      const headers: Record<string, string> = {};
      if (contentType) {
        headers[WEBDAV_HEADERS.CONTENT_TYPE] = contentType;
      } else if (typeof content === 'string') {
        headers[WEBDAV_HEADERS.CONTENT_TYPE] = WEBDAV_CONTENT_TYPES.JSON;
      } else {
        headers[WEBDAV_HEADERS.CONTENT_TYPE] = WEBDAV_CONTENT_TYPES.OCTET_STREAM;
      }

      const response = await this.request({
        method: 'PUT',
        url,
        headers,
        body: content,
        useDefaultContentType: false, // 不使用默认的XML Content-Type
      });

      // 检查上传是否成功
      const isSuccess = response.status === WEBDAV_STATUS.CREATED || 
                       response.status === WEBDAV_STATUS.NO_CONTENT ||
                       response.status === WEBDAV_STATUS.OK;
      
      if (!isSuccess) {
        let errorMessage = `上传失败，状态码: ${response.status}`;
        
        if (response.status === WEBDAV_STATUS.CONFLICT) {
          errorMessage = '文件冲突，可能目录不存在或文件被锁定';
        } else if (response.status === WEBDAV_STATUS.FORBIDDEN) {
          errorMessage = '权限不足，请检查WebDAV权限设置';
        } else if (response.status === WEBDAV_STATUS.UNAUTHORIZED) {
          errorMessage = '认证失败，请检查用户名和密码';
        } else if (response.status === WEBDAV_STATUS.NOT_FOUND) {
          errorMessage = '目标路径不存在';
        }
        
        throw new Error(errorMessage);
      }

      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : ERROR_MESSAGES.SERVER_ERROR;
      throw new Error(errorMessage);
    }
  }

  /**
   * 删除文件或目录
   */
  async delete(path: string): Promise<boolean> {
    try {
      const url = this.buildUrl(path);
      const response = await this.request({
        method: 'DELETE',
        url,
      });

      return response.status === WEBDAV_STATUS.NO_CONTENT || response.status === WEBDAV_STATUS.OK;
    } catch (error) {
      return false;
    }
  }

  /**
   * 获取文件信息
   */
  async getFileInfo(path: string): Promise<WebDAVFileInfo | null> {
    try {
      const url = this.buildUrl(path);
      const response = await this.request({
        method: 'PROPFIND',
        url,
        headers: {
          [WEBDAV_HEADERS.DEPTH]: '0',
        },
        body: PROPFIND_BODY,
      });

      if (response.status !== WEBDAV_STATUS.MULTI_STATUS && response.status !== WEBDAV_STATUS.OK) {
        return null;
      }

      // 解析WebDAV XML响应
      const xmlData = response.data as string;
      return this.parseFileInfoFromXML(xmlData, path);
    } catch (error) {
      return null;
    }
  }

  /**
   * 从XML响应中解析文件信息
   */
  private parseFileInfoFromXML(xmlData: string, path: string): WebDAVFileInfo | null {
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(xmlData, 'text/xml');
      
      const response = doc.querySelector('response');
      if (!response) return null;

      const getprop = response.querySelector('propstat prop');
      if (!getprop) return null;

      const displayName = getprop.querySelector('displayname')?.textContent || path.split('/').pop() || '';
      const contentLength = getprop.querySelector('getcontentlength')?.textContent || '0';
      const lastModified = getprop.querySelector('getlastmodified')?.textContent || '';
      const etag = getprop.querySelector('getetag')?.textContent || '';
      const resourceType = getprop.querySelector('resourcetype');
      const isDirectory = resourceType?.querySelector('collection') !== null;

      return {
        name: displayName,
        path,
        size: parseInt(contentLength, 10),
        lastModified: lastModified ? new Date(lastModified) : new Date(),
        isDirectory,
        etag: etag.replace(/"/g, ''), // 移除引号
      };
    } catch (error) {
      return null;
    }
  }

  /**
   * 列出目录内容
   */
  async listDirectory(path: string): Promise<WebDAVFileInfo[]> {
    try {
      const url = this.buildUrl(path);
      const response = await this.request({
        method: 'PROPFIND',
        url,
        headers: {
          [WEBDAV_HEADERS.DEPTH]: '1',
        },
        body: PROPFIND_BODY,
      });

      if (response.status !== WEBDAV_STATUS.MULTI_STATUS) {
        return [];
      }

      const xmlData = response.data as string;
      return this.parseDirectoryListingFromXML(xmlData);
    } catch (error) {
      return [];
    }
  }

  /**
   * 从XML响应中解析目录列表
   */
  private parseDirectoryListingFromXML(xmlData: string): WebDAVFileInfo[] {
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(xmlData, 'text/xml');
      
      const responses = doc.querySelectorAll('response');
      const files: WebDAVFileInfo[] = [];

      responses.forEach((response, index) => {
        // 跳过第一个响应（通常是目录本身）
        if (index === 0) return;

        const href = response.querySelector('href')?.textContent || '';
        const propstat = response.querySelector('propstat prop');
        if (!propstat) return;

        const displayName = propstat.querySelector('displayname')?.textContent || href.split('/').pop() || '';
        const contentLength = propstat.querySelector('getcontentlength')?.textContent || '0';
        const lastModified = propstat.querySelector('getlastmodified')?.textContent || '';
        const etag = propstat.querySelector('getetag')?.textContent || '';
        const resourceType = propstat.querySelector('resourcetype');
        const isDirectory = resourceType?.querySelector('collection') !== null;

        files.push({
          name: displayName,
          path: href,
          size: parseInt(contentLength, 10),
          lastModified: lastModified ? new Date(lastModified) : new Date(),
          isDirectory,
          etag: etag.replace(/"/g, ''),
        });
      });

      return files;
    } catch (error) {
      return [];
    }
  }

  /**
   * 测试连接
   */
  async testConnection(): Promise<boolean> {
    try {
      // 首先尝试一个简单的OPTIONS请求来测试基本连接
      try {
        await this.request({
          method: 'OPTIONS',
          url: this.baseUrl,
          headers: {},
        });
      } catch (optionsError) {
        // 忽略OPTIONS错误，继续测试
      }
      
      // 测试访问根目录
      const rootResponse = await this.request({
        method: 'PROPFIND',
        url: this.baseUrl + '/',
        headers: {
          [WEBDAV_HEADERS.DEPTH]: '0',
        },
        body: PROPFIND_BODY,
      });
      
      const isSuccess = rootResponse.status === WEBDAV_STATUS.OK || 
                       rootResponse.status === WEBDAV_STATUS.MULTI_STATUS;
      
      return isSuccess;
    } catch (error) {
      return false;
    }
  }
  

  /**
   * 更新配置
   */
  updateConfig(newConfig: WebDAVConfig): void {
    this.config = newConfig;
    this.baseUrl = this.normalizeUrl(newConfig.serverUrl);
  }

  /**
   * 获取当前配置
   */
  getConfig(): WebDAVConfig {
    return { ...this.config };
  }
}

/**
 * 创建WebDAV客户端实例
 */
export function createWebDAVClient(config: WebDAVConfig): WebDAVClient {
  return new WebDAVClient(config);
}

/**
 * 验证WebDAV配置
 */
export function validateWebDAVConfig(config: any): config is WebDAVConfig {
  if (!config || typeof config !== 'object') {
    return false;
  }

  return (
    typeof config.serverUrl === 'string' &&
    typeof config.username === 'string' &&
    typeof config.password === 'string' &&
    typeof config.syncPath === 'string' &&
    typeof config.enabled === 'boolean' &&
    typeof config.autoSyncInterval === 'number'
  );
}
