/**
 * 存储相关的React Hooks
 * 提供类型安全的存储操作和状态管理
 */

import { useState, useEffect, useCallback } from 'react';
import type { 
  NetworkMode, 
  AppSettings, 
  ApiLimits, 
  BackupData,
  OperationResult 
} from '../types';
import { 
  loadNetworkMode,
  saveNetworkMode,
  loadSettings,
  saveSettings,
  loadSplashApiKey,
  saveSplashApiKey,
  loadSplashApiLimits,
  saveSplashApiLimits,
  backupData,
  restoreFromBackup
} from '../utils/storage';

/**
 * 网络模式管理Hook
 */
export function useNetworkMode() {
  const [networkMode, setNetworkMode] = useState<NetworkMode>('external');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 加载网络模式
  const loadMode = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await loadNetworkMode();
      if (result.success && result.data) {
        setNetworkMode(result.data);
      } else {
        setError(result.error || '加载网络模式失败');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '未知错误');
    } finally {
      setLoading(false);
    }
  }, []);

  // 保存网络模式
  const saveMode = useCallback(async (mode: NetworkMode) => {
    setError(null);
    
    try {
      const result = await saveNetworkMode(mode);
      if (result.success) {
        setNetworkMode(mode);
        return { success: true };
      } else {
        setError(result.error || '保存网络模式失败');
        return { success: false, error: result.error };
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : '未知错误';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    }
  }, []);

  // 切换网络模式
  const toggleMode = useCallback(async () => {
    const newMode: NetworkMode = networkMode === 'external' ? 'internal' : 'external';
    return await saveMode(newMode);
  }, [networkMode, saveMode]);

  useEffect(() => {
    loadMode();
  }, [loadMode]);

  return {
    networkMode,
    loading,
    error,
    saveMode,
    toggleMode,
    reload: loadMode
  };
}

/**
 * 应用设置管理Hook
 */
export function useAppSettings() {
  const [settings, setSettings] = useState<AppSettings>({
    networkMode: 'external',
    enableBlur: true,
    enableAnimations: true,
    autoSync: false
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // 加载设置
  const loadAppSettings = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await loadSettings();
      if (result.success && result.data) {
        setSettings(result.data);
      } else {
        setError(result.error || '加载设置失败');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '未知错误');
    } finally {
      setLoading(false);
    }
  }, []);

  // 保存设置
  const saveAppSettings = useCallback(async (newSettings: Partial<AppSettings>) => {
    setSaving(true);
    setError(null);
    
    try {
      const result = await saveSettings(newSettings);
      if (result.success) {
        setSettings(prev => ({ ...prev, ...newSettings }));
        return { success: true };
      } else {
        setError(result.error || '保存设置失败');
        return { success: false, error: result.error };
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : '未知错误';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setSaving(false);
    }
  }, []);

  // 更新单个设置项
  const updateSetting = useCallback(async <K extends keyof AppSettings>(
    key: K, 
    value: AppSettings[K]
  ) => {
    return await saveAppSettings({ [key]: value });
  }, [saveAppSettings]);

  useEffect(() => {
    loadAppSettings();
  }, [loadAppSettings]);

  return {
    settings,
    loading,
    error,
    saving,
    saveSettings: saveAppSettings,
    updateSetting,
    reload: loadAppSettings
  };
}
