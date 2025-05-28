/**
 * WebDAV目录解析工具
 */

import type { WebDAVFile } from '../../types/webdav';

export class WebDAVDirectoryParser {
  /**
   * 解析目录列表XML响应
   */
  static parseDirectoryListing(xmlData: string): WebDAVFile[] {
    const files: WebDAVFile[] = [];
    
    try {
      // 使用DOMParser解析XML
      const parser = new DOMParser();
      const doc = parser.parseFromString(xmlData, 'text/xml');
      const responses = doc.querySelectorAll('response');

      responses.forEach((response) => {
        const href = response.querySelector('href')?.textContent || '';
        const displayName = response.querySelector('displayname')?.textContent || '';
        const contentLength = response.querySelector('getcontentlength')?.textContent || '0';
        const lastModified = response.querySelector('getlastmodified')?.textContent || '';
        const resourceType = response.querySelector('resourcetype');
        const isDirectory = resourceType?.querySelector('collection') !== null;

        if (href && displayName) {
          files.push({
            name: displayName,
            path: href,
            size: parseInt(contentLength, 10),
            isDirectory,
            lastModified: new Date(lastModified),
            mimeType: isDirectory ? undefined : 'application/octet-stream',
          });
        }
      });
    } catch (error) {
      console.error('解析目录列表失败:', error);
    }

    return files;
  }
}
