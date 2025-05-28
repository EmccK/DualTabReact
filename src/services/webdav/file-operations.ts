/**
 * WebDAV文件操作服务
 */

import type {
  WebDAVFile,
  WebDAVDirectory,
  WebDAVResponse,
} from '../../types/webdav';
import type { WebDAVClient } from './client';
import { WEBDAV_PATHS } from '../../lib/webdav';

export class WebDAVFileOperations {
  constructor(private client: WebDAVClient) {}

  /**
   * 上传文件
   */
  async uploadFile(path: string, content: string | ArrayBuffer): Promise<WebDAVResponse> {
    return this.client.request({
      method: 'PUT',
      path,
      body: content,
      headers: {
        'Content-Type': typeof content === 'string' 
          ? 'application/json; charset=utf-8' 
          : 'application/octet-stream',
      },
    });
  }

  /**
   * 下载文件
   */
  async downloadFile(path: string): Promise<WebDAVResponse<string>> {
    return this.client.request<string>({
      method: 'GET',
      path,
    });
  }

  /**
   * 删除文件
   */
  async deleteFile(path: string): Promise<WebDAVResponse> {
    return this.client.request({
      method: 'DELETE',
      path,
    });
  }

  /**
   * 创建目录
   */
  async createDirectory(path: string): Promise<WebDAVResponse> {
    return this.client.request({
      method: 'MKCOL',
      path,
    });
  }

  /**
   * 检查文件是否存在
   */
  async fileExists(path: string): Promise<boolean> {
    try {
      const response = await this.client.request({
        method: 'PROPFIND',
        path,
        headers: {
          'Depth': '0',
        },
      });
      return response.success;
    } catch {
      return false;
    }
  }
}
