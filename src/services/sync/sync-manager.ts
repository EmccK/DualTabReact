/**
 * 同步管理器
 * 统一管理WebDAV同步任务、定时调度和状态监控
 */

import { WebDAVSyncService, createWebDAVSyncService } from '../webdav/sync';
import { StorageBridge, storageBridge } from '../webdav/storage-bridge';
import { AutoSyncScheduler, initializeAutoSyncScheduler } from './auto-sync-scheduler';
import type { 
  WebDAVConfig, 
  SyncResult, 
  SyncStatus, 
  ConflictResolution
} from '../webdav/types';
import { 
  DEFAULT_WEBDAV_CONFIG,
  DEFAULT_SYNC_CONFIG 
} from '../webdav/types';
import { 
  SYNC_CONSTANTS, 
  ERROR_MESSAGES, 
  SUCCESS_MESSAGES, 
  DEBUG_ENABLED 
} from '../webdav/constants';
import { validateWebDAVConfig } from '../webdav/client';

/**
 * 同步管理器选项
 */
export interface SyncManagerOptions {
  enableAutoSync?: boolean;
  conflictResolution?: ConflictResolution;
  maxRetries?: number;
  retryDelay?: number;
}

/**
 * 同步任务
 */
interface SyncTask {
  id: string;
  type: 'manual' | 'auto' | 'upload' | 'download';
  options: any;
  timestamp: number;
  retryCount: number;
}

/**
 * 同步调度器
 */
class SyncScheduler {
  private intervalId: number | null = null;
  private isEnabled = false;
  private intervalMinutes = 30;

  start(intervalMinutes: number = 30): void {
    if (this.intervalId) {
      this.stop();
    }

    this.intervalMinutes = intervalMinutes;
    this.isEnabled = true;

    // 确保间隔在允许范围内
    const safeInterval = Math.max(
      Math.min(intervalMinutes, SYNC_CONSTANTS.MAX_SYNC_INTERVAL / (60 * 1000)),
      SYNC_CONSTANTS.MIN_SYNC_INTERVAL / (60 * 1000)
    );

    this.intervalId = setInterval(() => {
      if (this.isEnabled) {
        SyncManager.getInstance().performAutoSync();
      }
    }, safeInterval * 60 * 1000) as unknown as number;

    if (DEBUG_ENABLED) {
      console.log(`[Sync Scheduler] Started with interval: ${safeInterval} minutes`);
    }
  }

  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isEnabled = false;

    if (DEBUG_ENABLED) {
      console.log('[Sync Scheduler] Stopped');
    }
  }

  isRunning(): boolean {
    return this.isEnabled && this.intervalId !== null;
  }

  updateInterval(minutes: number): void {
    if (this.isRunning()) {
      this.stop();
      this.start(minutes);
    } else {
      this.intervalMinutes = minutes;
    }
  }
}

/**
 * 同步管理器主类
 */
export class SyncManager {
  private static instance: SyncManager | null = null;
  
  private syncService: WebDAVSyncService | null = null;
  private storage: StorageBridge;
  private scheduler: SyncScheduler;
  private autoSyncScheduler: AutoSyncScheduler | null = null;
  private currentTask: SyncTask | null = null;
  private taskQueue: SyncTask[] = [];
  private isProcessing = false;
  private options: SyncManagerOptions;

  private constructor() {
    this.storage = storageBridge;
    this.scheduler = new SyncScheduler();
    this.options = {
      enableAutoSync: false,
      conflictResolution: 'manual',
      maxRetries: 3,
      retryDelay: 5000,
    };

    this.initialize();
  }

  /**
   * 获取单例实例
   */
  static getInstance(): SyncManager {
    if (!SyncManager.instance) {
      SyncManager.instance = new SyncManager();
    }
    return SyncManager.instance;
  }

