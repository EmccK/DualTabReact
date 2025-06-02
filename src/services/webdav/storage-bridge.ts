/**
 * 存储桥接器模块
 * 连接WebDAV同步服务和Chrome存储系统
 */

import type { SyncDataPackage } from './types';
import { STORAGE_KEYS, DEBUG_ENABLED } from './constants';

/**
 * Chrome存储接口封装
 */
export class StorageBridge {
  
  /**
   * 读取本地存储的所有数据
   */
  async loadLocalData(): Promise<{
    categories: any[];
    bookmarks: any[];
    settings: any;
  }> {
    try {
      const result = await chrome.storage.local.get([
        'categories',
        'bookmarks', 
        'settings'
      ]);

      if (DEBUG_ENABLED) {
        console.log('[Storage Bridge] Loaded local data:', {
          categoriesCount: result.categories?.length || 0,
          bookmarksCount: result.bookmarks?.length || 0,
          hasSettings: !!result.settings,
        });
      }

      return {
        categories: result.categories || [],
        bookmarks: result.bookmarks || [],
        settings: result.settings || {},
      };
    } catch (error) {
      if (DEBUG_ENABLED) {
        console.error('[Storage Bridge] Failed to load local data:', error);
      }
      throw error;
    }
  }

  /**
   * 保存数据到本地存储
   */
  async saveLocalData(data: {
    categories: any[];
    bookmarks: any[];
    settings: any;
  }): Promise<void> {
    try {
      const storageData = {
        categories: data.categories,
        bookmarks: data.bookmarks,
        settings: data.settings,
        // 添加同步时间戳
        last_updated: Date.now(),
      };

      await chrome.storage.local.set(storageData);

      if (DEBUG_ENABLED) {
        console.log('[Storage Bridge] Saved local data:', {
          categoriesCount: data.categories.length,
          bookmarksCount: data.bookmarks.length,
          hasSettings: !!data.settings,
        });
      }

      // 触发存储变化事件，通知UI更新
      this.notifyStorageChange(storageData);
    } catch (error) {
      if (DEBUG_ENABLED) {
        console.error('[Storage Bridge] Failed to save local data:', error);
      }
      throw error;
    }
  }

  /**
   * 从同步数据包恢复到本地存储
   */
  async restoreFromSyncPackage(syncPackage: SyncDataPackage): Promise<void> {
    try {
      await this.saveLocalData({
        categories: syncPackage.categories,
        bookmarks: syncPackage.bookmarks,
        settings: syncPackage.settings,
      });

      // 保存同步元数据
      await this.saveSyncMetadata(syncPackage.metadata);

      if (DEBUG_ENABLED) {
        console.log('[Storage Bridge] Restored from sync package');
      }
    } catch (error) {
      if (DEBUG_ENABLED) {
        console.error('[Storage Bridge] Failed to restore from sync package:', error);
      }
      throw error;
    }
  }

  /**
   * 读取WebDAV配置
   */
  async loadWebDAVConfig(): Promise<any> {
    try {
      const result = await chrome.storage.local.get([STORAGE_KEYS.WEBDAV_CONFIG]);
      return result[STORAGE_KEYS.WEBDAV_CONFIG] || null;
    } catch (error) {
      if (DEBUG_ENABLED) {
        console.error('[Storage Bridge] Failed to load WebDAV config:', error);
      }
      return null;
    }
  }

  /**
   * 保存WebDAV配置
   */
  async saveWebDAVConfig(config: any): Promise<void> {
    try {
      await chrome.storage.local.set({
        [STORAGE_KEYS.WEBDAV_CONFIG]: config,
      });

      if (DEBUG_ENABLED) {
        console.log('[Storage Bridge] Saved WebDAV config');
      }
    } catch (error) {
      if (DEBUG_ENABLED) {
        console.error('[Storage Bridge] Failed to save WebDAV config:', error);
      }
      throw error;
    }
  }

  /**
   * 读取同步元数据
   */
  async loadSyncMetadata(): Promise<any> {
    try {
      const result = await chrome.storage.local.get([STORAGE_KEYS.SYNC_METADATA]);
      return result[STORAGE_KEYS.SYNC_METADATA] || null;
    } catch (error) {
      if (DEBUG_ENABLED) {
        console.error('[Storage Bridge] Failed to load sync metadata:', error);
      }
      return null;
    }
  }

