/**
 * WebDAV同步功能的React Hook
 * 提供WebDAV配置管理、同步操作和状态监控
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import type { WebDAVConfig, SyncResult, SyncStatus, ConflictResolution } from '../../services/webdav';

/**
 * 同步状态接口
 */
export interface WebDAVSyncState {
  // 配置状态
  config: WebDAVConfig | null;
  isConfigured: boolean;
  
  // 同步状态
  syncStatus: SyncStatus;
  lastSyncTime: number;
  isConnected: boolean;
  hasConflict: boolean;
  
  // UI状态
  isLoading: boolean;
  isTesting: boolean;
  error: string | null;
  message: string | null;
}

/**
 * Hook返回的操作方法
 */
export interface WebDAVSyncActions {
  // 配置管理
  updateConfig: (config: WebDAVConfig) => Promise<boolean>;
  testConnection: () => Promise<boolean>;
  clearConfig: () => Promise<void>;
  
  // 同步操作
  sync: (options?: any) => Promise<SyncResult | null>;
  upload: (options?: any) => Promise<SyncResult | null>;
  download: () => Promise<SyncResult | null>;
  
  // 冲突解决
  resolveConflict: (resolution: ConflictResolution) => Promise<boolean>;
  
  // 自动同步控制
  enableAutoSync: (enabled: boolean, interval?: number) => Promise<boolean>;
  
  // 状态刷新
  refreshStatus: () => Promise<void>;
}

/**
 * Hook选项
 */
export interface UseWebDAVSyncOptions {
  /** 是否自动加载配置 */
  autoLoadConfig?: boolean;
  /** 是否自动刷新状态 */
  autoRefreshStatus?: boolean;
  /** 状态刷新间隔（毫秒） */
  refreshInterval?: number;
  /** 错误回调 */
  onError?: (error: string) => void;
  /** 同步完成回调 */
  onSyncComplete?: (result: SyncResult) => void;
}

/**
 * 默认状态
 */
const DEFAULT_STATE: WebDAVSyncState = {
  config: null,
  isConfigured: false,
  syncStatus: 'idle',
  lastSyncTime: 0,
  isConnected: false,
  hasConflict: false,
  isLoading: false,
  isTesting: false,
  error: null,
  message: null,
};

/**
 * WebDAV同步Hook
 */
