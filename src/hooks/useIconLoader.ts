/**
 * 图标加载Hook - 简化版本
 * 专注于图标状态管理和加载优化
 */

import { useState, useEffect, useCallback } from 'react';
import { getBestBookmarkIconUrl } from '@/utils/icon-utils';
import type { Bookmark, NetworkMode } from '@/types';
import type { IconType } from '@/types/bookmark-icon.types';

interface UseIconLoaderProps {
  bookmark: Bookmark;
  networkMode: NetworkMode;
  size?: number;
  enabled?: boolean;
}

interface UseIconLoaderReturn {
  iconUrl: string | null;
  isLoading: boolean;
  hasError: boolean;
  loadIcon: () => Promise<void>;
  clearError: () => void;
}

export const useIconLoader = ({
  bookmark,
  networkMode,
  size = 32,
  enabled = true,
}: UseIconLoaderProps): UseIconLoaderReturn => {
  const [iconUrl, setIconUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);

  // 获取图标类型
  const iconType: IconType = bookmark.iconType || 'official';

  // 加载图标
  const loadIcon = useCallback(async () => {
    if (!enabled) return;

    // 非官方图标不需要异步加载
    if (iconType !== 'official') {
      setIconUrl(null);
      setIsLoading(false);
      setHasError(false);
      return;
    }

    try {
      setIsLoading(true);
      setHasError(false);

      const favicon = await getBestBookmarkIconUrl(bookmark, networkMode, size);

      setIconUrl(favicon);
    } catch {
      setHasError(true);
      setIconUrl(null);
    } finally {
      setIsLoading(false);
    }
  }, [bookmark, networkMode, size, enabled, iconType]);

  // 清除错误状态
  const clearError = useCallback(() => {
    setHasError(false);
  }, []);

  // 自动加载图标
  useEffect(() => {
    loadIcon();
  }, [loadIcon]);

  return {
    iconUrl,
    isLoading,
    hasError,
    loadIcon,
    clearError,
  };
};

export default useIconLoader;