  /**
   * 初始化同步管理器
   */
  private async initialize(): Promise<void> {
    try {
      if (DEBUG_ENABLED) {
        console.log('[Sync Manager] Starting initialization...');
      }

      // 加载WebDAV配置
      const config = await this.storage.loadWebDAVConfig();
      if (config && validateWebDAVConfig(config)) {
        await this.updateConfig(config);
        if (DEBUG_ENABLED) {
          console.log('[Sync Manager] WebDAV config loaded and validated');
        }
      } else {
        if (DEBUG_ENABLED) {
          console.log('[Sync Manager] No valid WebDAV config found');
        }
      }

      // 清理过期的同步锁
      await this.storage.clearSyncLock();

      // 初始化自动同步调度器
      try {
        this.autoSyncScheduler = await initializeAutoSyncScheduler();
        if (DEBUG_ENABLED) {
          console.log('[Sync Manager] Auto sync scheduler initialized');
        }
      } catch (error) {
        if (DEBUG_ENABLED) {
          console.warn('[Sync Manager] Failed to initialize auto sync scheduler:', error);
        }
      }

      // 设置消息监听器
      this.setupMessageListeners();

      if (DEBUG_ENABLED) {
        console.log('[Sync Manager] Initialized successfully');
      }
    } catch (error) {
      if (DEBUG_ENABLED) {
        console.error('[Sync Manager] Initialization failed:', error);
      }
    }
  }

