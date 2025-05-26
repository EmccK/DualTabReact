/**
 * Unsplash设置管理Hook
 * 提供Unsplash API设置的状态管理和操作方法
 */

import { useState, useEffect, useCallback } from 'react';
import type { 
  UnsplashSettings, 
  UnsplashAPISettings, 
  UnsplashPreferences,
  APIUsageStats 
} from '@/types/background/unsplashSettings';
import { UnsplashSettingsService } from '@/services/background/unsplashSettingsService';

export function useUnsplashSettings() {
  const [settings, setSettings] = useState<UnsplashSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [validating, setValidating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 加载设置
  const loadSettings = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await UnsplashSettingsService.getSettings();
      setSettings(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载设置失败');
    } finally {
      setLoading(false);
    }
  }, []);

  // 保存API设置
  const updateApiSettings = useCallback(async (apiSettings: Partial<UnsplashAPISettings>) => {
    if (!settings) return;

    try {
      const updatedSettings = {
        ...settings,
        api: { ...settings.api, ...apiSettings }
      };
      
      await UnsplashSettingsService.saveSettings(updatedSettings);
      setSettings(updatedSettings);
    } catch (err) {
      setError(err instanceof Error ? err.message : '保存API设置失败');
      throw err;
    }
  }, [settings]);

  // 更新偏好设置
  const updatePreferences = useCallback(async (preferences: Partial<UnsplashPreferences>) => {
    if (!settings) return;

    try {
      const updatedSettings = {
        ...settings,
        preferences: { ...settings.preferences, ...preferences }
      };
      
      await UnsplashSettingsService.saveSettings(updatedSettings);
      setSettings(updatedSettings);
    } catch (err) {
      setError(err instanceof Error ? err.message : '保存偏好设置失败');
      throw err;
    }
  }, [settings]);

  // 验证API密钥
  const validateApiKey = useCallback(async (apiKey: string) => {
    try {
      setValidating(true);
      setError(null);
      
      const result = await UnsplashSettingsService.validateApiKey(apiKey);
      
      if (result.isValid) {
        // 更新本地设置
        await updateApiSettings({
          customApiKey: apiKey,
          useCustomKey: true,
          keyValidation: {
            isValid: true,
            lastVerified: Date.now()
          }
        });
        
        return { success: true, userInfo: result.userInfo };
      } else {
        setError(result.errorMessage || 'API密钥验证失败');
        return { success: false, error: result.errorMessage };
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'API密钥验证失败';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setValidating(false);
    }
  }, [updateApiSettings]);

  // 切换API密钥使用模式
  const toggleCustomKey = useCallback(async (useCustom: boolean) => {
    try {
      await updateApiSettings({ useCustomKey: useCustom });
    } catch (err) {
      setError(err instanceof Error ? err.message : '切换API密钥模式失败');
      throw err;
    }
  }, [updateApiSettings]);

  // 获取当前API密钥
  const getCurrentApiKey = useCallback(async () => {
    try {
      return await UnsplashSettingsService.getCurrentApiKey();
    } catch (err) {
      setError(err instanceof Error ? err.message : '获取API密钥失败');
      return '';
    }
  }, []);

  // 检查API使用限制
  const checkUsageLimits = useCallback(async () => {
    try {
      return await UnsplashSettingsService.checkUsageLimits();
    } catch (err) {
      setError(err instanceof Error ? err.message : '检查API限制失败');
      return { canRequest: false };
    }
  }, []);

  // 更新使用统计
  const updateUsageStats = useCallback(async (requestType?: 'search' | 'download' | 'random') => {
    try {
      await UnsplashSettingsService.updateUsageStats(requestType);
      // 重新加载设置以获取最新统计
      await loadSettings();
    } catch (err) {
      console.error('Failed to update usage stats:', err);
    }
  }, [loadSettings]);

  // 计算使用率百分比
  const getUsagePercentages = useCallback(() => {
    if (!settings?.usage) {
      return { hourly: 0, daily: 0, monthly: 0 };
    }

    const { usage } = settings;
    return {
      hourly: Math.round((usage.currentHourRequests / usage.limits.hourly) * 100),
      daily: Math.round((usage.dailyRequests / usage.limits.daily) * 100),
      monthly: Math.round((usage.monthlyRequests / usage.limits.monthly) * 100)
    };
  }, [settings]);

  // 格式化重置时间
  const getResetTimes = useCallback(() => {
    const now = new Date();
    const nextHour = new Date(now);
    nextHour.setHours(nextHour.getHours() + 1, 0, 0, 0);
    
    const nextDay = new Date(now);
    nextDay.setDate(nextDay.getDate() + 1);
    nextDay.setHours(0, 0, 0, 0);
    
    const nextMonth = new Date(now);
    nextMonth.setMonth(nextMonth.getMonth() + 1, 1);
    nextMonth.setHours(0, 0, 0, 0);

    return {
      hourly: nextHour,
      daily: nextDay,
      monthly: nextMonth
    };
  }, []);

  // 初始化加载
  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  return {
    // 状态
    settings,
    loading,
    validating,
    error,
    
    // 操作方法
    loadSettings,
    updateApiSettings,
    updatePreferences,
    validateApiKey,
    toggleCustomKey,
    getCurrentApiKey,
    checkUsageLimits,
    updateUsageStats,
    
    // 计算方法
    getUsagePercentages,
    getResetTimes,
    
    // 便捷访问
    apiSettings: settings?.api,
    preferences: settings?.preferences,
    usageStats: settings?.usage,
    isCustomKeyEnabled: settings?.api.useCustomKey || false,
    isApiKeyValid: settings?.api.keyValidation.isValid || false
  };
}
