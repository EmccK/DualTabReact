import { useCallback } from 'react';
import { useSettings } from './useSettings';
import { getSearchEngineConfig, generateSearchUrl } from '@/utils/search-engines';
import type { SearchEngineId } from '@/types/search';

/**
 * 搜索引擎切换管理Hook
 */
export function useSearchEngine() {
  const { settings, updateSettings } = useSettings();

  // 获取当前搜索引擎配置
  const currentEngine = getSearchEngineConfig(settings.preferences.searchEngine);

  // 切换搜索引擎
  const switchSearchEngine = useCallback(async (engineId: SearchEngineId) => {
    try {
      await updateSettings('preferences', {
        searchEngine: engineId,
      });
    } catch (error) {
      console.error('切换搜索引擎失败:', error);
    }
  }, [updateSettings]);

  // 执行搜索
  const performSearch = useCallback((query: string, engineId?: SearchEngineId) => {
    if (!query.trim()) return;

    const targetEngine = engineId || settings.preferences.searchEngine;
    const searchUrl = generateSearchUrl(targetEngine, query);

    if (settings.preferences.openInNewTab) {
      window.open(searchUrl, '_blank');
    } else {
      window.location.href = searchUrl;
    }
  }, [settings.preferences.searchEngine, settings.preferences.openInNewTab]);

  return {
    currentEngine,
    switchSearchEngine,
    performSearch,
    isLoading: false,
  };
}
