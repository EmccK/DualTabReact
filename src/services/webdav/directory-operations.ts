/**
 * WebDAV目录操作服务
 */

import type {
  WebDAVFile,
  WebDAVDirectory,
  WebDAVResponse,
} from '../../types/webdav';
import type { WebDAVClient } from './client';
import { WebDAVDirectoryParser } from './directory-parser';

export class WebDAVDirectoryOperations {
  constructor(private client: WebDAVClient) {}

  /**
   * 获取目录内容
   */
  async listDirectory(path: string = ''): Promise<WebDAVResponse<WebDAVFile[]>> {
    const response = await this.client.request({
      method: 'PROPFIND',
      path,
      headers: {
        'Depth': '1',
        'Content-Type': 'application/xml',
      },
      body: `<?xml version="1.0" encoding="utf-8" ?>
        <D:propfind xmlns:D="DAV:">
          <D:prop>
            <D:displayname/>
            <D:getcontentlength/>
            <D:getcontenttype/>
            <D:getlastmodified/>
            <D:resourcetype/>
          </D:prop>
        </D:propfind>`,
    });

    if (response.success) {
      const files = this.parseDirectoryListing(response.data);
      return {
        ...response,
        data: files,
      };
    }

    return response;
  }

  /**
   * 解析目录列表XML响应
   */
  private parseDirectoryListing(xmlData: string): WebDAVFile[] {
    return WebDAVDirectoryParser.parseDirectoryListing(xmlData);
  }

  /**
   * 递归创建目录
   */
  async createDirectoryRecursive(path: string): Promise<void> {
    if (!path || path === '/') {
      return; // 空路径或根路径，无需创建
    }

    const parts = path.split('/').filter(Boolean);
    let currentPath = '';

    console.log('开始递归创建目录:', path, '分割后:', parts);

    for (const part of parts) {
      currentPath += part;
      
      console.log('创建目录:', currentPath);
      
      try {
        const response = await this.client.request({
          method: 'MKCOL',
          path: currentPath,
        });
        
        console.log('目录创建成功:', currentPath, 'status:', response.status);
      } catch (error: any) {
        console.log('目录创建响应:', {
          path: currentPath,
          status: error.status,
          message: error.message
        });
        
        // 405 Method Not Allowed 通常表示目录已存在
        // 201 Created 表示创建成功
        // 其他状态码需要具体判断
        if (error.status === 405 || error.status === 409) {
          console.log('目录可能已存在，继续...');
        } else {
          throw error;
        }
      }
      
      currentPath += '/';
    }
  }

  /**
   * 删除目录
   */
  async deleteDirectory(path: string): Promise<WebDAVResponse> {
    return this.client.request({
      method: 'DELETE',
      path,
    });
  }
}
