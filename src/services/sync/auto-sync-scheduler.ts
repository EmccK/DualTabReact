/**
 * 自动同步调度器
 * 实现基于数据变更时间的智能同步逻辑
 */

import { SyncManager } from './sync-manager';
import { storageBridge } from '../webdav/storage-bridge';

/**
 * 同步事件类型
 */
export type SyncEventType = 'data_changed' | 'tab_opened' | 'manual';

/**
 * 同步时间记录
 */
interface SyncTimeRecord {
  /** 最后数据变更时间 */
  lastDataChangeTime: number;
  /** 最后上传时间 */
  lastUploadTime: number;
  /** 最后下载时间 */
  lastDownloadTime: number;
  /** 设备ID */
  deviceId: string;
}

/**
 * 自动同步配置
 */
interface AutoSyncConfig {
  /** 是否启用自动上传 */
  enableAutoUpload: boolean;
  /** 是否启用自动下载 */
  enableAutoDownload: boolean;
  /** 数据变更后的上传延迟（毫秒） */
  uploadDelay: number;
  /** 新标签页打开时是否下载 */
  downloadOnTabOpen: boolean;
}

/**
 * 默认自动同步配置
 */
const DEFAULT_AUTO_SYNC_CONFIG: AutoSyncConfig = {
  enableAutoUpload: true,
  enableAutoDownload: true,
  uploadDelay: 2000, // 2秒延迟
  downloadOnTabOpen: true,
};

/**
 * 自动同步调度器
 */
export class AutoSyncScheduler {
  private static instance: AutoSyncScheduler | null = null;
  
  private syncManager: SyncManager;
  private config: AutoSyncConfig;
  private timeRecord: SyncTimeRecord;
  private uploadTimer: number | null = null;
  private isInitialized = false;

  private constructor() {
    this.syncManager = SyncManager.getInstance();
    this.config = DEFAULT_AUTO_SYNC_CONFIG;
    this.timeRecord = {
      lastDataChangeTime: 0,
      lastUploadTime: 0,
      lastDownloadTime: 0,
      deviceId: '',
    };
  }

  /**
   * 获取单例实例
   */
  static getInstance(): AutoSyncScheduler {
    if (!AutoSyncScheduler.instance) {
      AutoSyncScheduler.instance = new AutoSyncScheduler();
    }
    return AutoSyncScheduler.instance;
  }

  /**
   * 初始化调度器
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      // 加载配置
      await this.loadConfig();
      
      // 加载时间记录
      await this.loadTimeRecord();
      
      // 设置监听器
      this.setupListeners();
      
      this.isInitialized = true;
      
    } catch (error) {
      throw error;
    }
  }

  /**
   * 加载配置
   */
  private async loadConfig(): Promise<void> {
    try {
      const result = await chrome.storage.local.get(['auto_sync_config']);
      this.config = {
        ...DEFAULT_AUTO_SYNC_CONFIG,
        ...result.auto_sync_config,
      };
    } catch (error) {
      this.config = DEFAULT_AUTO_SYNC_CONFIG;
    }
  }

  /**
   * 保存配置
   */
  async updateConfig(config: Partial<AutoSyncConfig>): Promise<void> {
    this.config = { ...this.config, ...config };
    
    try {
      await chrome.storage.local.set({
        auto_sync_config: this.config,
      });
      
    } catch (error) {
    }
  }

  /**
   * 加载时间记录
   */
  private async loadTimeRecord(): Promise<void> {
    try {
      const result = await chrome.storage.local.get(['sync_time_record']);
      if (result.sync_time_record) {
        this.timeRecord = {
          ...this.timeRecord,
          ...result.sync_time_record,
        };
      }
      
      // 确保有设备ID
      if (!this.timeRecord.deviceId) {
        const metadata = await storageBridge.loadSyncMetadata();
        this.timeRecord.deviceId = metadata?.deviceId || '';
      }
    } catch (error) {
    }
  }

