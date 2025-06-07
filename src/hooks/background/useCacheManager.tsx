/**
 * 缓存管理Hook
 * 提供图片缓存的状态管理和操作方法
 */

import { useState, useEffect, useCallback } from 'react';
import type { 
  CacheSettings, 
  CacheStats, 
  CacheOperationResult 
} from '@/types/background/cacheSettings';
import { CacheManagerService } from '@/services/background/cacheManagerService';

export function useCacheManager() {
  const [settings, setSettings] = useState<CacheSettings | null>(null);
  const [stats, setStats] = useState<CacheStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [operating, setOperating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 加载缓存设置
  const loadSettings = useCallback(async () => {
    try {
      setError(null);
      const data = await CacheManagerService.getSettings();
      setSettings(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载缓存设置失败');
    }
  }, []);

  // 加载缓存统计
  const loadStats = useCallback(async () => {
    try {
      setError(null);
      const data = await CacheManagerService.getStats();
      setStats(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载缓存统计失败');
    }
  }, []);

  // 加载所有数据
  const loadData = useCallback(async () => {
    setLoading(true);
    await Promise.all([loadSettings(), loadStats()]);
    setLoading(false);
  }, [loadSettings, loadStats]);

  // 更新缓存设置
  const updateSettings = useCallback(async (newSettings: Partial<CacheSettings>) => {
    if (!settings) return;

    try {
      setError(null);
      const updatedSettings = { ...settings, ...newSettings };
      await CacheManagerService.saveSettings(updatedSettings);
      setSettings(updatedSettings);
      
      // 设置更新后重新加载统计
      await loadStats();
    } catch (err) {
      setError(err instanceof Error ? err.message : '保存缓存设置失败');
      throw err;
    }
  }, [settings, loadStats]);

  // 清理缓存
  const cleanupCache = useCallback(async (
    strategy: 'all' | 'expired' | 'lru' | 'size' = 'lru'
  ): Promise<CacheOperationResult> => {
    try {
      setOperating(true);
      setError(null);
      
      const result = await CacheManagerService.cleanupCache(strategy);
      
      if (result.success) {
        // 清理成功，重新加载统计
        await loadStats();
      } else {
        setError(result.message);
      }
      
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '缓存清理失败';
      setError(errorMessage);
      return {
        success: false,
        message: errorMessage
      };
    } finally {
      setOperating(false);
    }
  }, [loadStats]);

  // 预加载图片
  const preloadImages = useCallback(async (): Promise<CacheOperationResult> => {
    try {
      setOperating(true);
      setError(null);
      
      const result = await CacheManagerService.preloadImages();
      
      if (result.success) {
        await loadStats();
      } else {
        setError(result.message);
      }
      
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '预加载失败';
      setError(errorMessage);
      return {
        success: false,
        message: errorMessage
      };
    } finally {
      setOperating(false);
    }
  }, [loadStats]);

  // 记录访问
  const recordAccess = useCallback(async (imageId: string, category: string) => {
    try {
      await CacheManagerService.recordAccess(imageId, category);
      // 可选：重新加载统计以更新最近访问记录
      // await loadStats();
    } catch (err) {
    }
  }, []);

  // 计算缓存使用率
  const getUsagePercentage = useCallback(() => {
    if (!settings || !stats) return 0;
    return Math.round((stats.currentSizeInMB / settings.maxSizeInMB) * 100);
  }, [settings, stats]);

  // 格式化文件大小
  const formatSize = useCallback((sizeInMB: number) => {
    if (sizeInMB < 1) {
      return `${Math.round(sizeInMB * 1024)} KB`;
    } else if (sizeInMB < 1024) {
      return `${Math.round(sizeInMB * 10) / 10} MB`;
    } else {
      return `${Math.round((sizeInMB / 1024) * 10) / 10} GB`;
    }
  }, []);

  // 获取缓存健康状态
  const getCacheHealth = useCallback(() => {
    if (!settings || !stats) {
      return { status: 'unknown', message: '数据加载中...' };
    }

    const usagePercentage = getUsagePercentage();
    
    if (usagePercentage < 50) {
      return { status: 'good', message: '缓存状态良好' };
    } else if (usagePercentage < 80) {
      return { status: 'warning', message: '缓存使用率较高，建议清理' };
    } else {
      return { status: 'danger', message: '缓存空间不足，需要立即清理' };
    }
  }, [settings, stats, getUsagePercentage]);

  // 获取推荐的清理策略
  const getRecommendedCleanupStrategy = useCallback(() => {
    if (!stats) return 'lru';
    
    const usagePercentage = getUsagePercentage();
    
    if (usagePercentage > 90) {
      return 'size'; // 空间严重不足，删除大文件
    } else if (usagePercentage > 70) {
      return 'lru'; // 删除最少使用的文件
    } else {
      return 'expired'; // 只清理过期文件
    }
  }, [stats, getUsagePercentage]);

  // 获取分类统计摘要
  const getCategorySummary = useCallback(() => {
    if (!stats?.details.categoryCount) return [];
    
    return Object.entries(stats.details.categoryCount)
      .map(([category, count]) => ({
        category,
        count,
        size: stats.details.categorySize[category] || 0,
        percentage: stats.currentSizeInMB > 0 
          ? Math.round(((stats.details.categorySize[category] || 0) / stats.currentSizeInMB) * 100)
          : 0
      }))
      .sort((a, b) => b.size - a.size);
  }, [stats]);

  // 检查是否需要自动清理
  const needsAutoCleanup = useCallback(() => {
    if (!settings?.autoCleanup.enabled || !stats) return false;
    
    const usagePercentage = getUsagePercentage();
    return usagePercentage >= settings.autoCleanup.threshold;
  }, [settings, stats, getUsagePercentage]);

  // 触发自动清理检查
  const checkAutoCleanup = useCallback(async () => {
    if (needsAutoCleanup() && settings?.autoCleanup.enabled) {
      return await cleanupCache(settings.autoCleanup.strategy);
    }
    return { success: true, message: '无需清理' };
  }, [needsAutoCleanup, settings, cleanupCache]);

  // 初始化加载
  useEffect(() => {
    loadData();
  }, [loadData]);

  // 定期刷新统计（每30秒）
  useEffect(() => {
    const interval = setInterval(() => {
      if (!loading && !operating) {
        loadStats();
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [loading, operating, loadStats]);

  return {
    // 状态
    settings,
    stats,
    loading,
    operating,
    error,
    
    // 操作方法
    loadData,
    loadSettings,
    loadStats,
    updateSettings,
    cleanupCache,
    preloadImages,
    recordAccess,
    checkAutoCleanup,
    
    // 计算方法
    getUsagePercentage,
    formatSize,
    getCacheHealth,
    getRecommendedCleanupStrategy,
    getCategorySummary,
    needsAutoCleanup,
    
    // 便捷访问
    maxSizeInMB: settings?.maxSizeInMB || 0,
    currentSizeInMB: stats?.currentSizeInMB || 0,
    fileCount: stats?.fileCount || 0,
    isAutoCleanupEnabled: settings?.autoCleanup.enabled || false,
    cacheHealth: getCacheHealth(),
    categorySummary: getCategorySummary()
  };
}
