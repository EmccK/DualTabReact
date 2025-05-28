
/**
 * WebDAV同步调度器
 */

import type { Bookmark, BookmarkCategory } from '../../types';
import type { AppSettings } from '../../types/settings';
import { WebDAVSyncService } from './sync-service';

export class WebDAVSyncScheduler {
  private intervalId: NodeJS.Timer | null = null;
  private isRunning = false;
  private syncService: WebDAVSyncService | null = null;

  constructor(
    private interval: number,
    private getLocalData: () => Promise<{
      bookmarks: Bookmark[];
      categories: BookmarkCategory[];
      settings: AppSettings;
    }>
  ) {}

  /**
   * 启动自动同步
   */
  start(syncService: WebDAVSyncService): void {
    if (this.isRunning) {
      return;
    }

    this.syncService = syncService;
    this.isRunning = true;

    this.intervalId = setInterval(async () => {
      await this.executeSyncCycle();
    }, this.interval * 60 * 1000); // 转换为毫秒

    console.log(`自动同步已启动，间隔: ${this.interval}分钟`);
  }

  /**
   * 停止自动同步
   */
  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    
    this.isRunning = false;
    this.syncService = null;
    
    console.log('自动同步已停止');
  }

  /**
   * 更新同步间隔
   */
  updateInterval(newInterval: number): void {
    this.interval = newInterval;
    
    if (this.isRunning && this.syncService) {
      this.stop();
      this.start(this.syncService);
    }
  }

  /**
   * 检查是否正在运行
   */
  isActive(): boolean {
    return this.isRunning;
  }

  /**
   * 获取同步服务实例
   */
  getSyncService(): WebDAVSyncService | null {
    return this.syncService;
  }

  /**
   * 手动触发同步
   */
  async triggerSync(): Promise<void> {
    if (!this.syncService) {
      throw new Error('同步服务未初始化');
    }

    await this.executeSyncCycle();
  }

  /**
   * 执行同步周期
   */
  private async executeSyncCycle(): Promise<void> {
    if (!this.syncService) {
      return;
    }

    try {
      // 获取本地数据
      const localData = await this.getLocalData();

      // 执行同步
      await this.syncService.startSync(
        localData.bookmarks,
        localData.categories,
        localData.settings
      );

      console.log('自动同步完成');
    } catch (error) {
      console.error('自动同步失败:', error);
    }
  }
}
