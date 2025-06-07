/**
 * 数据变更检测Hook
 * 监听书签和分类数据变更，触发自动同步上传
 */

import { useEffect, useRef } from 'react';
import { useDebounce } from './useDebounce';

/**
 * 数据变更检测选项
 */
interface UseDataChangeDetectionOptions {
  /** 是否启用自动检测 */
  enabled?: boolean;
  /** 防抖延迟（毫秒） */
  debounceDelay?: number;
  /** 调试模式 */
  debug?: boolean;
}

/**
 * 数据变更检测Hook
 * 
 * @param dependencies 要监听的依赖数组
 * @param options 选项配置
 */
export function useDataChangeDetection(
  dependencies: any[], 
  options: UseDataChangeDetectionOptions = {}
): void {
  const {
    enabled = true,
    debounceDelay = 2000,
    debug = false,
  } = options;

  const isInitialMount = useRef(true);
  const lastDependencies = useRef<any[]>([]);
  const debouncedDependencies = useDebounce(dependencies, debounceDelay);

  /**
   * 触发自动同步数据变更事件
   */
  const triggerAutoSync = async () => {
    try {
      await chrome.runtime.sendMessage({
        action: 'webdav_trigger_auto_sync',
        eventType: 'data_changed',
      });
      
      if (debug) {
      }
    } catch (error) {
      if (debug) {
      }
    }
  };

  /**
   * 检查依赖是否发生变化
   */
  const hasChanged = (current: any[], previous: any[]): boolean => {
    if (current.length !== previous.length) {
      return true;
    }

    return current.some((item, index) => {
      const prevItem = previous[index];
      
      // 深度比较对象
      if (typeof item === 'object' && item !== null && typeof prevItem === 'object' && prevItem !== null) {
        return JSON.stringify(item) !== JSON.stringify(prevItem);
      }
      
      // 直接比较原始值
      return item !== prevItem;
    });
  };

  // 监听依赖变化
  useEffect(() => {
    if (!enabled) {
      return;
    }

    // 跳过初始挂载
    if (isInitialMount.current) {
      isInitialMount.current = false;
      lastDependencies.current = [...debouncedDependencies];
      return;
    }

    // 检查是否有变化
    if (hasChanged(debouncedDependencies, lastDependencies.current)) {
      if (debug) {
      }

      // 触发自动同步
      triggerAutoSync();
      
      // 更新上一次的依赖
      lastDependencies.current = [...debouncedDependencies];
    }
  }, [debouncedDependencies, enabled, debug]);

  // 重置初始挂载状态
  useEffect(() => {
    isInitialMount.current = true;
    lastDependencies.current = [];
  }, [enabled]);
}

/**
 * 书签数据变更检测Hook
 * 专门用于监听书签相关数据变更
 */
export function useBookmarkDataChangeDetection(
  bookmarks: any[],
  categories: any[],
  options: UseDataChangeDetectionOptions = {}
): void {
  // 创建用于比较的数据快照
  const dataSnapshot = [
    bookmarks.map(bookmark => ({
      id: bookmark.id,
      title: bookmark.title,
      url: bookmark.url,
      categoryId: bookmark.categoryId,
      position: bookmark.position,
      updatedAt: bookmark.updatedAt,
    })),
    categories.map(category => ({
      id: category.id,
      name: category.name,
      position: category.position,
      updatedAt: category.updatedAt,
    })),
  ];

  useDataChangeDetection(dataSnapshot, {
    ...options,
    debug: options.debug ?? process.env.NODE_ENV === 'development',
  });
}

/**
 * 设置数据变更检测Hook
 * 专门用于监听应用设置变更
 */
export function useSettingsDataChangeDetection(
  settings: any,
  options: UseDataChangeDetectionOptions = {}
): void {
  // 只监听关键设置字段的变更
  const settingsSnapshot = settings ? {
    bookmarks: settings.bookmarks,
    preferences: settings.preferences,
    background: settings.background,
    network: settings.network,
  } : null;

  useDataChangeDetection([settingsSnapshot], {
    ...options,
    debounceDelay: options.debounceDelay ?? 3000, // 设置变更延迟稍长
    debug: options.debug ?? process.env.NODE_ENV === 'development',
  });
}