/**
 * WebDAV工具函数
 */

import type { WebDAVConfig } from '../../types/webdav';

/**
 * 构建WebDAV完整URL
 */
export function buildWebDAVUrl(config: WebDAVConfig, path: string = ''): string {
  const baseUrl = config.serverUrl.replace(/\/$/, '');
  const basePath = config.basePath.replace(/^\/|\/$/g, '');
  const filePath = path.replace(/^\//, '');
  
  if (basePath && filePath) {
    return `${baseUrl}/${basePath}/${filePath}`;
  } else if (basePath) {
    return `${baseUrl}/${basePath}`;
  } else if (filePath) {
    return `${baseUrl}/${filePath}`;
  }
  
  return baseUrl;
}

/**
 * 生成Basic Auth头
 */
export function createAuthHeader(username: string, password: string): string {
  const credentials = btoa(`${username}:${password}`);
  return `Basic ${credentials}`;
}

/**
 * 解析WebDAV错误响应
 */
export function parseWebDAVError(response: Response): string {
  const status = response.status;
  
  switch (status) {
    case 401:
      return '认证失败，请检查用户名和密码';
    case 403:
      return '权限不足，无法访问指定资源';
    case 404:
      return '资源不存在或路径错误';
    case 409:
      return '资源冲突，可能目录不存在';
    case 423:
      return '资源已被锁定';
    case 507:
      return '服务器存储空间不足';
    default:
      return `服务器错误 (${status}): ${response.statusText}`;
  }
}

/**
 * 格式化文件大小
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

/**
 * 安全的JSON解析
 */
export function safeJsonParse<T>(jsonString: string, fallback: T): T {
  try {
    if (typeof jsonString !== 'string') {
      console.warn('safeJsonParse: 输入不是字符串:', typeof jsonString, jsonString);
      return fallback;
    }
    
    const parsed = JSON.parse(jsonString);
    console.log('safeJsonParse 成功解析:', { 
      inputType: typeof jsonString, 
      inputLength: jsonString.length,
      outputType: typeof parsed,
      isArray: Array.isArray(parsed),
      parsed 
    });
    return parsed;
  } catch (error) {
    console.error('safeJsonParse 解析失败:', { 
      error, 
      inputType: typeof jsonString, 
      input: jsonString?.substring(0, 200) 
    });
    return fallback;
  }
}
