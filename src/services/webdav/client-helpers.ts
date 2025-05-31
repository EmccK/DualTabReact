/**
 * WebDAV客户端辅助方法
 */

import type { WebDAVError } from '../../types/webdav';
import { parseWebDAVError, createAuthHeader } from '../../lib/webdav';

export class WebDAVClientHelpers {
  /**
   * 构建请求头
   */
  static buildHeaders(
    config: { username: string; password: string; customHeaders?: Record<string, string> },
    additionalHeaders?: Record<string, string>
  ): Record<string, string> {
    const headers: Record<string, string> = {
      'Authorization': createAuthHeader(config.username, config.password),
      'Content-Type': 'application/json',
      'Accept': 'application/json, text/plain, */*',
      ...config.customHeaders,
      ...additionalHeaders,
    };

    return headers;
  }

  /**
   * 解析响应数据
   */
  static async parseResponse<T>(response: Response): Promise<T> {
    const contentType = response.headers.get('content-type') || '';
    
    if (contentType.includes('application/json')) {
      const jsonData = await response.json();
      console.log('WebDAV JSON响应:', jsonData);
      return jsonData;
    } else if (contentType.includes('text/')) {
      const textData = await response.text();
      console.log('WebDAV文本响应:', { length: textData.length, preview: textData.substring(0, 200) });
      return textData as T;
    } else {
      return response.arrayBuffer() as T;
    }
  }

  /**
   * 解析响应头
   */
  static parseHeaders(headers: Headers): Record<string, string> {
    const result: Record<string, string> = {};
    headers.forEach((value, key) => {
      result[key] = value;
    });
    return result;
  }

  /**
   * 处理错误
   */
  static handleError(error: any): WebDAVError {
    if (error.name === 'AbortError') {
      return {
        code: 'TIMEOUT',
        message: '请求超时',
        timestamp: new Date(),
      };
    }

    if (error instanceof Response) {
      return {
        code: 'HTTP_ERROR',
        message: parseWebDAVError(error),
        status: error.status,
        timestamp: new Date(),
      };
    }

    return {
      code: 'NETWORK_ERROR',
      message: error.message || '网络连接失败',
      details: error,
      timestamp: new Date(),
    };
  }
}