export function useWebDAVSync(options: UseWebDAVSyncOptions = {}): [WebDAVSyncState, WebDAVSyncActions] {
  const {
    autoLoadConfig = true,
    autoRefreshStatus = true,
    refreshInterval = 30000,
    onError,
    onSyncComplete,
  } = options;

  const [state, setState] = useState<WebDAVSyncState>(DEFAULT_STATE);
  const refreshTimerRef = useRef<number | null>(null);
  const messageListenerRef = useRef<((message: any) => void) | null>(null);
  const loadConfigRef = useRef<(() => Promise<void>) | null>(null);
  const refreshStatusRef = useRef<(() => Promise<void>) | null>(null);

  /**
   * 发送消息到background script
   */
  const sendMessage = useCallback(async (action: string, data?: any): Promise<any> => {
    try {
      const response = await chrome.runtime.sendMessage({
        action,
        ...data,
      });
      
      // 检查响应是否存在
      if (!response) {
        throw new Error('No response from background script');
      }
      
      if (response.success === false && response.error) {
        throw new Error(response.error);
      }
      
      return response;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      if (onError) {
        onError(errorMessage);
      }
      throw error;
    }
  }, [onError]);

  /**
   * 加载WebDAV配置
   */
  const loadConfig = useCallback(async (): Promise<void> => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      
      const result = await chrome.storage.local.get(['webdav_config']);
      const config = result.webdav_config || null;
      
      setState(prev => ({
        ...prev,
        config,
        isConfigured: !!(config && config.serverUrl && config.username),
        isLoading: false,
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load config';
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));
      if (onError) {
        onError(errorMessage);
      }
    }
  }, [onError]);

  /**
   * 刷新同步状态
   */
  const refreshStatus = useCallback(async (): Promise<void> => {
    try {
      const response = await sendMessage('webdav_get_status');
      
      if (response && response.success) {
        setState(prev => ({
          ...prev,
          syncStatus: response.status || 'idle',
          lastSyncTime: response.lastSyncTime || 0,
          hasConflict: response.hasConflict || false,
          message: response.message || null,
          error: null,
        }));
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to get status';
      setState(prev => ({
        ...prev,
        error: errorMessage,
      }));
    }
  }, [sendMessage]);

  /**
   * 更新WebDAV配置
   */
  const updateConfig = useCallback(async (config: WebDAVConfig): Promise<boolean> => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      
      const response = await sendMessage('webdav_update_config', { config });
      
      if (response && response.success) {
        setState(prev => ({
          ...prev,
          config,
          isConfigured: !!(config.serverUrl && config.username),
          isLoading: false,
          message: 'Configuration updated successfully',
        }));
        return true;
      } else {
        throw new Error(response?.error || 'Failed to update config');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update config';
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));
      return false;
    }
  }, [sendMessage]);

  /**
   * 测试WebDAV连接
   */
  const testConnection = useCallback(async (): Promise<boolean> => {
    try {
      setState(prev => ({ ...prev, isTesting: true, error: null }));
      
      const response = await sendMessage('webdav_test_connection');
      const isConnected = response && response.success;
      
      setState(prev => ({
        ...prev,
        isTesting: false,
        isConnected,
        message: isConnected ? 'Connection successful' : 'Connection failed',
        error: isConnected ? null : (response?.error || 'Connection failed'),
      }));
      
      return isConnected;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Connection test failed';
      setState(prev => ({
        ...prev,
        isTesting: false,
        isConnected: false,
        error: errorMessage,
      }));
      return false;
    }
  }, [sendMessage]);

  /**
   * 执行同步
   */
  const sync = useCallback(async (options?: any): Promise<SyncResult | null> => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      
      const response = await sendMessage('webdav_sync', { options });
      const result = response?.result;
      
      if (response && response.success) {
        setState(prev => ({
          ...prev,
          isLoading: false,
          syncStatus: result?.status || 'idle',
          hasConflict: result?.hasConflict || false,
          message: result?.message || 'Sync completed',
          error: null,
        }));
        
        if (result && onSyncComplete) {
          onSyncComplete(result);
        }
        
        return result;
      } else {
        throw new Error(response?.error || 'Sync failed');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Sync failed';
      setState(prev => ({
        ...prev,
        isLoading: false,
        syncStatus: 'error',
        error: errorMessage,
      }));
      return null;
    }
  }, [sendMessage, onSyncComplete]);

  /**
   * 上传数据
   */
  const upload = useCallback(async (options?: any): Promise<SyncResult | null> => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      
      const response = await sendMessage('webdav_upload', { options });
      const result = response?.result;
      
      if (response && response.success) {
        setState(prev => ({
          ...prev,
          isLoading: false,
          message: result?.message || 'Upload completed',
          error: null,
        }));
        
        return result;
      } else {
        throw new Error(response?.error || 'Upload failed');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Upload failed';
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));
      return null;
    }
  }, [sendMessage]);

  /**
   * 下载数据
   */
  const download = useCallback(async (): Promise<SyncResult | null> => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      
      const response = await sendMessage('webdav_download');
      const result = response?.result;
      
      if (response && response.success) {
        setState(prev => ({
          ...prev,
          isLoading: false,
          message: result?.message || 'Download completed',
          error: null,
        }));
        
        return result;
      } else {
        throw new Error(response?.error || 'Download failed');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Download failed';
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));
      return null;
    }
  }, [sendMessage]);

  /**
   * 解决冲突
   */
  const resolveConflict = useCallback(async (resolution: ConflictResolution): Promise<boolean> => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      
      const response = await sendMessage('webdav_resolve_conflict', { resolution });
      
      if (response && response.success) {
        setState(prev => ({
          ...prev,
          isLoading: false,
          hasConflict: false,
          message: 'Conflict resolved successfully',
        }));
        
        return true;
      } else {
        throw new Error(response?.error || 'Failed to resolve conflict');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to resolve conflict';
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));
      return false;
    }
  }, [sendMessage]);

  /**
   * 启用/禁用自动同步
   */
  const enableAutoSync = useCallback(async (enabled: boolean, interval?: number): Promise<boolean> => {
    try {
      const response = await sendMessage('webdav_enable_auto_sync', { enabled, interval });
      
      if (response && response.success) {
        setState(prev => ({
          ...prev,
          message: enabled ? 'Auto sync enabled' : 'Auto sync disabled',
        }));
        
        return true;
      } else {
        throw new Error(response?.error || 'Failed to toggle auto sync');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to toggle auto sync';
      setState(prev => ({
        ...prev,
        error: errorMessage,
      }));
      return false;
    }
  }, [sendMessage]);

  /**
   * 清除配置
   */
  const clearConfig = useCallback(async (): Promise<void> => {
    try {
      const response = await sendMessage('webdav_clear_sync_data');
      
      if (response && response.success) {
        await chrome.storage.local.remove(['webdav_config']);
        
        setState(prev => ({
          ...prev,
          config: null,
          isConfigured: false,
          message: 'Configuration cleared',
        }));
      } else {
        throw new Error(response?.error || 'Failed to clear config');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to clear config';
      setState(prev => ({
        ...prev,
        error: errorMessage,
      }));
    }
  }, [sendMessage]);

  /**
   * 设置消息监听器
   */
  useEffect(() => {
    const handleMessage = (message: any) => {
      if (message.action === 'sync_status_changed') {
        setState(prev => ({
          ...prev,
          syncStatus: message.data?.status || prev.syncStatus,
          message: message.data?.message || prev.message,
        }));
      } else if (message.action === 'storage_changed') {
        // 重新加载配置
        if (loadConfigRef.current) {
          loadConfigRef.current();
        }
      }
    };

    messageListenerRef.current = handleMessage;
    chrome.runtime.onMessage.addListener(handleMessage);

    return () => {
      if (messageListenerRef.current) {
        chrome.runtime.onMessage.removeListener(messageListenerRef.current);
      }
    };
  }, []);

  /**
   * 更新函数引用
   */
  useEffect(() => {
    loadConfigRef.current = loadConfig;
    refreshStatusRef.current = refreshStatus;
  });

  /**
   * 初始化和定时刷新
   */
  useEffect(() => {
    if (autoLoadConfig && loadConfigRef.current) {
      loadConfigRef.current();
    }
    
    if (autoRefreshStatus && refreshStatusRef.current) {
      refreshStatusRef.current();
      
      refreshTimerRef.current = setInterval(() => {
        if (refreshStatusRef.current) {
          refreshStatusRef.current();
        }
      }, refreshInterval) as unknown as number;
    }

    return () => {
      if (refreshTimerRef.current) {
        clearInterval(refreshTimerRef.current);
      }
    };
  }, [autoLoadConfig, autoRefreshStatus, refreshInterval]);

  /**
   * 清理定时器
   */
  useEffect(() => {
    return () => {
      if (refreshTimerRef.current) {
        clearInterval(refreshTimerRef.current);
      }
    };
  }, []);

  // 构建actions对象
  const actions: WebDAVSyncActions = {
    updateConfig,
    testConnection,
    clearConfig,
    sync,
    upload,
    download,
    resolveConflict,
    enableAutoSync,
    refreshStatus,
  };

  return [state, actions];
}

/**
 * 简化版本的WebDAV同步Hook，只包含基本功能
 */
export function useWebDAVSyncSimple() {
  const [state, actions] = useWebDAVSync({
    autoLoadConfig: true,
    autoRefreshStatus: false,
  });

  return {
    isConfigured: state.isConfigured,
    syncStatus: state.syncStatus,
    isLoading: state.isLoading,
    error: state.error,
    sync: actions.sync,
    updateConfig: actions.updateConfig,
  };
}