
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
  ): Promise<void> {
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

      // 创建同步项目
      const syncItems: SyncItem[] = [
        {
          id: 'bookmarks',
          name: '书签数据',
          type: 'bookmark',
          localModified: this.getLocalModifiedTime(bookmarks),
          status: 'pending',
          direction: 'bidirectional',
        },
        {
          id: 'categories',
          name: '分类数据',
          type: 'category',
          localModified: this.getLocalModifiedTime(categories),
          status: 'pending',
          direction: 'bidirectional',
        },
        {
          id: 'settings',
          name: '设置数据',
          type: 'settings',
          localModified: new Date(),
          status: 'pending',
          direction: 'bidirectional',
        },
      ];

      const executor = new WebDAVSyncExecutor(this.dataOps);

      // 执行同步
      for (let i = 0; i < syncItems.length; i++) {
        const item = syncItems[i];
        this.currentProgress.current = `正在同步: ${item.name}`;
        this.currentProgress.completed = i;

        let data: any;
        switch (item.type) {
          case 'bookmark':
            data = bookmarks;
            break;
          case 'category':
            data = categories;
            break;
          case 'settings':
            data = settings;
            break;
        }

        const result = await executor.executeSyncItem(item, data);
        
        if (!result.success && result.conflict) {
          this.conflictQueue.push(result.conflict);
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
