
/**
 * WebDAV同步服务
 */

import type {
  SyncItem,
  SyncConflict,
  SyncHistory,
  SyncProgress,
} from '../../types/webdav';
import type { Bookmark, BookmarkCategory } from '../../types';
import type { AppSettings } from '../../types/settings';
import type { WebDAVDataOperations } from './data-operations';
import { WebDAVSyncExecutor } from './sync-executor';

export class WebDAVSyncService {
  private syncHistory: SyncHistory[] = [];
  private conflictQueue: SyncConflict[] = [];
  private currentProgress: SyncProgress | null = null;

  constructor(private dataOps: WebDAVDataOperations) {}

  /**
   * 获取本地修改时间
   */
  private getLocalModifiedTime(data: any[]): Date {
    if (!data || data.length === 0) return new Date(0);
    
    // 找到最新的修改时间
    const maxTime = Math.max(
      ...data.map(item => item.updatedAt || item.createdAt || 0)
    );
    
    return new Date(maxTime);
  }

  /**
   * 获取设置的修改时间
   */
  private async getSettingsModifiedTime(): Promise<Date> {
    try {
      // 从Chrome storage获取设置的修改时间
      // 由于我们无法直接获取storage的修改时间，使用一个保守的策略
      // 如果本地有设置数据，假设它比较旧（除非明确指定）
      
      // 使用当前时间减去1小时作为默认本地修改时间
      // 这样可以确保如果远程有更新的数据，会被优先下载
      return new Date(Date.now() - 60 * 60 * 1000);
    } catch (error) {
      // 出错时返回更早的时间，优先下载远程数据
      return new Date(Date.now() - 24 * 60 * 60 * 1000);
    }
  }