  /**
   * 设置消息监听器
   */
  private setupMessageListeners(): void {
    // 监听来自前端的同步请求
    chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
      if (!message.action?.startsWith('webdav_')) {
        return false;
      }

      if (DEBUG_ENABLED) {
        console.log('[Sync Manager] Handling message:', message.action);
      }

      this.handleMessage(message)
        .then(result => {
          if (DEBUG_ENABLED) {
            console.log('[Sync Manager] Message result:', result);
          }
          sendResponse(result);
        })
        .catch(error => {
          if (DEBUG_ENABLED) {
            console.error('[Sync Manager] Message error:', error);
          }
          sendResponse({ 
            success: false, 
            error: error.message || 'Unknown error' 
          });
        });

      return true; // 保持异步响应
    });

    if (DEBUG_ENABLED) {
      console.log('[Sync Manager] Message listeners set up');
    }
  }

  /**
   * 处理消息
   */
  private async handleMessage(message: any): Promise<any> {
    switch (message.action) {
      case 'webdav_sync':
        return await this.sync(message.options);

      case 'webdav_upload':
        return await this.upload(message.options);

      case 'webdav_download':
        return await this.download();

      case 'webdav_test_connection':
        return await this.testConnection();

      case 'webdav_get_status':
        return await this.getStatus();

      case 'webdav_update_config':
        return await this.updateConfig(message.config);

      case 'webdav_resolve_conflict':
        return await this.resolveConflict(message.resolution);

      case 'webdav_enable_auto_sync':
        return await this.enableAutoSync(message.enabled, message.interval);

      case 'webdav_clear_sync_data':
        return await this.clearSyncData();

      case 'webdav_trigger_auto_sync':
        return await this.triggerAutoSync(message.eventType);

      case 'webdav_get_auto_sync_config':
        return await this.getAutoSyncConfig();

      case 'webdav_update_auto_sync_config':
        return await this.updateAutoSyncConfig(message.config);

      default:
        throw new Error(`Unknown action: ${message.action}`);
    }
  }

  /**
   * 更新WebDAV配置
   */
  async updateConfig(config: WebDAVConfig): Promise<{ success: boolean; error?: string }> {
    try {
      if (!validateWebDAVConfig(config)) {
        throw new Error(ERROR_MESSAGES.INVALID_CONFIG);
      }

      // 保存配置
      await this.storage.saveWebDAVConfig(config);

      // 更新同步服务
      if (this.syncService) {
        this.syncService.updateConfig(config);
      } else {
        this.syncService = createWebDAVSyncService(config);
      }

      // 更新调度器
      if (config.enabled && config.autoSyncInterval) {
        this.scheduler.updateInterval(config.autoSyncInterval);
        if (!this.scheduler.isRunning()) {
          this.scheduler.start(config.autoSyncInterval);
        }
      } else {
        this.scheduler.stop();
      }

      if (DEBUG_ENABLED) {
        console.log('[Sync Manager] Config updated');
      }

      return { success: true };
    } catch (error) {
      if (DEBUG_ENABLED) {
        console.error('[Sync Manager] Config update failed:', error);
      }
      return { 
        success: false, 
        error: error instanceof Error ? error.message : ERROR_MESSAGES.INVALID_CONFIG 
      };
    }
  }

  /**
   * 执行同步
   */
  async sync(options: any = {}): Promise<{ success: boolean; result?: SyncResult; error?: string }> {
    try {
      const task: SyncTask = {
        id: 'sync_' + Date.now(),
        type: 'manual',
        options,
        timestamp: Date.now(),
        retryCount: 0,
      };

      const result = await this.executeTask(task);
      return { success: true, result };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : ERROR_MESSAGES.NETWORK_ERROR 
      };
    }
  }

  /**
   * 上传数据
   */
  async upload(options: any = {}): Promise<{ success: boolean; result?: SyncResult; error?: string }> {
    try {
      const task: SyncTask = {
        id: 'upload_' + Date.now(),
        type: 'upload',
        options,
        timestamp: Date.now(),
        retryCount: 0,
      };

      const result = await this.executeTask(task);
      return { success: true, result };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : ERROR_MESSAGES.NETWORK_ERROR 
      };
    }
  }

  /**
   * 下载数据
   */
  async download(): Promise<{ success: boolean; result?: SyncResult; error?: string }> {
    try {
      const task: SyncTask = {
        id: 'download_' + Date.now(),
        type: 'download',
        options: {},
        timestamp: Date.now(),
        retryCount: 0,
      };

      const result = await this.executeTask(task);
      return { success: true, result };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : ERROR_MESSAGES.NETWORK_ERROR 
      };
    }
  }

  /**
   * 执行任务
   */
  private async executeTask(task: SyncTask): Promise<SyncResult> {
    if (!this.syncService) {
      throw new Error('WebDAV服务未配置');
    }

    // 设置同步锁
    const lockAcquired = await this.storage.setSyncLock();
    if (!lockAcquired) {
      throw new Error(ERROR_MESSAGES.SYNC_IN_PROGRESS);
    }

    try {
      this.currentTask = task;
      
      // 更新同步状态
      await this.updateSyncStatus('syncing', '正在同步数据...');

      // 加载本地数据
      const localData = await this.storage.loadLocalData();

      let result: SyncResult;

      switch (task.type) {
        case 'upload':
          result = await this.syncService.upload(localData, task.options);
          break;

        case 'download':
          console.log('[SYNC_MANAGER_DEBUG] Executing download task');
          const downloadResult = await this.syncService.download();
          if (downloadResult.data) {
            console.log('[SYNC_MANAGER_DEBUG] Download has data, restoring from sync package');
            await this.storage.restoreFromSyncPackage(downloadResult.data);
            console.log('[SYNC_MANAGER_DEBUG] Restore from sync package completed');
          } else {
            console.log('[SYNC_MANAGER_DEBUG] Download has no data');
          }
          result = downloadResult;
          break;

        default:
          console.log('[SYNC_MANAGER_DEBUG] Executing sync task');
          result = await this.syncService.sync(localData, task.options);

          // 如果同步结果包含数据，更新本地存储
          if (result.status === 'success' && (result as any).data) {
            console.log('[SYNC_MANAGER_DEBUG] Sync has data, restoring from sync package');
            await this.storage.restoreFromSyncPackage((result as any).data);
            console.log('[SYNC_MANAGER_DEBUG] Restore from sync package completed');
          } else {
            console.log('[SYNC_MANAGER_DEBUG] Sync has no data or failed');
          }
          break;
      }

      // 更新同步状态
      const status = result.status === 'success' ? 'success' : 
                   result.status === 'conflict' ? 'conflict' : 'error';
      
      await this.updateSyncStatus(status, result.message || result.error);

      // 保存冲突信息
      if (result.hasConflict && result.conflictInfo) {
        await this.storage.saveConflictData(result.conflictInfo);
      } else {
        await this.storage.clearConflictData();
      }

      return result;
    } finally {
      this.currentTask = null;
      await this.storage.clearSyncLock();
    }
  }

  /**
   * 更新同步状态
   */
  private async updateSyncStatus(status: SyncStatus, message?: string): Promise<void> {
    const statusData = {
      status,
      message,
      timestamp: Date.now(),
      taskId: this.currentTask?.id,
    };

    await this.storage.saveSyncStatus(statusData);
  }

  /**
   * 解决冲突
   */
  async resolveConflict(resolution: ConflictResolution): Promise<{ success: boolean; error?: string }> {
    try {
      const conflictData = await this.storage.loadConflictData();
      if (!conflictData) {
        throw new Error('没有待解决的冲突');
      }

      // 执行冲突解决
      const resolveOptions = {
        conflictResolution: resolution,
        autoResolveConflicts: true,
      };

      const result = await this.sync(resolveOptions);
      
      if (result.success) {
        await this.storage.clearConflictData();
      }

      return result;
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : '冲突解决失败' 
      };
    }
  }

  /**
   * 测试连接
   */
  async testConnection(): Promise<{ success: boolean; error?: string }> {
    try {
      if (!this.syncService) {
        throw new Error('WebDAV服务未配置');
      }

      const isConnected = await this.syncService.testConnection();
      return { 
        success: isConnected,
        error: isConnected ? undefined : ERROR_MESSAGES.NETWORK_ERROR
      };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : ERROR_MESSAGES.NETWORK_ERROR 
      };
    }
  }

  /**
   * 获取同步状态
   */
  async getStatus(): Promise<any> {
    try {
      const status = await this.storage.loadSyncStatus();
      const metadata = await this.storage.loadSyncMetadata();
      const lastSyncTime = await this.storage.getLastSyncTime();
      const conflictData = await this.storage.loadConflictData();

      return {
        success: true,
        status: status.status || 'idle',
        message: status.message,
        lastSyncTime,
        hasConflict: !!conflictData,
        isAutoSyncEnabled: this.scheduler.isRunning(),
        currentTask: this.currentTask?.type || null,
        metadata: metadata ? {
          version: metadata.version,
          deviceId: metadata.deviceId,
          lastSyncTime: metadata.lastSyncTime,
        } : null,
      };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to get status' 
      };
    }
  }

  /**
   * 启用/禁用自动同步
   */
  async enableAutoSync(enabled: boolean, intervalMinutes?: number): Promise<{ success: boolean }> {
    try {
      if (enabled) {
        const interval = intervalMinutes || 30;
        this.scheduler.start(interval);
        
        // 更新配置
        const config = await this.storage.loadWebDAVConfig() || DEFAULT_WEBDAV_CONFIG;
        config.enabled = true;
        config.autoSyncInterval = interval;
        await this.storage.saveWebDAVConfig(config);
      } else {
        this.scheduler.stop();
        
        // 更新配置
        const config = await this.storage.loadWebDAVConfig() || DEFAULT_WEBDAV_CONFIG;
        config.enabled = false;
        await this.storage.saveWebDAVConfig(config);
      }

      if (DEBUG_ENABLED) {
        console.log(`[Sync Manager] Auto sync ${enabled ? 'enabled' : 'disabled'}`);
      }

      return { success: true };
    } catch (error) {
      if (DEBUG_ENABLED) {
        console.error('[Sync Manager] Failed to toggle auto sync:', error);
      }
      return { success: false };
    }
  }

  /**
   * 执行自动同步
   */
  async performAutoSync(): Promise<void> {
    try {
      if (this.isProcessing || this.currentTask) {
        if (DEBUG_ENABLED) {
          console.log('[Sync Manager] Auto sync skipped - already processing');
        }
        return;
      }

      if (DEBUG_ENABLED) {
        console.log('[Sync Manager] Performing auto sync');
      }

      const result = await this.sync({ 
        autoResolveConflicts: true,
        createBackup: true,
      });

      if (DEBUG_ENABLED) {
        console.log('[Sync Manager] Auto sync completed:', result.success);
      }
    } catch (error) {
      if (DEBUG_ENABLED) {
        console.error('[Sync Manager] Auto sync failed:', error);
      }
    }
  }

  /**
   * 清除同步数据
   */
  async clearSyncData(): Promise<{ success: boolean }> {
    try {
      await this.storage.clearSyncData();
      this.scheduler.stop();
      this.syncService = null;
      this.currentTask = null;

      if (DEBUG_ENABLED) {
        console.log('[Sync Manager] Sync data cleared');
      }

      return { success: true };
    } catch (error) {
      if (DEBUG_ENABLED) {
        console.error('[Sync Manager] Failed to clear sync data:', error);
      }
      return { success: false };
    }
  }

  /**
   * 获取同步统计
   */
  async getSyncStats(): Promise<any> {
    try {
      const lastSyncTime = await this.storage.getLastSyncTime();
      const metadata = await this.storage.loadSyncMetadata();
      const status = await this.storage.loadSyncStatus();

      return {
        lastSyncTime,
        totalSyncs: metadata?.totalSyncs || 0,
        lastStatus: status.status || 'idle',
        deviceId: metadata?.deviceId,
        isAutoSyncEnabled: this.scheduler.isRunning(),
      };
    } catch (error) {
      return {
        lastSyncTime: 0,
        totalSyncs: 0,
        lastStatus: 'error',
        deviceId: null,
        isAutoSyncEnabled: false,
      };
    }
  }

  /**
   * 停止所有同步活动
   */
  stop(): void {
    this.scheduler.stop();
    if (this.autoSyncScheduler) {
      this.autoSyncScheduler.stop();
    }
    this.currentTask = null;
    this.taskQueue = [];
    this.isProcessing = false;
    
    if (DEBUG_ENABLED) {
      console.log('[Sync Manager] Stopped');
    }
  }

  /**
   * 触发自动同步事件
   */
  async triggerAutoSync(eventType: string = 'manual'): Promise<{ success: boolean; error?: string }> {
    try {
      if (!this.autoSyncScheduler) {
        return { success: false, error: 'Auto sync scheduler not initialized' };
      }

      if (eventType === 'data_changed') {
        await this.autoSyncScheduler.triggerDataChange('manual');
      } else if (eventType === 'tab_opened') {
        await this.autoSyncScheduler.triggerTabOpened();
      }

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to trigger auto sync'
      };
    }
  }

  /**
   * 获取自动同步配置
   */
  async getAutoSyncConfig(): Promise<{ success: boolean; config?: any; error?: string }> {
    try {
      if (!this.autoSyncScheduler) {
        return { success: false, error: 'Auto sync scheduler not initialized' };
      }

      const config = this.autoSyncScheduler.getConfig();
      const timeRecord = this.autoSyncScheduler.getTimeRecord();

      return {
        success: true,
        config: {
          ...config,
          timeRecord,
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get auto sync config'
      };
    }
  }

  /**
   * 更新自动同步配置
   */
  async updateAutoSyncConfig(config: any): Promise<{ success: boolean; error?: string }> {
    try {
      if (!this.autoSyncScheduler) {
        return { success: false, error: 'Auto sync scheduler not initialized' };
      }

      await this.autoSyncScheduler.updateConfig(config);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update auto sync config'
      };
    }
  }
}

/**
 * 初始化同步管理器
 */
export function initializeSyncManager(): SyncManager {
  return SyncManager.getInstance();
}

/**
 * 获取同步管理器实例
 */
export function getSyncManager(): SyncManager {
  return SyncManager.getInstance();
}