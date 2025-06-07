/**
 * 随机图片管理Hook
 */

import { useState, useCallback, useEffect } from 'react';
import { randomImageService } from '@/services/randomImage';
import type {
  RandomImageWallpaper,
  RandomImageCategoryId,
  RandomImageThemeId
} from '@/types/randomImage';

interface RandomImageState {
  currentWallpaper: RandomImageWallpaper | null;
  isLoading: boolean;
  error: string | null;
  history: RandomImageWallpaper[];
}

interface RandomImageOptions {
  categoryId?: RandomImageCategoryId;
  themeId?: RandomImageThemeId;
  autoLoad?: boolean;
  maxHistory?: number;
}

export function useRandomImage(options: RandomImageOptions = {}) {
  const {
    categoryId = 'all',
    themeId = 'all',
    autoLoad = false,
    maxHistory = 10
  } = options;

  const [state, setState] = useState<RandomImageState>({
    currentWallpaper: null,
    isLoading: false,
    error: null,
    history: []
  });

  // 获取随机壁纸
  const fetchRandomWallpaper = useCallback(async (
    category?: RandomImageCategoryId,
    theme?: RandomImageThemeId
  ) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const wallpaper = await randomImageService.getRandomWallpaper({
        categoryId: category || categoryId,
        themeId: theme || themeId
      });

      // 验证图片是否适合作为背景
      if (!randomImageService.isValidBackgroundImage(wallpaper)) {
        throw new Error('获取到的图片不适合作为背景');
      }

      // 预加载图片
      const preloadSuccess = await randomImageService.preloadImage(wallpaper.url);
      if (!preloadSuccess) {
        throw new Error('图片加载失败');
      }

      setState(prev => ({
        ...prev,
        currentWallpaper: wallpaper,
        isLoading: false,
        history: [wallpaper, ...prev.history.slice(0, maxHistory - 1)]
      }));

      return wallpaper;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '获取随机壁纸失败';
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage
      }));
      throw error;
    }
  }, [categoryId, themeId, maxHistory]);

  // 获取多张随机壁纸
  const fetchRandomWallpapers = useCallback(async (
    count: number,
    category?: RandomImageCategoryId,
    theme?: RandomImageThemeId
  ) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const wallpapers = await randomImageService.getRandomWallpapers({
        count,
        categoryId: category || categoryId,
        themeId: theme || themeId
      });

      // 过滤有效的背景图片
      const validWallpapers = wallpapers.filter(wallpaper =>
        randomImageService.isValidBackgroundImage(wallpaper)
      );

      if (validWallpapers.length === 0) {
        throw new Error('未获取到有效的背景图片');
      }

      setState(prev => ({
        ...prev,
        currentWallpaper: validWallpapers[0],
        isLoading: false,
        history: [...validWallpapers.slice(0, maxHistory)]
      }));

      return validWallpapers;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '批量获取壁纸失败';
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage
      }));
      throw error;
    }
  }, [categoryId, themeId, maxHistory]);

  // 从历史记录中选择壁纸
  const selectFromHistory = useCallback((wallpaper: RandomImageWallpaper) => {
    setState(prev => ({
      ...prev,
      currentWallpaper: wallpaper
    }));
  }, []);

  // 清除错误
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  // 清除历史记录
  const clearHistory = useCallback(() => {
    setState(prev => ({ ...prev, history: [] }));
  }, []);

  // 重试获取壁纸
  const retry = useCallback(() => {
    return fetchRandomWallpaper();
  }, [fetchRandomWallpaper]);

  // 获取图片信息
  const getImageInfo = useCallback((wallpaper: RandomImageWallpaper) => {
    return randomImageService.getImageInfo(wallpaper);
  }, []);

  // 获取推荐设置
  const getRecommendedSettings = useCallback((wallpaper: RandomImageWallpaper) => {
    return randomImageService.getRecommendedSettings(wallpaper);
  }, []);

  // 自动加载
  useEffect(() => {
    if (autoLoad && !state.currentWallpaper && !state.isLoading) {
    }
  }, [autoLoad, state.currentWallpaper, state.isLoading, fetchRandomWallpaper]);

  return {
    // 状态
    currentWallpaper: state.currentWallpaper,
    isLoading: state.isLoading,
    error: state.error,
    history: state.history,
    
    // 操作方法
    fetchRandomWallpaper,
    fetchRandomWallpapers,
    selectFromHistory,
    clearError,
    clearHistory,
    retry,
    
    // 工具方法
    getImageInfo,
    getRecommendedSettings,
    
    // 状态检查
    hasWallpaper: !!state.currentWallpaper,
    hasHistory: state.history.length > 0,
    hasError: !!state.error
  };
}