  /**
   * 生成同步ID
   */
  private generateSyncId(): string {
    return `sync_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 添加同步历史
   */
  private addSyncHistory(history: SyncHistory): void {
    this.syncHistory.unshift(history);
    // 保留最近50条记录
    if (this.syncHistory.length > 50) {
      this.syncHistory = this.syncHistory.slice(0, 50);
    }
  }

  /**
   * 清空冲突队列
   */
  clearConflictQueue(): void {
    this.conflictQueue = [];
  }

  /**
   * 解决冲突
   */
  async resolveConflict(
    conflictIndex: number, 
    resolution: 'local' | 'remote' | 'merge' | 'skip'
  ): Promise<void> {
    if (conflictIndex < 0 || conflictIndex >= this.conflictQueue.length) {
      throw new Error('无效的冲突索引');
    }

    const conflict = this.conflictQueue[conflictIndex];
    conflict.resolution = resolution;

    // 根据解决策略执行相应操作
    switch (resolution) {
      case 'local':
        // 强制上传本地数据
        await this.forceUpload(conflict.item, conflict.localData);
        break;
      case 'remote':
        // 强制下载远程数据（这里只是标记，实际下载由调用者处理）
        break;
      case 'merge':
        // 合并数据（具体合并逻辑需要根据数据类型实现）
        await this.mergeData(conflict.item, conflict.localData, conflict.remoteData);
        break;
      case 'skip':
        // 跳过不处理
        break;
    }

    // 从队列中移除已解决的冲突
    this.conflictQueue.splice(conflictIndex, 1);
  }

  /**
   * 强制上传数据
   */
  private async forceUpload(item: SyncItem, data: any): Promise<void> {
    const executor = new WebDAVSyncExecutor(this.dataOps);
    await executor.executeSyncItem(item, data);
  }

  /**
   * 合并数据
   */
  private async mergeData(item: SyncItem, localData: any, remoteData: any): Promise<void> {
    // 简单的合并策略：使用本地数据覆盖远程数据
    // 实际项目中可能需要更复杂的合并逻辑
    await this.forceUpload(item, localData);
  }

  /**
   * 开始同步
   */
  async startSync(
    bookmarks: Bookmark[],
    categories: BookmarkCategory[],
    settings: AppSettings
  ): Promise<{
    bookmarks: Bookmark[];
    categories: BookmarkCategory[];
    settings: AppSettings;
  }> {
    console.log('开始WebDAV同步', {
      bookmarksCount: bookmarks.length,
      categoriesCount: categories.length,
      hasSettings: !!settings,
    });

    const syncId = this.generateSyncId();
    const startTime = new Date();

    // 创建同步进度
    this.currentProgress = {
      status: 'syncing',
      total: 3, // bookmarks, categories, settings
      completed: 0,
      current: '正在准备同步...',
      startTime,
    };

    try {
      // 初始化WebDAV目录结构
      console.log('初始化WebDAV目录结构...');
      await this.dataOps.initializeStructure();
      console.log('目录结构初始化完成');

      // 获取远程文件修改时间和本地设置修改时间
      console.log('检查远程文件修改时间...');
      const [bookmarksRemoteModified, categoriesRemoteModified, settingsRemoteModified, settingsLocalModified] = await Promise.all([
        this.dataOps.getFileLastModified('bookmarks.json'),
        this.dataOps.getFileLastModified('categories.json'),
        this.dataOps.getFileLastModified('settings.json'),
        this.getSettingsModifiedTime(),
      ]);

      console.log('远程文件修改时间:', {
        bookmarks: bookmarksRemoteModified,
        categories: categoriesRemoteModified,
        settings: settingsRemoteModified,
      });
      
      const localBookmarksModified = this.getLocalModifiedTime(bookmarks);
      const localCategoriesModified = this.getLocalModifiedTime(categories);
      
      console.log('本地数据修改时间:', {
        bookmarks: localBookmarksModified,
        categories: localCategoriesModified,
        settings: settingsLocalModified,
      });

      // 创建同步项目
      const syncItems: SyncItem[] = [
        {
          id: 'bookmarks',
          name: '书签数据',
          type: 'bookmark',
          localModified: localBookmarksModified,
          remoteModified: bookmarksRemoteModified,
          status: 'pending',
          direction: 'bidirectional',
        },
        {
          id: 'categories',
          name: '分类数据',
          type: 'category',
          localModified: localCategoriesModified,
          remoteModified: categoriesRemoteModified,
          status: 'pending',
          direction: 'bidirectional',
        },
        {
          id: 'settings',
          name: '设置数据',
          type: 'settings',
          localModified: settingsLocalModified,
          remoteModified: settingsRemoteModified,
          status: 'pending',
          direction: 'bidirectional',
        },
      ];

      const executor = new WebDAVSyncExecutor(this.dataOps);

      // 初始化同步后的数据
      let syncedBookmarks = bookmarks;
      let syncedCategories = categories;
      let syncedSettings = settings;

      // 执行同步
      console.log('开始执行同步，共', syncItems.length, '个项目:', syncItems.map(item => item.name));
      
      for (let i = 0; i < syncItems.length; i++) {
        const item = syncItems[i];
        console.log(`开始同步第${i + 1}个项目:`, item.name);
        this.currentProgress.current = `正在同步: ${item.name}`;
        this.currentProgress.completed = i;

        let data: any;
        switch (item.type) {
          case 'bookmark':
            data = syncedBookmarks;
            break;
          case 'category':
            data = syncedCategories;
            break;
          case 'settings':
            data = syncedSettings;
            break;
        }

        const result = await executor.executeSyncItem(item, data);
        
        if (!result.success && result.conflict) {
          this.conflictQueue.push(result.conflict);
        } else if (result.success && result.updatedData) {
          // 更新同步后的数据
          switch (item.type) {
            case 'bookmark':
              syncedBookmarks = result.updatedData;
              console.log('书签数据已更新，数量:', syncedBookmarks.length);
              break;
            case 'category':
              syncedCategories = result.updatedData;
              console.log('分类数据已更新，数量:', syncedCategories.length);
              break;
            case 'settings':
              syncedSettings = result.updatedData;
              console.log('设置数据已更新');
              break;
          }
        }
      }

      this.currentProgress.completed = syncItems.length;
      this.currentProgress.status = this.conflictQueue.length > 0 ? 'conflict' : 'success';
      this.currentProgress.current = '同步完成';

      // 添加到历史记录
      const endTime = new Date();
      this.addSyncHistory({
        id: syncId,
        timestamp: endTime,
        status: this.currentProgress.status,
        itemCount: syncItems.length,
        duration: endTime.getTime() - startTime.getTime(),
        conflictCount: this.conflictQueue.length,
      });

      // 返回同步后的数据
      return {
        bookmarks: syncedBookmarks,
        categories: syncedCategories,
        settings: syncedSettings,
      };

    } catch (error: any) {
      this.currentProgress.status = 'error';
      this.currentProgress.error = error.message;

      // 添加错误记录
      this.addSyncHistory({
        id: syncId,
        timestamp: new Date(),
        status: 'error',
        itemCount: 3,
        duration: Date.now() - startTime.getTime(),
        error: error.message,
      });

      throw error;
    }
  }

  /**
   * 获取同步进度
   */
  getSyncProgress(): SyncProgress | null {
    return this.currentProgress;
  }

  /**
   * 获取同步历史
   */
  getSyncHistory(): SyncHistory[] {
    return [...this.syncHistory];
  }

  /**
   * 获取冲突队列
   */
  getConflictQueue(): SyncConflict[] {
    return [...this.conflictQueue];
  }
}
