/**
 * Unsplash API相关的React Hook
 */

import { useState, useEffect, useCallback } from 'react';
import type { ApiLimits, OperationResult } from '../types';
import { 
  loadSplashApiKey,
  saveSplashApiKey,
  loadSplashApiLimits,
  saveSplashApiLimits
} from '../utils/storage';

/**
 * Unsplash API管理Hook
 */
export function useSplashApi() {
  const [apiKey, setApiKey] = useState<string>('');
  const [apiLimits, setApiLimits] = useState<ApiLimits | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 加载API配置
  const loadApiConfig = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const [keyResult, limitsResult] = await Promise.all([
        loadSplashApiKey(),
        loadSplashApiLimits()
      ]);

      if (keyResult.success) {
        setApiKey(keyResult.data || '');
      }

      if (limitsResult.success) {
        setApiLimits(limitsResult.data);
      }

      if (!keyResult.success || !limitsResult.success) {
        setError('加载API配置失败');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '未知错误');
    } finally {
      setLoading(false);
    }
  }, []);

  // 保存API密钥
  const saveApiKey = useCallback(async (key: string) => {
    setError(null);
    
    try {
      const result = await saveSplashApiKey(key);
      if (result.success) {
        setApiKey(key);
        return { success: true };
      } else {
        setError(result.error || '保存API密钥失败');
        return { success: false, error: result.error };
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : '未知错误';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    }
  }, []);

  // 更新API限制信息
  const updateApiLimits = useCallback(async (limits: ApiLimits) => {
    setError(null);
    
    try {
      const result = await saveSplashApiLimits(limits);
      if (result.success) {
        setApiLimits(limits);
        return { success: true };
      } else {
        setError(result.error || '保存API限制信息失败');
        return { success: false, error: result.error };
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : '未知错误';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    }
  }, []);

  // 检查API是否可用
  const isApiAvailable = useCallback(() => {
    return apiKey.trim() !== '';
  }, [apiKey]);

  // 检查API是否达到限制
  const isApiLimited = useCallback(() => {
    if (!apiLimits) return false;
    return apiLimits.remaining <= 0;
  }, [apiLimits]);

  // 获取API剩余次数百分比
  const getApiUsagePercentage = useCallback(() => {
    if (!apiLimits) return 0;
    return ((apiLimits.limit - apiLimits.remaining) / apiLimits.limit) * 100;
  }, [apiLimits]);

  useEffect(() => {
    loadApiConfig();
  }, [loadApiConfig]);

  return {
    apiKey,
    apiLimits,
    loading,
    error,
    saveApiKey,
    updateApiLimits,
    reload: loadApiConfig,
    isApiAvailable,
    isApiLimited,
    getApiUsagePercentage
  };
}
