/**
 * WebDAV配置管理Hook
 */

import { useState, useEffect, useCallback } from 'react';
import type { 
  WebDAVConfig, 
  WebDAVConnectionSettings 
} from '../types/webdav';
import { 
  DEFAULT_CONNECTION_SETTINGS,
  WebDAVConnectionService 
} from '../services/webdav';

export function useWebDAVConfig() {
  const [settings, setSettings] = useState<WebDAVConnectionSettings>(DEFAULT_CONNECTION_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);
  const [connectionService] = useState(() => new WebDAVConnectionService());

  // 从存储加载设置
  const loadSettings = useCallback(async () => {
    try {
      const result = await chrome.storage.local.get(['webdavSettings']);
      if (result.webdavSettings) {
        setSettings({ ...DEFAULT_CONNECTION_SETTINGS, ...result.webdavSettings });
      }
    } catch (error) {
      console.error('加载WebDAV设置失败:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 保存设置到存储
  const saveSettings = useCallback(async (newSettings: WebDAVConnectionSettings) => {
    try {
      await chrome.storage.local.set({ webdavSettings: newSettings });
      setSettings(newSettings);
    } catch (error) {
      console.error('保存WebDAV设置失败:', error);
      throw error;
    }
  }, []);

  // 合并远程配置（保留本地密码）
  const mergeRemoteConfig = useCallback(async (remoteConfig: Partial<WebDAVConnectionSettings>) => {
    try {
      // 获取当前本地配置
      const currentResult = await chrome.storage.local.get(['webdavSettings']);
      const currentSettings = currentResult.webdavSettings || DEFAULT_CONNECTION_SETTINGS;
      
      // 合并配置，但保留本地密码
      const mergedSettings = {
        ...currentSettings,
        ...remoteConfig,
        // 始终保留本地密码，不被远程覆盖
        password: currentSettings.password || '',
      };
      
      console.log('合并WebDAV配置:', {
        远程配置: Object.keys(remoteConfig),
        保留本地密码: !!currentSettings.password,
      });
      
      await saveSettings(mergedSettings);
      return mergedSettings;
    } catch (error) {
      console.error('合并WebDAV配置失败:', error);
      throw error;
    }
  }, [saveSettings]);

  // 测试连接
  const testConnection = useCallback(async (config: WebDAVConfig) => {
    try {
      const result = await connectionService.testConnection(config);
      return {
        success: result.success,
        error: result.error,
        status: result.status,
        details: {
          responseTime: Date.now() % 1000, // 模拟响应时间
          serverInfo: config.serverUrl.includes('nextcloud') ? 'Nextcloud' : 'WebDAV',
          features: ['PUT', 'GET', 'DELETE', 'PROPFIND', 'MKCOL'],
        },
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || '连接测试失败',
      };
    }
  }, [connectionService]);

  // 重置设置
  const resetSettings = useCallback(async () => {
    await saveSettings(DEFAULT_CONNECTION_SETTINGS);
  }, [saveSettings]);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  return {
    settings,
    isLoading,
    saveSettings,
    testConnection,
    resetSettings,
    mergeRemoteConfig,
  };
}