  /**
   * 保存时间记录
   */
  private async saveTimeRecord(): Promise<void> {
    try {
      await chrome.storage.local.set({
        sync_time_record: this.timeRecord,
      });
    } catch (error) {
    }
  }

  /**
   * 设置监听器
   */
  private setupListeners(): void {

    // 监听storage变化（数据变更）
    chrome.storage.onChanged.addListener((changes, namespace) => {
      if (namespace !== 'local') return;
      
      // 检查是否是书签或分类数据变化
      const relevantKeys = ['categories', 'bookmarks', 'settings'];
      const hasRelevantChanges = relevantKeys.some(key => changes[key]);
      
      if (hasRelevantChanges) {
        this.onDataChanged('storage_change');
      }
    });

    // 监听消息
    chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {

      switch (message.action) {
        case 'auto_sync_data_changed':
        case 'webdav_trigger_auto_sync':
          if (message.eventType === 'data_changed') {
            this.onDataChanged(message.eventType || 'manual');
          } else if (message.eventType === 'tab_opened') {
            this.onTabOpened();
          }
          sendResponse({ success: true });
          break;
          
        case 'auto_sync_tab_opened':
          this.onTabOpened();
          sendResponse({ success: true });
          break;
          
        case 'auto_sync_get_config':
        case 'webdav_get_auto_sync_config':
          sendResponse({ 
            success: true, 
            config: {
              config: this.config,
              timeRecord: this.timeRecord,
            }
          });
          break;
          
        case 'auto_sync_update_config':
        case 'webdav_update_auto_sync_config':
          this.updateConfig(message.config).then(() => {
            sendResponse({ success: true });
          }).catch(error => {
            sendResponse({ success: false, error: error.message });
          });
          return true; // 保持异步响应
      }
      
      return false;
    });

  }

  /**
   * 处理数据变更事件
   */
  private onDataChanged(eventType: string): void {
    if (!this.config.enableAutoUpload) {
      return;
    }

    const now = Date.now();
    this.timeRecord.lastDataChangeTime = now;
    

    // 清除已有的上传定时器
    if (this.uploadTimer) {
      clearTimeout(this.uploadTimer);
    }

    // 设置延迟上传
    this.uploadTimer = setTimeout(() => {
      this.performAutoUpload();
    }, this.config.uploadDelay) as unknown as number;

    // 保存时间记录
    this.saveTimeRecord();
  }

  /**
   * 处理新标签页打开事件
   */
  private onTabOpened(): void {

    if (!this.isInitialized) {
      return;
    }

    if (!this.config.enableAutoDownload || !this.config.downloadOnTabOpen) {
      return;
    }


    // 执行下载检查
    this.performAutoDownload();
  }

  /**
   * 执行自动上传
   */
  private async performAutoUpload(): Promise<void> {
    try {
      const now = Date.now();
      
      // 检查WebDAV是否配置
      const webdavConfig = await storageBridge.loadWebDAVConfig();
      if (!webdavConfig?.enabled) {
        return;
      }


      // 执行上传
      const result = await this.syncManager.upload({
        autoResolveConflicts: true,
        createBackup: false, // 自动上传不创建备份
      });

      if (result.success) {
        this.timeRecord.lastUploadTime = now;
        await this.saveTimeRecord();
        
      } else {
      }
    } catch (error) {
    } finally {
      this.uploadTimer = null;
    }
  }

  /**
   * 执行自动下载
   */
  private async performAutoDownload(): Promise<void> {
    try {
      const now = Date.now();
      
      // 检查WebDAV是否配置
      const webdavConfig = await storageBridge.loadWebDAVConfig();
      if (!webdavConfig?.enabled) {
        return;
      }


      // 更新下载时间
      this.timeRecord.lastDownloadTime = now;
      await this.saveTimeRecord();

      // 直接执行下载，不检查时间戳条件
      const result = await this.syncManager.download();
      
      if (result.success) {
        // 通知前端刷新
        this.notifyDataRefresh();
        
      } else {
      }
    } catch (error) {
    }
  }

  /**
   * 检查是否应该执行下载
   * 实现 D > C 的逻辑判断
   */
  private async shouldPerformDownload(): Promise<boolean> {
    try {
      // 获取远程数据的元数据（不下载完整数据）
      const remoteMetadata = await this.getRemoteMetadata();
      if (!remoteMetadata) {
        return false; // 远程没有数据
      }

      const remoteChangeTime = remoteMetadata.lastSyncTime || 0;
      const localLastSyncTime = this.timeRecord.lastDownloadTime || this.timeRecord.lastUploadTime || 0;
      

      // 如果远程数据比本地最后同步时间更新，则需要下载
      return remoteChangeTime > localLastSyncTime;
    } catch (error) {
      return false;
    }
  }

  /**
   * 获取远程数据元数据（不下载完整数据）
   */
  private async getRemoteMetadata(): Promise<any> {
    try {
      // 通过同步管理器获取远程文件信息
      const syncService = (this.syncManager as any).syncService;
      if (!syncService) {
        return null;
      }

      // 首先检查远程数据文件是否存在
      const files = await syncService.listRemoteFiles();
      const dataFile = files.find(file => file.name === 'dualtab-data.json');
      
      if (!dataFile) {
        return null;
      }

      // 尝试下载并解析远程数据以获取准确的时间戳
      try {
        const downloadResult = await this.syncManager.download();
        if (downloadResult.success && downloadResult.result?.data) {
          const remoteData = downloadResult.result.data;
          if (remoteData.metadata) {
            return {
              lastSyncTime: remoteData.metadata.lastSyncTime || remoteData.metadata.localTimestamp || 0,
              size: dataFile.size,
              metadata: remoteData.metadata,
            };
          }
        }
      } catch (downloadError) {
      }

      // 如果无法获取数据内容，则使用文件的修改时间作为备选
      return {
        lastSyncTime: dataFile.lastModified?.getTime() || 0,
        size: dataFile.size,
      };
    } catch (error) {
      return null;
    }
  }

  /**
   * 通知前端数据刷新
   */
  private notifyDataRefresh(): void {
    // 发送消息给所有扩展页面
    chrome.runtime.sendMessage({
      action: 'storage_changed',
      source: 'auto_sync_download',
    }).catch(() => {
      // 忽略发送失败
    });
  }

  /**
   * 手动触发数据变更事件
   */
  async triggerDataChange(eventType: SyncEventType = 'manual'): Promise<void> {
    this.onDataChanged(eventType);
  }

  /**
   * 手动触发新标签页事件
   */
  async triggerTabOpened(): Promise<void> {
    this.onTabOpened();
  }

  /**
   * 获取当前配置
   */
  getConfig(): AutoSyncConfig {
    return { ...this.config };
  }

  /**
   * 获取时间记录
   */
  getTimeRecord(): SyncTimeRecord {
    return { ...this.timeRecord };
  }

  /**
   * 停止调度器
   */
  stop(): void {
    if (this.uploadTimer) {
      clearTimeout(this.uploadTimer);
      this.uploadTimer = null;
    }
    
    this.isInitialized = false;
    
  }

  /**
   * 重置时间记录
   */
  async resetTimeRecord(): Promise<void> {
    this.timeRecord = {
      lastDataChangeTime: 0,
      lastUploadTime: 0,
      lastDownloadTime: 0,
      deviceId: this.timeRecord.deviceId,
    };
    
    await this.saveTimeRecord();
  }
}

/**
 * 初始化自动同步调度器
 */
export async function initializeAutoSyncScheduler(): Promise<AutoSyncScheduler> {
  const scheduler = AutoSyncScheduler.getInstance();
  await scheduler.initialize();
  return scheduler;
}

/**
 * 获取自动同步调度器实例
 */
export function getAutoSyncScheduler(): AutoSyncScheduler {
  return AutoSyncScheduler.getInstance();
}