  /**
   * 保存同步元数据
   */
  async saveSyncMetadata(metadata: any): Promise<void> {
    try {
      await chrome.storage.local.set({
        [STORAGE_KEYS.SYNC_METADATA]: metadata,
        [STORAGE_KEYS.LAST_SYNC_TIME]: Date.now(),
      });

      if (DEBUG_ENABLED) {
        console.log('[Storage Bridge] Saved sync metadata');
      }
    } catch (error) {
      if (DEBUG_ENABLED) {
        console.error('[Storage Bridge] Failed to save sync metadata:', error);
      }
      throw error;
    }
  }

  /**
   * 读取同步状态
   */
  async loadSyncStatus(): Promise<any> {
    try {
      const result = await chrome.storage.local.get([STORAGE_KEYS.SYNC_STATUS]);
      return result[STORAGE_KEYS.SYNC_STATUS] || { status: 'idle' };
    } catch (error) {
      if (DEBUG_ENABLED) {
        console.error('[Storage Bridge] Failed to load sync status:', error);
      }
      return { status: 'idle' };
    }
  }

  /**
   * 保存同步状态
   */
  async saveSyncStatus(status: any): Promise<void> {
    try {
      await chrome.storage.local.set({
        [STORAGE_KEYS.SYNC_STATUS]: status,
      });

      if (DEBUG_ENABLED) {
        console.log('[Storage Bridge] Saved sync status:', status.status);
      }

      // 通知状态变化
      this.notifyStatusChange(status);
    } catch (error) {
      if (DEBUG_ENABLED) {
        console.error('[Storage Bridge] Failed to save sync status:', error);
      }
      throw error;
    }
  }

  /**
   * 读取设备信息
   */
  async loadDeviceInfo(): Promise<any> {
    try {
      const result = await chrome.storage.local.get([STORAGE_KEYS.DEVICE_INFO]);
      return result[STORAGE_KEYS.DEVICE_INFO] || null;
    } catch (error) {
      if (DEBUG_ENABLED) {
        console.error('[Storage Bridge] Failed to load device info:', error);
      }
      return null;
    }
  }

  /**
   * 保存设备信息
   */
  async saveDeviceInfo(deviceInfo: any): Promise<void> {
    try {
      await chrome.storage.local.set({
        [STORAGE_KEYS.DEVICE_INFO]: deviceInfo,
      });

      if (DEBUG_ENABLED) {
        console.log('[Storage Bridge] Saved device info');
      }
    } catch (error) {
      if (DEBUG_ENABLED) {
        console.error('[Storage Bridge] Failed to save device info:', error);
      }
      throw error;
    }
  }

  /**
   * 读取冲突数据
   */
  async loadConflictData(): Promise<any> {
    try {
      const result = await chrome.storage.local.get([STORAGE_KEYS.CONFLICT_DATA]);
      return result[STORAGE_KEYS.CONFLICT_DATA] || null;
    } catch (error) {
      if (DEBUG_ENABLED) {
        console.error('[Storage Bridge] Failed to load conflict data:', error);
      }
      return null;
    }
  }

  /**
   * 保存冲突数据
   */
  async saveConflictData(conflictData: any): Promise<void> {
    try {
      await chrome.storage.local.set({
        [STORAGE_KEYS.CONFLICT_DATA]: conflictData,
      });

      if (DEBUG_ENABLED) {
        console.log('[Storage Bridge] Saved conflict data');
      }
    } catch (error) {
      if (DEBUG_ENABLED) {
        console.error('[Storage Bridge] Failed to save conflict data:', error);
      }
      throw error;
    }
  }

  /**
   * 清除冲突数据
   */
  async clearConflictData(): Promise<void> {
    try {
      await chrome.storage.local.remove([STORAGE_KEYS.CONFLICT_DATA]);

      if (DEBUG_ENABLED) {
        console.log('[Storage Bridge] Cleared conflict data');
      }
    } catch (error) {
      if (DEBUG_ENABLED) {
        console.error('[Storage Bridge] Failed to clear conflict data:', error);
      }
      throw error;
    }
  }

