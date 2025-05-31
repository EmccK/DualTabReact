
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
   * 获取本地数据集合的修改时间
   * 使用Chrome存储的实际写入时间，而不是依赖数据项的时间戳
   */
  private async getLocalCollectionModifiedTime(collectionKey: string): Promise<Date> {
    try {
      // 尝试获取集合级别的修改时间标记
      const metaKey = `${collectionKey}_modified_time`;
      const result = await chrome.storage.local.get(metaKey);
      
      if (result[metaKey]) {
        console.log(`${collectionKey} 集合修改时间:`, new Date(result[metaKey]).toISOString());
        return new Date(result[metaKey]);
      }
      
      // 如果没有集合修改时间，检查数据是否存在
      const dataResult = await chrome.storage.local.get(collectionKey);
      const data = dataResult[collectionKey];
      
      if (!data || (Array.isArray(data) && data.length === 0)) {
        console.log(`${collectionKey}: 本地数据为空，返回1970年时间戳`);
        return new Date(0); // 空数据，使用最早时间
      }
      
      // 如果有数据但没有修改时间标记，使用数据项的时间戳
      if (Array.isArray(data)) {
        const times = data
          .map(item => item.updatedAt || item.createdAt || 0)
          .filter(time => time > 0);
        
        if (times.length > 0) {
          const maxTime = Math.max(...times);
          const result = new Date(maxTime);
          console.log(`${collectionKey}: 使用数据项时间戳`, result.toISOString());
          return result;
        }
      }
      
      // 最后的兜底策略：如果数据存在但没有任何时间信息，使用一个相对较旧的时间
      console.log(`${collectionKey}: 数据存在但无时间信息，使用默认旧时间`);
      return new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // 7天前
      
    } catch (error) {
      console.error(`获取${collectionKey}修改时间失败:`, error);
      return new Date(0); // 出错时使用最早时间，倾向于下载远程数据
    }
  }

  /**
   * 更新本地数据集合的修改时间标记
   */
  private async updateLocalCollectionModifiedTime(collectionKey: string): Promise<void> {
    try {
      const metaKey = `${collectionKey}_modified_time`;
      const now = Date.now();
      await chrome.storage.local.set({ [metaKey]: now });
      console.log(`更新${collectionKey}修改时间标记:`, new Date(now).toISOString());
    } catch (error) {
      console.error(`更新${collectionKey}修改时间标记失败:`, error);
    }
  }

  /**
   * 获取设置的修改时间
   */
  private async getSettingsModifiedTime(): Promise<Date> {
    return this.getLocalCollectionModifiedTime('app_settings');
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
      
      const localBookmarksModified = await this.getLocalCollectionModifiedTime('bookmarks');
      const localCategoriesModified = await this.getLocalCollectionModifiedTime('categories');
      
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
        
        console.log(`${item.name} 同步结果:`, {
          success: result.success,
          hasUpdatedData: !!result.updatedData,
          hasConflict: !!result.conflict,
          updatedDataType: typeof result.updatedData,
          updatedDataLength: Array.isArray(result.updatedData) ? result.updatedData.length : 'N/A'
        });
        
        if (!result.success && result.conflict) {
          this.conflictQueue.push(result.conflict);
        } else if (result.success && result.updatedData !== undefined) {
          // 更新同步后的数据
          switch (item.type) {
            case 'bookmark':
              syncedBookmarks = result.updatedData;
              console.log('书签数据已更新，数量:', syncedBookmarks.length);
              // 如果是下载操作，更新本地修改时间标记
              if (item.remoteModified && (!item.localModified || item.remoteModified > item.localModified)) {
                await this.updateLocalCollectionModifiedTime('bookmarks');
              }
              break;
            case 'category':
              syncedCategories = result.updatedData;
              console.log('分类数据已更新，数量:', syncedCategories.length);
              // 如果是下载操作，更新本地修改时间标记
              if (item.remoteModified && (!item.localModified || item.remoteModified > item.localModified)) {
                await this.updateLocalCollectionModifiedTime('categories');
              }
              break;
            case 'settings':
              syncedSettings = result.updatedData;
              console.log('设置数据已更新');
              // 如果是下载操作，更新本地修改时间标记
              if (item.remoteModified && (!item.localModified || item.remoteModified > item.localModified)) {
                await this.updateLocalCollectionModifiedTime('app_settings');
              }
              break;
          }
        } else if (result.success && result.updatedData === undefined) {
          console.log(`${item.name}: 同步成功但没有更新数据，保持原数据`);
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
