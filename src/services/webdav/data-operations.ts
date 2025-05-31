/**
 * WebDAV数据操作服务 - 专门处理DualTab数据
 */

import type { Bookmark, BookmarkCategory } from '../../types';
import type { AppSettings } from '../../types/settings';
import { WebDAVFileOperations } from './file-operations';
import { WebDAVDirectoryOperations } from './directory-operations';
import { WEBDAV_PATHS, safeJsonParse } from '../../lib/webdav';
import type { WebDAVClient } from './client';

export class WebDAVDataOperations {
  private fileOps: WebDAVFileOperations;
  private dirOps: WebDAVDirectoryOperations;

  constructor(private client: WebDAVClient) {
    this.fileOps = new WebDAVFileOperations(client);
    this.dirOps = new WebDAVDirectoryOperations(client);
  }

  /**
   * 初始化WebDAV目录结构
   */
  async initializeStructure(): Promise<void> {
    try {
      // 获取WebDAV配置
      const config = this.client.getConfig();
      console.log('WebDAV配置:', {
        serverUrl: config.serverUrl,
        basePath: config.basePath,
        username: config.username
      });
      
      // 尝试创建基础目录结构
      // 注意：basePath已经包含在URL构建中，这里创建的是WebDAV服务器上的目录
      if (config.basePath && config.basePath !== '/' && config.basePath !== '') {
        console.log('尝试创建WebDAV基础目录...');
        try {
          // 直接创建基础目录（不使用路径，因为buildWebDAVUrl会处理）
          await this.client.request({
            method: 'MKCOL',
            path: '', // 空路径，buildWebDAVUrl会自动添加basePath
          });
          console.log('基础目录创建成功或已存在');
        } catch (error: any) {
          // 405 Method Not Allowed 通常表示目录已存在
          if (error.status === 405 || error.status === 201) {
            console.log('目录已存在或创建成功');
          } else {
            console.warn('目录创建失败，但继续尝试上传文件:', error.message);
          }
        }
      } else {
        console.log('使用根路径，无需创建目录');
      }
    } catch (error: any) {
      console.error('目录初始化失败:', error);
      // 不要阻塞同步，目录可能已存在
      console.log('继续进行文件同步...');
    }
  }

  /**
   * 上传书签数据
   */
  async uploadBookmarks(bookmarks: Bookmark[]): Promise<void> {
    console.log('开始上传书签数据，数量:', bookmarks.length);
    const content = JSON.stringify(bookmarks, null, 2);
    console.log('书签数据大小:', content.length, '字符');
    await this.fileOps.uploadFile(WEBDAV_PATHS.BOOKMARKS, content);
    console.log('书签数据上传完成');
  }

  /**
   * 下载书签数据
   */
  async downloadBookmarks(): Promise<Bookmark[]> {
    try {
      const response = await this.fileOps.downloadFile(WEBDAV_PATHS.BOOKMARKS);
      if (response.success) {
        return safeJsonParse<Bookmark[]>(response.data, []);
      }
    } catch (error) {
      console.warn('下载书签失败:', error);
    }
    return [];
  }

  /**
   * 上传分类数据
   */
  async uploadCategories(categories: BookmarkCategory[]): Promise<void> {
    console.log('开始上传分类数据，数量:', categories.length);
    const content = JSON.stringify(categories, null, 2);
    await this.fileOps.uploadFile(WEBDAV_PATHS.CATEGORIES, content);
    console.log('分类数据上传完成');
  }

  /**
   * 下载分类数据
   */
  async downloadCategories(): Promise<BookmarkCategory[]> {
    try {
      const response = await this.fileOps.downloadFile(WEBDAV_PATHS.CATEGORIES);
      if (response.success) {
        return safeJsonParse<BookmarkCategory[]>(response.data, []);
      }
    } catch (error) {
      console.warn('下载分类失败:', error);
    }
    return [];
  }

  /**
   * 上传设置数据
   */
  async uploadSettings(settings: AppSettings): Promise<void> {
    console.log('开始上传设置数据');
    
    // 导入设置迁移函数，确保上传的是最新格式的设置
    const { migrateSettings, needsMigration } = await import('../../utils/settings-migration');
    
    let settingsToUpload = settings;
    
    // 检查是否需要迁移（虽然本地设置通常已经是最新的，但为了保险起见）
    if (needsMigration(settings)) {
      console.log('上传前需要迁移设置数据...');
      settingsToUpload = migrateSettings(settings);
      console.log('上传前设置迁移完成');
    }
    
    const content = JSON.stringify(settingsToUpload, null, 2);
    await this.fileOps.uploadFile(WEBDAV_PATHS.SETTINGS, content);
    console.log('设置数据上传完成');
  }

  /**
   * 下载设置数据
   */
  async downloadSettings(): Promise<AppSettings | null> {
    try {
      const response = await this.fileOps.downloadFile(WEBDAV_PATHS.SETTINGS);
      if (response.success) {
        const rawSettings = safeJsonParse<any>(response.data, null);
        if (rawSettings) {
          // 导入设置迁移函数
          const { migrateSettings, needsMigration } = await import('../../utils/settings-migration');
          
          // 检查是否需要迁移
          if (needsMigration(rawSettings)) {
            console.log('WebDAV下载的设置需要迁移，正在清理旧数据...');
            const migratedSettings = migrateSettings(rawSettings);
            console.log('WebDAV设置迁移完成');
            return migratedSettings;
          }
          
          return rawSettings as AppSettings;
        }
      }
    } catch (error) {
      console.warn('下载设置失败:', error);
    }
    return null;
  }

  /**
   * 检查文件是否存在
   */
  async checkFileExists(fileName: string): Promise<boolean> {
    return this.fileOps.fileExists(fileName);
  }

  /**
   * 获取文件最后修改时间
   */
  async getFileLastModified(fileName: string): Promise<Date | null> {
    try {
      const files = await this.dirOps.listDirectory('');
      if (files.success) {
        const file = files.data.find(f => f.name === fileName);
        return file ? file.lastModified : null;
      }
    } catch (error) {
      console.warn('获取文件信息失败:', error);
    }
    return null;
  }
}