  /**
   * 检查同步锁
   */
  async checkSyncLock(): Promise<boolean> {
    try {
      const result = await chrome.storage.local.get([STORAGE_KEYS.SYNC_LOCK]);
      const lockData = result[STORAGE_KEYS.SYNC_LOCK];
      
      if (!lockData) {
        return false;
      }

      // 检查锁是否过期（5分钟）
      const now = Date.now();
      const lockExpiry = lockData.timestamp + (5 * 60 * 1000);
      
      if (now > lockExpiry) {
        // 锁已过期，清除它
        await this.clearSyncLock();
        return false;
      }

      return true;
    } catch (error) {
      if (DEBUG_ENABLED) {
        console.error('[Storage Bridge] Failed to check sync lock:', error);
      }
      return false;
    }
  }

  /**
   * 设置同步锁
   */
  async setSyncLock(): Promise<boolean> {
    try {
      const isLocked = await this.checkSyncLock();
      if (isLocked) {
        return false;
      }

      await chrome.storage.local.set({
        [STORAGE_KEYS.SYNC_LOCK]: {
          timestamp: Date.now(),
          pid: Math.random().toString(36).substring(2),
        },
      });

      if (DEBUG_ENABLED) {
        console.log('[Storage Bridge] Set sync lock');
      }

      return true;
    } catch (error) {
      if (DEBUG_ENABLED) {
        console.error('[Storage Bridge] Failed to set sync lock:', error);
      }
      return false;
    }
  }

  /**
   * 清除同步锁
   */
  async clearSyncLock(): Promise<void> {
    try {
      await chrome.storage.local.remove([STORAGE_KEYS.SYNC_LOCK]);

      if (DEBUG_ENABLED) {
        console.log('[Storage Bridge] Cleared sync lock');
      }
    } catch (error) {
      if (DEBUG_ENABLED) {
        console.error('[Storage Bridge] Failed to clear sync lock:', error);
      }
    }
  }

  /**
   * 获取最后同步时间
   */
  async getLastSyncTime(): Promise<number> {
    try {
      const result = await chrome.storage.local.get([STORAGE_KEYS.LAST_SYNC_TIME]);
      return result[STORAGE_KEYS.LAST_SYNC_TIME] || 0;
    } catch (error) {
      if (DEBUG_ENABLED) {
        console.error('[Storage Bridge] Failed to get last sync time:', error);
      }
      return 0;
    }
  }

  /**
   * 清除所有同步相关数据
   */
  async clearSyncData(): Promise<void> {
    try {
      await chrome.storage.local.remove([
        STORAGE_KEYS.SYNC_METADATA,
        STORAGE_KEYS.SYNC_STATUS,
        STORAGE_KEYS.LAST_SYNC_TIME,
        STORAGE_KEYS.SYNC_LOCK,
        STORAGE_KEYS.CONFLICT_DATA,
      ]);

      if (DEBUG_ENABLED) {
        console.log('[Storage Bridge] Cleared all sync data');
      }
    } catch (error) {
      if (DEBUG_ENABLED) {
        console.error('[Storage Bridge] Failed to clear sync data:', error);
      }
      throw error;
    }
  }

  /**
   * 通知存储变化（触发UI更新）
   */
  private notifyStorageChange(data: any): void {
    try {
      // 通过Chrome消息系统通知其他页面
      chrome.runtime.sendMessage({
        action: 'storage_changed',
        data: {
          changes: Object.keys(data),
          timestamp: Date.now(),
        },
      }).catch(() => {
        // 忽略没有接收者的错误
      });

      // 在background script中，可能需要向所有tabs发送消息
      if (chrome.tabs) {
        chrome.tabs.query({}, (tabs) => {
          tabs.forEach((tab) => {
            if (tab.id && tab.url && tab.url.startsWith('chrome-extension://')) {
              chrome.tabs.sendMessage(tab.id, {
                action: 'storage_changed',
                data: {
                  changes: Object.keys(data),
                  timestamp: Date.now(),
                },
              }).catch(() => {
                // 忽略发送失败的情况
              });
            }
          });
        });
      }
    } catch (error) {
      // 忽略通知错误，不影响主要功能
      if (DEBUG_ENABLED) {
        console.warn('[Storage Bridge] Failed to notify storage change:', error);
      }
    }
  }

