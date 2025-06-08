/**
 * 存储桥接器模块
 * 连接WebDAV同步服务和Chrome存储系统
 */

import type { SyncDataPackage } from './types';
import { STORAGE_KEYS } from './constants';

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
      // 加载所有设置相关的键
      const result = await chrome.storage.local.get([
        'categories',
        'bookmarks', 
        'settings',
        'app_settings',       // 应用主设置
        'networkMode',        // 网络模式
        'selectedCategoryId', // 选中的分类
        'auto_sync_config',   // 自动同步配置
        'sync_time_record',   // 同步时间记录
        'auto_switch_settings', // 背景自动切换设置
        'auto_switch_state',  // 背景自动切换状态
        'cache_settings',     // 缓存设置
        'cache_stats'         // 缓存统计
      ]);

      // 合并所有设置到一个统一的settings对象中
      const mergedSettings = {
        // 兼容旧版本的settings
        ...(result.settings || {}),
        // 新版本的app_settings
        app_settings: result.app_settings || null,
        // 网络模式
        networkMode: result.networkMode || 'external',
        // 选中的分类ID
        selectedCategoryId: result.selectedCategoryId || null,
        // 自动同步配置
        auto_sync_config: result.auto_sync_config || null,
        // 同步时间记录
        sync_time_record: result.sync_time_record || null,
        // 背景自动切换设置
        auto_switch_settings: result.auto_switch_settings || null,
        // 背景自动切换状态
        auto_switch_state: result.auto_switch_state || null,
        // 缓存设置
        cache_settings: result.cache_settings || null,
        // 缓存统计
        cache_stats: result.cache_stats || null,
      };


      return {
        categories: result.categories || [],
        bookmarks: result.bookmarks || [],
        settings: mergedSettings,
      };
    } catch (error) {
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
    await this.saveLocalDataSilently(data);
    
    // 触发通知
    this.notifyStorageChange({
      categories: true,
      bookmarks: true,
      settings: true,
    });

    // 触发自动同步数据变更事件
    this.triggerAutoSyncDataChange();
  }

  /**
   * 静默保存数据到本地存储（不触发通知）
   */
  private async saveLocalDataSilently(data: {
    categories: any[];
    bookmarks: any[];
    settings: any;
  }): Promise<void> {
    try {
      // 基础数据
      const storageData: Record<string, any> = {
        categories: data.categories,
        bookmarks: data.bookmarks,
        // 添加同步时间戳
        last_updated: Date.now(),
      };

      // 处理设置数据：分离不同类型的设置到对应的存储键
      if (data.settings) {
        // 保存app_settings
        if (data.settings.app_settings) {
          storageData.app_settings = data.settings.app_settings;
        }
        
        // 保存networkMode
        if (data.settings.networkMode !== undefined) {
          storageData.networkMode = data.settings.networkMode;
        }
        
        // 保存selectedCategoryId
        if (data.settings.selectedCategoryId !== undefined) {
          storageData.selectedCategoryId = data.settings.selectedCategoryId;
        }
        
        // 保存auto_sync_config
        if (data.settings.auto_sync_config !== undefined) {
          storageData.auto_sync_config = data.settings.auto_sync_config;
        }
        
        // 保存sync_time_record
        if (data.settings.sync_time_record !== undefined) {
          storageData.sync_time_record = data.settings.sync_time_record;
        }
        
        // 保存auto_switch_settings
        if (data.settings.auto_switch_settings !== undefined) {
          storageData.auto_switch_settings = data.settings.auto_switch_settings;
        }
        
        // 保存auto_switch_state
        if (data.settings.auto_switch_state !== undefined) {
          storageData.auto_switch_state = data.settings.auto_switch_state;
        }
        
        // 保存cache_settings
        if (data.settings.cache_settings !== undefined) {
          storageData.cache_settings = data.settings.cache_settings;
        }
        
        // 保存cache_stats
        if (data.settings.cache_stats !== undefined) {
          storageData.cache_stats = data.settings.cache_stats;
        }
        
        // 保存其余设置到通用的settings键
        const { 
          app_settings, networkMode, selectedCategoryId, auto_sync_config, sync_time_record,
          auto_switch_settings, auto_switch_state, cache_settings, cache_stats,
          ...otherSettings 
        } = data.settings;
        if (Object.keys(otherSettings).length > 0) {
          storageData.settings = otherSettings;
        }
      }

      await chrome.storage.local.set(storageData);

      // 清除存储缓存，确保后续读取获取最新数据
      try {
        const { clearCache } = await import('@/utils/storage');
        clearCache();
      } catch (error) {
        // 忽略清除缓存失败的错误
      }
    } catch (error) {
      throw error;
    }
  }

  /**
   * 从同步数据包恢复到本地存储
   */
  async restoreFromSyncPackage(syncPackage: SyncDataPackage): Promise<void> {
    try {
      // 先加载当前数据进行对比
      const currentData = await this.loadLocalData();
      
      // 检查数据是否真的发生了变化（忽略时间戳）
      const changes = this.detectDataChanges(currentData, {
        categories: syncPackage.categories,
        bookmarks: syncPackage.bookmarks,
        settings: syncPackage.settings,
      });

      // 如果没有实质性变化，只更新同步元数据
      if (!changes.hasChanges) {
        await this.saveSyncMetadata(syncPackage.metadata);
        return;
      }

      // 有变化时才保存数据
      await this.saveLocalDataSilently({
        categories: syncPackage.categories,
        bookmarks: syncPackage.bookmarks,
        settings: syncPackage.settings,
      });

      // 保存同步元数据
      await this.saveSyncMetadata(syncPackage.metadata);

      // 只通知实际发生变化的部分
      this.notifyStorageChange({
        categories: changes.categoriesChanged,
        bookmarks: changes.bookmarksChanged,
        settings: changes.settingsChanged,
        webdav_sync: true
      });

    } catch (error) {
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

    } catch (error) {
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

    } catch (error) {
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


      // 通知状态变化
      this.notifyStatusChange(status);
    } catch (error) {
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

    } catch (error) {
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

    } catch (error) {
      throw error;
    }
  }

  /**
   * 清除冲突数据
   */
  async clearConflictData(): Promise<void> {
    try {
      await chrome.storage.local.remove([STORAGE_KEYS.CONFLICT_DATA]);

    } catch (error) {
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


      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * 清除同步锁
   */
  async clearSyncLock(): Promise<void> {
    try {
      await chrome.storage.local.remove([STORAGE_KEYS.SYNC_LOCK]);

    } catch (error) {
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

    } catch (error) {
      throw error;
    }
  }

  /**
   * 触发自动同步数据变更事件
   */
  private triggerAutoSyncDataChange(): void {
    try {
      // 通知自动同步调度器数据已变更
      chrome.runtime.sendMessage({
        action: 'auto_sync_data_changed',
        eventType: 'storage_change',
        timestamp: Date.now(),
      }).catch(() => {
        // 忽略发送失败，不影响主要功能
      });
    } catch (error) {
    }
  }

  /**
   * 通知存储变化（触发UI更新）
   */
  private notifyStorageChange(data: any): void {
    try {
      const message = {
        action: 'storage_changed',
        data: {
          changes: Object.keys(data),
          timestamp: Date.now(),
        },
      };

      // 通过Chrome消息系统通知其他页面
      chrome.runtime.sendMessage(message).catch(() => {
        // 忽略发送失败的错误
      });

      // 在background script中，可能需要向所有tabs发送消息
      if (chrome.tabs) {
        chrome.tabs.query({}, (tabs) => {
          tabs.forEach((tab) => {
            if (tab.id && tab.url && tab.url.startsWith('chrome-extension://')) {
              chrome.tabs.sendMessage(tab.id, message).catch(() => {
                // 忽略发送失败的错误
              });
            }
          });
        });
      }
    } catch (error) {
      // 忽略通知错误，不影响主要功能
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


      return backup;
    } catch (error) {
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


      return true;
    } catch (error) {
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
      return false;
    }
  }

  /**
   * 检测数据变化（忽略时间戳字段）
   */
  private detectDataChanges(
    currentData: { categories: any[]; bookmarks: any[]; settings: any },
    newData: { categories: any[]; bookmarks: any[]; settings: any }
  ): {
    hasChanges: boolean;
    categoriesChanged: boolean;
    bookmarksChanged: boolean;
    settingsChanged: boolean;
  } {
    try {
      // 比较分类数据
      const categoriesChanged = !this.deepEqual(
        this.normalizeForComparison(currentData.categories),
        this.normalizeForComparison(newData.categories)
      );

      // 比较书签数据
      const bookmarksChanged = !this.deepEqual(
        this.normalizeForComparison(currentData.bookmarks),
        this.normalizeForComparison(newData.bookmarks)
      );

      // 比较设置数据（排除时间戳相关字段）
      const settingsChanged = !this.deepEqual(
        this.normalizeSettingsForComparison(currentData.settings),
        this.normalizeSettingsForComparison(newData.settings)
      );

      return {
        hasChanges: categoriesChanged || bookmarksChanged || settingsChanged,
        categoriesChanged,
        bookmarksChanged,
        settingsChanged,
      };
    } catch (error) {
      // 比较出错时认为有变化，确保数据安全
      return {
        hasChanges: true,
        categoriesChanged: true,
        bookmarksChanged: true,
        settingsChanged: true,
      };
    }
  }

  /**
   * 规范化数据用于比较（移除时间戳字段）
   */
  private normalizeForComparison(data: any): any {
    if (!data) return data;

    if (Array.isArray(data)) {
      // 对于数组，按照唯一标识排序以确保一致性
      const normalizedArray = data.map(item => this.normalizeForComparison(item));
      
      // 如果是分类数组，按name排序
      if (normalizedArray.length > 0 && normalizedArray[0]?.name !== undefined) {
        return normalizedArray.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
      }
      
      // 如果是书签数组，按URL排序
      if (normalizedArray.length > 0 && normalizedArray[0]?.url !== undefined) {
        return normalizedArray.sort((a, b) => (a.url || '').localeCompare(b.url || ''));
      }
      
      return normalizedArray;
    }

    if (typeof data === 'object') {
      const normalized: any = {};
      for (const [key, value] of Object.entries(data)) {
        // 跳过时间戳相关字段
        if (this.isTimestampField(key)) {
          continue;
        }
        normalized[key] = this.normalizeForComparison(value);
      }
      return normalized;
    }

    return data;
  }

  /**
   * 规范化设置数据用于比较
   */
  private normalizeSettingsForComparison(settings: any): any {
    if (!settings) return settings;

    const normalized = { ...settings };
    
    // 移除所有时间戳相关字段
    delete normalized.last_updated;
    delete normalized.timestamp;
    delete normalized.sync_time_record;
    
    // 如果有sync_time_record，只保留非时间戳字段
    if (settings.sync_time_record) {
      const { lastUploadTime, lastDownloadTime, ...otherFields } = settings.sync_time_record;
      if (Object.keys(otherFields).length > 0) {
        normalized.sync_time_record = otherFields;
      }
    }

    return this.normalizeForComparison(normalized);
  }

  /**
   * 检查是否为时间戳字段
   */
  private isTimestampField(fieldName: string): boolean {
    const timestampFields = [
      'timestamp',
      'last_updated',
      'lastUpdated',
      'created_at',
      'createdAt',
      'modified_at',
      'modifiedAt',
      'updated_at',
      'updatedAt',
      'lastUploadTime',
      'lastDownloadTime',
      'lastSyncTime',
      'last_sync_time',
      'position' // 添加position字段，因为这也是可变的属性
    ];
    return timestampFields.includes(fieldName);
  }

  /**
   * 深度比较两个对象是否相等
   */
  private deepEqual(obj1: any, obj2: any): boolean {
    if (obj1 === obj2) {
      return true;
    }

    if (obj1 == null || obj2 == null) {
      return obj1 === obj2;
    }

    if (typeof obj1 !== typeof obj2) {
      return false;
    }

    if (Array.isArray(obj1) !== Array.isArray(obj2)) {
      return false;
    }

    if (Array.isArray(obj1)) {
      if (obj1.length !== obj2.length) {
        return false;
      }
      for (let i = 0; i < obj1.length; i++) {
        if (!this.deepEqual(obj1[i], obj2[i])) {
          return false;
        }
      }
      return true;
    }

    if (typeof obj1 === 'object') {
      const keys1 = Object.keys(obj1);
      const keys2 = Object.keys(obj2);
      
      if (keys1.length !== keys2.length) {
        return false;
      }

      for (const key of keys1) {
        if (!keys2.includes(key) || !this.deepEqual(obj1[key], obj2[key])) {
          return false;
        }
      }
      return true;
    }

    return obj1 === obj2;
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
