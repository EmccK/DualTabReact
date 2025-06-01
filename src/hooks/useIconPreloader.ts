/**
 * 图标预加载Hook - 简化版本
 * 提供简洁的图标预加载功能
 */

import { useEffect, useState, useCallback } from 'react';
import { iconCache } from '@/utils/icon-cache';
import type { Bookmark, NetworkMode } from '@/types';

interface UseIconPreloaderProps {
  bookmarks: Bookmark[];
  networkMode: NetworkMode;
  size?: number;
  enabled?: boolean;
}

interface UseIconPreloaderReturn {
  isPreloading: boolean;
  preloadedCount: number;
  totalCount: number;
  preloadProgress: number; // 0-100
  preloadBookmarks: () => Promise<void>;
}

export const useIconPreloader = ({
  bookmarks,
  networkMode,
  size = 32,
  enabled = true,
}: UseIconPreloaderProps): UseIconPreloaderReturn => {
  const [isPreloading, setIsPreloading] = useState(false);
  const [preloadedCount, setPreloadedCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);

  // 计算预加载进度
  const preloadProgress = totalCount > 0 ? Math.round((preloadedCount / totalCount) * 100) : 0;

  // 预加载书签图标
  const preloadBookmarks = useCallback(async () => {
    if (!enabled || isPreloading) return;

    // 过滤出需要预加载的书签（官方图标类型）
    const officialBookmarks = bookmarks.filter(
      bookmark => !bookmark.iconType || bookmark.iconType === 'official'
    );

    if (officialBookmarks.length === 0) return;

    setIsPreloading(true);
    setPreloadedCount(0);
    setTotalCount(officialBookmarks.length);

    try {
      // 获取所有需要预加载的URL
      const urls = officialBookmarks.map(bookmark => {
        if (networkMode === 'internal' && bookmark.internalUrl) {
          return bookmark.internalUrl;
        }
        if (networkMode === 'external' && bookmark.externalUrl) {
          return bookmark.externalUrl;
        }
        return bookmark.url;
      });

      // 使用缓存的预加载功能
      await iconCache.preload(urls, size);
      
      setPreloadedCount(officialBookmarks.length);
    } catch (error) {
      console.warn('预加载图标失败:', error);
    } finally {
      setIsPreloading(false);
    }
  }, [bookmarks, networkMode, size, enabled, isPreloading]);

  // 自动预加载
  useEffect(() => {
    if (enabled && bookmarks.length > 0) {
      // 延迟预加载，避免阻塞初始渲染
      const timeoutId = setTimeout(() => {
        preloadBookmarks();
      }, 100);

      return () => clearTimeout(timeoutId);
    }
  }, [bookmarks, enabled, preloadBookmarks]);

  return {
    isPreloading,
    preloadedCount,
    totalCount,
    preloadProgress,
    preloadBookmarks,
  };
};

export default useIconPreloader;
