/**
 * 书签图标预加载Hook
 * 用于批量预加载书签图标到缓存中，提升用户体验
 */

import { useEffect, useRef } from 'react';
import { iconCache } from '@/utils/icon-cache';
import { getActiveUrl } from '@/utils/icon-utils';
import type { Bookmark, NetworkMode } from '@/types';

interface UseIconPreloaderOptions {
  /**
   * 是否启用预加载
   */
  enabled?: boolean;
  /**
   * 图标尺寸
   */
  size?: number;
  /**
   * 预加载延迟（毫秒）
   */
  delay?: number;
}

/**
 * 书签图标预加载Hook
 */
export const useIconPreloader = (
  bookmarks: Bookmark[],
  networkMode: NetworkMode,
  options: UseIconPreloaderOptions = {}
) => {
  const {
    enabled = true,
    size = 32,
    delay = 500
  } = options;

  const preloadTimeoutRef = useRef<NodeJS.Timeout>();
  const lastBookmarksRef = useRef<string>('');

  useEffect(() => {
    if (!enabled || !bookmarks.length) {
      return;
    }

    // 创建书签的唯一标识符，用于检测变化
    const bookmarksKey = bookmarks
      .map(b => `${b.id}-${b.url}-${b.internalUrl}-${b.externalUrl}`)
      .join('|');

    // 如果书签列表没有变化，跳过预加载
    if (bookmarksKey === lastBookmarksRef.current) {
      return;
    }

    lastBookmarksRef.current = bookmarksKey;

    // 清除之前的预加载计时器
    if (preloadTimeoutRef.current) {
      clearTimeout(preloadTimeoutRef.current);
    }

    // 延迟预加载，避免阻塞UI渲染
    preloadTimeoutRef.current = setTimeout(async () => {
      try {
        // 提取需要预加载的官方图标URLs
        const urlsToPreload = bookmarks
          .filter(bookmark => (bookmark.iconType || 'official') === 'official')
          .map(bookmark => getActiveUrl(bookmark, networkMode))
          .filter(url => url && url.trim() !== '');

        if (urlsToPreload.length > 0) {
          await iconCache.preload(urlsToPreload, size);
        }
      } catch (error) {
        // 忽略预加载错误，不影响正常功能
        console.warn('Icon preloading failed:', error);
      }
    }, delay);

    // 清理函数
    return () => {
      if (preloadTimeoutRef.current) {
        clearTimeout(preloadTimeoutRef.current);
      }
    };
  }, [bookmarks, networkMode, enabled, size, delay]);

  // 组件卸载时清理
  useEffect(() => {
    return () => {
      if (preloadTimeoutRef.current) {
        clearTimeout(preloadTimeoutRef.current);
      }
    };
  }, []);
};

export default useIconPreloader;