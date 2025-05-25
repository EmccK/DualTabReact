/**
 * Unsplash图片管理Hook
 * 集成API服务和缓存管理，提供完整的图片获取和缓存功能
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { unsplashService, UnsplashPhoto, UnsplashCategoryId, UNSPLASH_CATEGORIES } from '../services/unsplash';
import { imageCacheManager, CachedImage, CacheStats } from '../utils/imageCache';

export interface UseUnsplashOptions {
  category?: UnsplashCategoryId;
  autoLoad?: boolean;
  perPage?: number;
}

export interface UseUnsplashReturn {
  // 图片数据
  photos: UnsplashPhoto[];
  loading: boolean;
  error: string | null;
  hasMore: boolean;
  
  // 操作方法
  loadPhotos: (reset?: boolean) => Promise<void>;
  loadMore: () => Promise<void>;
  searchPhotos: (query: string) => Promise<void>;
  setCategory: (category: UnsplashCategoryId) => void;
  
  // 缓存相关
  getCachedImageUrl: (photo: UnsplashPhoto) => string | null;
  downloadAndCacheImage: (photo: UnsplashPhoto) => Promise<string>;
  
  // 状态信息
  currentCategory: UnsplashCategoryId;
  currentQuery: string;
  currentPage: number;
  totalPages: number;
}

export function useUnsplash({
  category = 'all',
  autoLoad = true,
  perPage = 20
}: UseUnsplashOptions = {}): UseUnsplashReturn {
  // 基础状态
  const [photos, setPhotos] = useState<UnsplashPhoto[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  
  // 分页和搜索状态
  const [currentCategory, setCurrentCategory] = useState<UnsplashCategoryId>(category);
  const [currentQuery, setCurrentQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  // 用于取消请求的引用
  const abortControllerRef = useRef<AbortController | null>(null);

  /**
   * 取消当前请求
   */
  const cancelCurrentRequest = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  }, []);

  /**
   * 加载图片
   */
  const loadPhotos = useCallback(async (reset = false) => {
    try {
      // 取消之前的请求
      cancelCurrentRequest();
      
      // 创建新的AbortController
      abortControllerRef.current = new AbortController();
      
      setLoading(true);
      setError(null);
      
      const page = reset ? 1 : currentPage;
      let newPhotos: UnsplashPhoto[] = [];
      let newTotalPages = 1;

      if (currentQuery) {
        // 搜索模式
        const result = await unsplashService.searchPhotos({
          query: currentQuery,
          page,
          perPage,
          orientation: 'landscape'
        });
        newPhotos = result.results;
        newTotalPages = result.total_pages;
      } else {
        // 分类模式
        newPhotos = await unsplashService.getPhotosByCategory(
          currentCategory,
          page,
          perPage
        );
        // 分类模式默认有更多页面
        newTotalPages = Math.max(page + 1, totalPages);
      }

      if (reset) {
        setPhotos(newPhotos);
        setCurrentPage(2);
      } else {
        setPhotos(prev => [...prev, ...newPhotos]);
        setCurrentPage(prev => prev + 1);
      }
      
      setTotalPages(newTotalPages);
      setHasMore(page < newTotalPages && newPhotos.length > 0);
      
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        return; // 请求被取消，不处理错误
      }
      
      const errorMessage = err instanceof Error ? err.message : '加载图片失败';
      setError(errorMessage);
      console.error('加载Unsplash图片失败:', err);
    } finally {
      setLoading(false);
      abortControllerRef.current = null;
    }
  }, [currentCategory, currentQuery, currentPage, perPage, totalPages, cancelCurrentRequest]);

  /**
   * 加载更多图片
   */
  const loadMore = useCallback(async () => {
    if (!hasMore || loading) return;
    await loadPhotos(false);
  }, [hasMore, loading, loadPhotos]);

  /**
   * 搜索图片
   */
  const searchPhotos = useCallback(async (query: string) => {
    setCurrentQuery(query.trim());
    setCurrentPage(1);
    setHasMore(true);
    await loadPhotos(true);
  }, [loadPhotos]);

  /**
   * 设置分类
   */
  const setCategory = useCallback(async (newCategory: UnsplashCategoryId) => {
    if (newCategory === currentCategory) return;
    
    setCurrentCategory(newCategory);
    setCurrentQuery(''); // 清空搜索查询
    setCurrentPage(1);
    setHasMore(true);
    await loadPhotos(true);
  }, [currentCategory, loadPhotos]);

  /**
   * 获取缓存的图片URL
   */
  const getCachedImageUrl = useCallback((photo: UnsplashPhoto): string | null => {
    const imageUrl = unsplashService.getImageUrl(photo);
    const cached = imageCacheManager.getCachedImage(imageUrl);
    
    if (cached) {
      try {
        return imageCacheManager.base64ToBlobUrl(cached.blob);
      } catch (error) {
        console.error('生成缓存图片URL失败:', error);
        return null;
      }
    }
    
    return null;
  }, []);

  /**
   * 下载并缓存图片
   */
  const downloadAndCacheImage = useCallback(async (photo: UnsplashPhoto): Promise<string> => {
    try {
      const imageUrl = unsplashService.getImageUrl(photo);
      
      // 检查是否已缓存
      const cachedUrl = getCachedImageUrl(photo);
      if (cachedUrl) {
        return cachedUrl;
      }

      // 下载图片
      const response = await fetch(imageUrl);
      if (!response.ok) {
        throw new Error(`下载图片失败: ${response.status}`);
      }

      const imageBlob = await response.blob();
      
      // 触发下载统计（符合Unsplash API要求）
      if (photo.links.download_location) {
        await unsplashService.trackDownload(photo.links.download_location);
      }

      // 缓存图片
      const metadata = {
        width: photo.width,
        height: photo.height,
        photographer: photo.user.name,
        photographerUrl: photo.user.links.html,
        originalUrl: photo.links.html
      };

      const base64 = await imageCacheManager.cacheImage(imageUrl, imageBlob, metadata);
      return imageCacheManager.base64ToBlobUrl(base64);
      
    } catch (error) {
      console.error('下载并缓存图片失败:', error);
      throw error;
    }
  }, [getCachedImageUrl]);

  // 自动加载
  useEffect(() => {
    if (autoLoad && photos.length === 0) {
      loadPhotos(true);
    }
  }, [autoLoad, photos.length, loadPhotos]);

  // 清理函数
  useEffect(() => {
    return () => {
      cancelCurrentRequest();
    };
  }, [cancelCurrentRequest]);

  return {
    // 图片数据
    photos,
    loading,
    error,
    hasMore,
    
    // 操作方法
    loadPhotos,
    loadMore,
    searchPhotos,
    setCategory,
    
    // 缓存相关
    getCachedImageUrl,
    downloadAndCacheImage,
    
    // 状态信息
    currentCategory,
    currentQuery,
    currentPage,
    totalPages
  };
}