  /**
   * 通知状态变化
   */
  private notifyStatusChange(status: any): void {
    try {
      chrome.runtime.sendMessage({
        action: 'sync_status_changed',
        data: status,
      }).catch(() => {
        // 忽略没有接收者的错误
      });

      if (chrome.tabs) {
        chrome.tabs.query({}, (tabs) => {
          tabs.forEach((tab) => {
            if (tab.id && tab.url && tab.url.startsWith('chrome-extension://')) {
              chrome.tabs.sendMessage(tab.id, {
                action: 'sync_status_changed',
                data: status,
              }).catch(() => {
                // 忽略发送失败的情况
              });
            }
          });
        });
      }
    } catch (error) {
      if (DEBUG_ENABLED) {
        console.warn('[Storage Bridge] Failed to notify status change:', error);
      }
    }
  }

  /**
   * 备份当前数据
   */
  async createDataBackup(): Promise<any> {
    try {
      const data = await this.loadLocalData();
      const metadata = await this.loadSyncMetadata();
      
      const backup = {
        data,
        metadata,
        timestamp: Date.now(),
        version: '2.0.0',
      };

      // 保存备份到特殊的存储key
      await chrome.storage.local.set({
        'data_backup': backup,
      });

      if (DEBUG_ENABLED) {
        console.log('[Storage Bridge] Created data backup');
      }

      return backup;
    } catch (error) {
      if (DEBUG_ENABLED) {
        console.error('[Storage Bridge] Failed to create backup:', error);
      }
      throw error;
    }
  }

  /**
   * 恢复数据备份
   */
  async restoreDataBackup(): Promise<boolean> {
    try {
      const result = await chrome.storage.local.get(['data_backup']);
      const backup = result.data_backup;
      
      if (!backup) {
        return false;
      }

      await this.saveLocalData(backup.data);
      
      if (backup.metadata) {
        await this.saveSyncMetadata(backup.metadata);
      }

      if (DEBUG_ENABLED) {
        console.log('[Storage Bridge] Restored data backup');
      }

      return true;
    } catch (error) {
      if (DEBUG_ENABLED) {
        console.error('[Storage Bridge] Failed to restore backup:', error);
      }
      return false;
    }
  }

  /**
   * 监听存储变化
   */
  onStorageChanged(callback: (changes: any) => void): () => void {
    const listener = (changes: any, areaName: string) => {
      if (areaName === 'local') {
        callback(changes);
      }
    };

    chrome.storage.onChanged.addListener(listener);

    // 返回取消监听的函数
    return () => {
      chrome.storage.onChanged.removeListener(listener);
    };
  }

  /**
   * 获取存储使用情况
   */
  async getStorageUsage(): Promise<{
    used: number;
    quota: number;
    percentage: number;
  }> {
    try {
      const usage = await chrome.storage.local.getBytesInUse();
      const quota = chrome.storage.local.QUOTA_BYTES || 10485760; // 10MB 默认配额
      
      return {
        used: usage,
        quota: quota,
        percentage: Math.round((usage / quota) * 100),
      };
    } catch (error) {
      if (DEBUG_ENABLED) {
        console.error('[Storage Bridge] Failed to get storage usage:', error);
      }
      return {
        used: 0,
        quota: 10485760,
        percentage: 0,
      };
    }
  }

  /**
   * 检查存储是否可用
   */
  async checkStorageAvailable(): Promise<boolean> {
    try {
      const testKey = 'storage_test_' + Date.now();
      const testValue = 'test';
      
      await chrome.storage.local.set({ [testKey]: testValue });
      const result = await chrome.storage.local.get([testKey]);
      await chrome.storage.local.remove([testKey]);
      
      return result[testKey] === testValue;
    } catch (error) {
      if (DEBUG_ENABLED) {
        console.error('[Storage Bridge] Storage availability check failed:', error);
      }
      return false;
    }
  }
}

/**
 * 创建存储桥接器实例
 */
export function createStorageBridge(): StorageBridge {
  return new StorageBridge();
}

/**
 * 全局存储桥接器实例
 */
export const storageBridge = createStorageBridge();
