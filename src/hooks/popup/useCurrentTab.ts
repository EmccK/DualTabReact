/**
 * 当前标签页信息管理Hook
 */

import { useState, useEffect, useCallback } from 'react';
import type { CurrentTabInfo, TabDetectionResult } from '@/types/popup/tab.types';
import { getCurrentTab, generateDefaultBookmarkName } from '@/utils/popup/tabHelpers';

export function useCurrentTab() {
  const [tabInfo, setTabInfo] = useState<CurrentTabInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 加载当前标签页信息
  const loadCurrentTab = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const result: TabDetectionResult = await getCurrentTab();
      
      if (result.success && result.data) {
        setTabInfo(result.data);
      } else {
        setError(result.error || '无法获取当前标签页信息');
        setTabInfo(null);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '未知错误';
      setError(errorMessage);
      setTabInfo(null);
    } finally {
      setLoading(false);
    }
  }, []);

  // 获取建议的书签名称
  const getSuggestedBookmarkName = useCallback((): string => {
    if (!tabInfo) return '新书签';
    return generateDefaultBookmarkName(tabInfo.title, tabInfo.url);
  }, [tabInfo]);

  // 获取当前页面URL
  const getCurrentUrl = useCallback((): string => {
    return tabInfo?.url || '';
  }, [tabInfo]);

  // 检查是否可以访问当前标签页
  const canAccessCurrentTab = useCallback((): boolean => {
    return tabInfo !== null && !error;
  }, [tabInfo, error]);

  // 重新加载标签页信息
  const refresh = useCallback(() => {
    loadCurrentTab();
  }, [loadCurrentTab]);

  // 组件挂载时自动加载
  useEffect(() => {
    loadCurrentTab();
  }, [loadCurrentTab]);

  return {
    // 状态
    tabInfo,
    loading,
    error,
    
    // 计算属性
    canAccessCurrentTab: canAccessCurrentTab(),
    suggestedBookmarkName: getSuggestedBookmarkName(),
    currentUrl: getCurrentUrl(),
    
    // 方法
    refresh,
    loadCurrentTab
  };
}
