/**
 * WebDAV连接服务
 */

import type { 
  WebDAVConfig, 
  WebDAVConnectionStatus, 
  WebDAVResponse 
} from '../../types/webdav';
import { WebDAVClient } from './client';
import { validateWebDAVConfig } from '../../lib/webdav';

export class WebDAVConnectionService {
  private client: WebDAVClient | null = null;

  /**
   * 测试连接
   */
  async testConnection(config: WebDAVConfig): Promise<{
    success: boolean;
    error?: string;
    status?: WebDAVConnectionStatus;
  }> {
    // 验证配置
    const validation = validateWebDAVConfig(config);
    if (!validation.isValid) {
      return {
        success: false,
        error: validation.errors.map(e => e.message).join(', '),
      };
    }

    try {
      const client = new WebDAVClient(config);
      
      // 尝试PROPFIND请求测试连接
      const response = await client.request({
        method: 'PROPFIND',
        path: '',
        headers: {
          'Depth': '0',
        },
      });

      return {
        success: response.success,
        status: client.getConnectionStatus(),
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || '连接失败',
      };
    }
  }

  /**
   * 建立连接
   */
  async connect(config: WebDAVConfig): Promise<WebDAVClient> {
    const testResult = await this.testConnection(config);
    
    if (!testResult.success) {
      throw new Error(testResult.error || '连接失败');
    }

    this.client = new WebDAVClient(config);
    return this.client;
  }

  /**
   * 断开连接
   */
  disconnect(): void {
    this.client = null;
  }

  /**
   * 获取当前客户端
   */
  getClient(): WebDAVClient | null {
    return this.client;
  }

  /**
   * 检查是否已连接
   */
  isConnected(): boolean {
    return this.client !== null && this.client.getConnectionStatus().connected;
  }
}
