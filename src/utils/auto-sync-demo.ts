/**
 * 自动同步功能使用示例
 * 演示如何在实际项目中使用新的自动同步功能
 */

import React, { useEffect, useState } from 'react';
import { 
  useBookmarkDataChangeDetection, 
  useSettingsDataChangeDetection,
  useBookmarks,
  useCategories,
  useSettings 
} from '../hooks';

/**
 * 示例组件：展示数据变更检测的使用
 */
export function AutoSyncDemo() {
  // 获取数据
  const { bookmarks, loading: bookmarksLoading } = useBookmarks();
  const { categories, loading: categoriesLoading } = useCategories();
  const { settings, isLoading: settingsLoading } = useSettings();

  // 启用书签和分类的自动同步检测
  useBookmarkDataChangeDetection(bookmarks, categories, {
    enabled: !bookmarksLoading && !categoriesLoading,
    debounceDelay: 2000, // 2秒延迟
    debug: process.env.NODE_ENV === 'development',
  });

  // 启用设置的自动同步检测
  useSettingsDataChangeDetection(settings, {
    enabled: !settingsLoading,
    debounceDelay: 3000, // 3秒延迟
    debug: process.env.NODE_ENV === 'development',
  });

  return (
    <div className="p-4 border rounded-md bg-gray-50">
      <h3 className="text-lg font-semibold mb-2">自动同步状态</h3>
      <div className="space-y-2 text-sm">
        <div>书签数量: {bookmarks.length}</div>
        <div>分类数量: {categories.length}</div>
        <div>加载状态: {bookmarksLoading || categoriesLoading || settingsLoading ? '加载中' : '已完成'}</div>
        <div className="text-green-600">✓ 自动同步检测已启用</div>
      </div>
    </div>
  );
}

/**
 * 示例：手动触发自动同步事件
 */
export const manualTriggerExamples = {
  // 触发数据变更事件
  triggerDataChange: async () => {
    try {
      const response = await chrome.runtime.sendMessage({
        action: 'webdav_trigger_auto_sync',
        eventType: 'data_changed',
      });
      console.log('数据变更事件触发结果:', response);
      return response;
    } catch (error) {
      console.error('触发数据变更事件失败:', error);
      throw error;
    }
  },

  // 触发新标签页事件
  triggerTabOpen: async () => {
    try {
      const response = await chrome.runtime.sendMessage({
        action: 'webdav_trigger_auto_sync',
        eventType: 'tab_opened',
      });
      console.log('新标签页事件触发结果:', response);
      return response;
    } catch (error) {
      console.error('触发新标签页事件失败:', error);
      throw error;
    }
  },

  // 获取自动同步配置
  getConfig: async () => {
    try {
      const response = await chrome.runtime.sendMessage({
        action: 'webdav_get_auto_sync_config',
      });
      console.log('自动同步配置:', response);
      return response;
    } catch (error) {
      console.error('获取配置失败:', error);
      throw error;
    }
  },

  // 更新自动同步配置
  updateConfig: async (config: {
    enableAutoUpload?: boolean;
    enableAutoDownload?: boolean;
    uploadDelay?: number;
    downloadOnTabOpen?: boolean;
  }) => {
    try {
      const response = await chrome.runtime.sendMessage({
        action: 'webdav_update_auto_sync_config',
        config,
      });
      console.log('配置更新结果:', response);
      return response;
    } catch (error) {
      console.error('更新配置失败:', error);
      throw error;
    }
  },
};

/**
 * 示例：监听自动同步状态变化
 */
export class AutoSyncStatusMonitor {
  private listeners: ((status: any) => void)[] = [];

  constructor() {
    this.setupMessageListener();
  }

  private setupMessageListener() {
    chrome.runtime.onMessage.addListener((message) => {
      if (message.action === 'sync_status_changed') {
        this.notifyListeners(message.data);
      }
      if (message.action === 'storage_changed' && message.source === 'auto_sync_download') {
        this.notifyListeners({ type: 'auto_download_completed' });
      }
    });
  }

  addListener(callback: (status: any) => void) {
    this.listeners.push(callback);
  }

  removeListener(callback: (status: any) => void) {
    const index = this.listeners.indexOf(callback);
    if (index > -1) {
      this.listeners.splice(index, 1);
    }
  }

  private notifyListeners(status: any) {
    this.listeners.forEach(listener => {
      try {
        listener(status);
      } catch (error) {
        console.error('状态监听器错误:', error);
      }
    });
  }
}

/**
 * React Hook: 监听自动同步状态
 */
export function useAutoSyncStatus() {
  const [status, setStatus] = useState<any>(null);

  useEffect(() => {
    const monitor = new AutoSyncStatusMonitor();
    
    const handleStatusChange = (newStatus: any) => {
      setStatus(newStatus);
    };

    monitor.addListener(handleStatusChange);

    return () => {
      monitor.removeListener(handleStatusChange);
    };
  }, []);

  return status;
}

// 导出到全局供测试使用
if (typeof window !== 'undefined') {
  (window as any).autoSyncDemo = {
    manualTriggerExamples,
    AutoSyncStatusMonitor,
  };
}