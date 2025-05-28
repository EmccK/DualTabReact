/**
 * WebDAV客户端核心类
 */

import type {
  WebDAVConfig,
  WebDAVResponse,
  WebDAVRequestOptions,
  WebDAVConnectionStatus,
  WebDAVError,
} from '../../types/webdav';
import {
  buildWebDAVUrl,
  createAuthHeader,
  parseWebDAVError,
} from '../../lib/webdav';
import { WebDAVClientHelpers } from './client-helpers';

export class WebDAVClient {
  private config: WebDAVConfig;
  private connectionStatus: WebDAVConnectionStatus;

  constructor(config: WebDAVConfig) {
    this.config = config;
    this.connectionStatus = {
      connected: false,
    };
  }

  /**
   * 更新配置
   */
  updateConfig(config: WebDAVConfig): void {
    this.config = config;
    this.connectionStatus = {
      connected: false,
    };
  }

  /**
   * 获取当前配置
   */
  getConfig(): WebDAVConfig {
    return { ...this.config };
  }

  /**
   * 获取连接状态
   */
  getConnectionStatus(): WebDAVConnectionStatus {
    return { ...this.connectionStatus };
  }

  /**
   * 执行WebDAV请求
   */
  async request<T = any>(options: WebDAVRequestOptions): Promise<WebDAVResponse<T>> {
    const url = buildWebDAVUrl(this.config, options.path);
    const headers = this.buildHeaders(options.headers);
    
    console.log('WebDAV请求:', {
      method: options.method,
      url,
      path: options.path,
      hasBody: !!options.body,
      bodyLength: options.body ? options.body.toString().length : 0,
    });
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        controller.abort();
      }, options.timeout || this.config.timeout);

      const response = await fetch(url, {
        method: options.method,
        headers,
        body: options.body,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      
      console.log('WebDAV响应:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        headers: Object.fromEntries(response.headers.entries()),
      });
      
      const data = await this.parseResponse<T>(response);
      
      // 更新连接状态
      this.updateConnectionStatus(true);

      return {
        status: response.status,
        statusText: response.statusText,
        data,
        headers: this.parseHeaders(response.headers),
        success: response.ok,
      };
    } catch (error) {
      const webdavError = this.handleError(error);
      this.updateConnectionStatus(false, webdavError);
      throw webdavError;
    }
  }

  /**
   * 构建请求头
   */
  private buildHeaders(additionalHeaders?: Record<string, string>): Record<string, string> {
    return WebDAVClientHelpers.buildHeaders(this.config, additionalHeaders);
  }

  /**
   * 解析响应数据
   */
  private async parseResponse<T>(response: Response): Promise<T> {
    return WebDAVClientHelpers.parseResponse<T>(response);
  }

  /**
   * 解析响应头
   */
  private parseHeaders(headers: Headers): Record<string, string> {
    return WebDAVClientHelpers.parseHeaders(headers);
  }

  /**
   * 处理错误
   */
  private handleError(error: any): WebDAVError {
    return WebDAVClientHelpers.handleError(error);
  }

  /**
   * 更新连接状态
   */
  private updateConnectionStatus(connected: boolean, error?: WebDAVError): void {
    this.connectionStatus = {
      connected,
      connectedAt: connected ? new Date() : this.connectionStatus.connectedAt,
      lastActivity: new Date(),
      error,
    };
  }
}
