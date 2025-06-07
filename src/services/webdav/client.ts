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
  private createHeaders(additionalHeaders: Record<string, string> = {}): Record<string, string> {
    const authConfig = createAuthConfigFromWebDAV(this.config);
    const authHeader = createAuthHeader(authConfig);
    
    return {
      [WEBDAV_HEADERS.AUTHORIZATION]: authHeader,
      [WEBDAV_HEADERS.CONTENT_TYPE]: WEBDAV_CONTENT_TYPES.XML,
      'User-Agent': 'DualTab WebDAV Client/2.0.0',
      ...additionalHeaders,
    };
  }

  /**
   * 执行WebDAV请求的核心方法
   */
  async request(options: WebDAVRequestOptions): Promise<WebDAVResponse> {
    const { method, url, headers = {}, body, timeout = SYNC_CONSTANTS.DEFAULT_TIMEOUT } = options;
    

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const response = await fetch(url, {
        method,
        headers: this.createHeaders(headers),
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
   * 检查路径是否存在
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
   * 创建目录
   */
  async createDirectory(path: string): Promise<boolean> {
    try {
      const url = this.buildUrl(path);
      const response = await this.request({
        method: 'MKCOL',
        url,
        body: MKCOL_BODY,
      });

      return response.status === WEBDAV_STATUS.CREATED || response.status === WEBDAV_STATUS.OK;
    } catch (error) {
      return false;
    }
  }

  /**
   * 确保目录存在
   */
  async ensureDirectory(path: string): Promise<boolean> {
    // 检查目录是否已存在
    if (await this.exists(path)) {
      return true;
    }

    // 递归创建父目录
    const parentPath = path.substring(0, path.lastIndexOf('/'));
    if (parentPath && parentPath !== path) {
      await this.ensureDirectory(parentPath);
    }

    // 创建当前目录
    return await this.createDirectory(path);
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
    const url = this.buildUrl(path);
    
    // 确保父目录存在
    const parentPath = path.substring(0, path.lastIndexOf('/'));
    if (parentPath) {
      await this.ensureDirectory(parentPath);
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
    });

    return response.status === WEBDAV_STATUS.CREATED || response.status === WEBDAV_STATUS.NO_CONTENT;
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
      const testUrl = this.baseUrl + (this.config.syncPath || '/DualTab');
      
      
      // 首先尝试一个简单的OPTIONS请求来测试基本连接
      try {
        const optionsResponse = await this.request({
          method: 'OPTIONS',
          url: this.baseUrl,
          headers: {},
        });
        
      } catch (optionsError) {
      }
      
      const response = await this.request({
        method: 'PROPFIND',
        url: testUrl,
        headers: {
          [WEBDAV_HEADERS.DEPTH]: '0',
        },
        body: PROPFIND_BODY,
      });

      const isSuccess = response.status === WEBDAV_STATUS.OK || 
                       response.status === WEBDAV_STATUS.MULTI_STATUS ||
                       response.status === WEBDAV_STATUS.NOT_FOUND; // 目录不存在但连接正常
      
      
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