/**
 * 缓存统计Hook
 */
export function useImageCache() {
  const [stats, setStats] = useState<CacheStats | null>(null);
  const [loading, setLoading] = useState(false);

  /**
   * 刷新统计数据
   */
  const refreshStats = useCallback(async () => {
    try {
      setLoading(true);
      const currentStats = imageCacheManager.getStats();
      setStats(currentStats);
    } catch (error) {
      console.error('获取缓存统计失败:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * 清空缓存
   */
  const clearCache = useCallback(async () => {
    try {
      setLoading(true);
      await imageCacheManager.clearAll();
      await refreshStats();
    } catch (error) {
      console.error('清空缓存失败:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [refreshStats]);

  /**
   * 清理过期缓存
   */
  const cleanupCache = useCallback(async () => {
    try {
      setLoading(true);
      await imageCacheManager.cleanup();
      await refreshStats();
    } catch (error) {
      console.error('清理缓存失败:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [refreshStats]);

  // 初始化时加载统计
  useEffect(() => {
    refreshStats();
  }, [refreshStats]);

  return {
    stats,
    loading,
    refreshStats,
    clearCache,
    cleanupCache,
    formatSize: imageCacheManager.constructor.formatSize
  };
}

/**
 * API密钥验证Hook
 */
export function useUnsplashApiKey() {
  const [isValidating, setIsValidating] = useState(false);
  const [isValid, setIsValid] = useState<boolean | null>(null);

  /**
   * 验证API密钥
   */
  const validateApiKey = useCallback(async (apiKey: string): Promise<boolean> => {
    try {
      setIsValidating(true);
      const valid = await unsplashService.validateApiKey(apiKey);
      setIsValid(valid);
      return valid;
    } catch (error) {
      console.error('验证API密钥失败:', error);
      setIsValid(false);
      return false;
    } finally {
      setIsValidating(false);
    }
  }, []);

  /**
   * 重置验证状态
   */
  const resetValidation = useCallback(() => {
    setIsValid(null);
  }, []);

  return {
    isValidating,
    isValid,
    validateApiKey,
    resetValidation
  };
}
