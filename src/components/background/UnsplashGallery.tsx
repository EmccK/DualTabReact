/**
 * Unsplash图片展示组件
 * 提供图片网格展示、分类筛选、搜索等功能
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Search, Download, User, ExternalLink, Grid, List, Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { useUnsplash, useImageCache } from '../../hooks';
import { UNSPLASH_CATEGORIES } from '../../services/unsplash';
import type { UnsplashPhoto, UnsplashCategoryId } from '../../services/unsplash';

interface UnsplashGalleryProps {
  onSelectImage: (photo: UnsplashPhoto, imageUrl: string) => void;
  selectedImageId?: string;
  className?: string;
}

export function UnsplashGallery({
  onSelectImage,
  selectedImageId,
  className = ''
}: UnsplashGalleryProps) {
  // 状态管理
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [downloadingIds, setDownloadingIds] = useState<Set<string>>(new Set());
  
  // Hooks
  const {
    photos,
    loading,
    error,
    hasMore,
    loadMore,
    searchPhotos,
    setCategory,
    getCachedImageUrl,
    downloadAndCacheImage,
    currentCategory,
    currentQuery
  } = useUnsplash({
    category: 'nature', // 默认从自然风景开始
    autoLoad: true,
    perPage: 20
  });

  const { stats } = useImageCache();
  
  // 引用
  const searchInputRef = useRef<HTMLInputElement>(null);
  const loadMoreObserverRef = useRef<HTMLDivElement>(null);

  /**
   * 处理分类切换
   */
  const handleCategoryChange = useCallback((categoryId: string) => {
    setCategory(categoryId as UnsplashCategoryId);
    setSearchQuery('');
  }, [setCategory]);

  /**
   * 处理搜索
   */
  const handleSearch = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    const query = searchQuery.trim();
    if (query) {
      await searchPhotos(query);
    }
  }, [searchQuery, searchPhotos]);

  /**
   * 处理搜索输入变化
   */
  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  }, []);

  /**
   * 清空搜索
   */
  const handleClearSearch = useCallback(() => {
    setSearchQuery('');
    setCategory('nature');
  }, [setCategory]);

  /**
   * 处理图片选择
   */
  const handleImageSelect = useCallback(async (photo: UnsplashPhoto) => {
    try {
      setDownloadingIds(prev => new Set(prev).add(photo.id));
      
      // 获取或下载缓存图片
      let imageUrl = getCachedImageUrl(photo);
      if (!imageUrl) {
        imageUrl = await downloadAndCacheImage(photo);
      }
      
      onSelectImage(photo, imageUrl);
    } catch (error) {
      console.error('选择图片失败:', error);
    } finally {
      setDownloadingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(photo.id);
        return newSet;
      });
    }
  }, [getCachedImageUrl, downloadAndCacheImage, onSelectImage]);

  /**
   * 获取图片显示URL
   */
  const getDisplayUrl = useCallback((photo: UnsplashPhoto): string => {
    // 优先使用缓存
    const cachedUrl = getCachedImageUrl(photo);
    if (cachedUrl) {
      return cachedUrl;
    }
    // fallback到原始URL
    return photo.urls.small;
  }, [getCachedImageUrl]);

  // 无限滚动监听
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          loadMore();
        }
      },
      { threshold: 0.1 }
    );

    if (loadMoreObserverRef.current) {
      observer.observe(loadMoreObserverRef.current);
    }

    return () => observer.disconnect();
  }, [hasMore, loading, loadMore]);

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* 顶部工具栏 */}
      <div className="flex flex-col gap-4 p-4 border-b bg-white/50 backdrop-blur-sm">
        {/* 搜索栏 */}
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              ref={searchInputRef}
              value={searchQuery}
              onChange={handleSearchChange}
              placeholder="搜索图片..."
              className="pl-10 pr-4"
            />
            {currentQuery && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleClearSearch}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
              >
                ×
              </Button>
            )}
          </div>
          <Button type="submit" disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
          </Button>
        </form>

        {/* 工具栏 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {/* 视图模式切换 */}
            <div className="flex border rounded-lg overflow-hidden">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('grid')}
                className="rounded-none"
              >
                <Grid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
                className="rounded-none"
              >
                <List className="h-4 w-4" />
              </Button>
            </div>

            {/* 状态信息 */}
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span>{photos.length} 张图片</span>
              {stats && (
                <Badge variant="outline">
                  缓存: {Math.round((stats.totalSize / stats.maxSize) * 100)}%
                </Badge>
              )}
            </div>
          </div>

          {/* 当前搜索/分类显示 */}
          {currentQuery ? (
            <Badge variant="secondary">搜索: {currentQuery}</Badge>
          ) : (
            <Badge variant="outline">
              {UNSPLASH_CATEGORIES.find(cat => cat.id === currentCategory)?.name || '全部'}
            </Badge>
          )}
        </div>
      </div>

      {/* 分类标签（仅在非搜索模式下显示） */}
      {!currentQuery && (
        <div className="p-4 border-b bg-white/30 backdrop-blur-sm">
          <Tabs value={currentCategory} onValueChange={handleCategoryChange}>
            <TabsList className="flex flex-wrap justify-start gap-1 bg-transparent">
              {UNSPLASH_CATEGORIES.map((category) => (
                <TabsTrigger
                  key={category.id}
                  value={category.id}
                  className="text-xs whitespace-nowrap"
                >
                  {category.name}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>
      )}

      {/* 图片展示区域 */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-4">
          {error ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">加载失败</h3>
              <p className="text-gray-600 mb-4">{error}</p>
              <Button onClick={() => setCategory(currentCategory)} variant="outline">
                <RefreshCw className="h-4 w-4 mr-2" />
                重试
              </Button>
            </div>
          ) : photos.length === 0 && !loading ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Search className="h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">暂无图片</h3>
              <p className="text-gray-600">尝试切换分类或搜索其他关键词</p>
            </div>
          ) : (
            <>
              {/* 图片网格 */}
              <div className={
                viewMode === 'grid'
                  ? 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4'
                  : 'flex flex-col gap-4'
              }>
                {photos.map((photo) => (
                  <PhotoCard
                    key={photo.id}
                    photo={photo}
                    viewMode={viewMode}
                    isSelected={selectedImageId === photo.id}
                    isDownloading={downloadingIds.has(photo.id)}
                    displayUrl={getDisplayUrl(photo)}
                    onSelect={handleImageSelect}
                  />
                ))}
              </div>

              {/* 加载更多触发器 */}
              <div
                ref={loadMoreObserverRef}
                className="flex justify-center py-8"
              >
                {loading && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>加载中...</span>
                  </div>
                )}
                {!hasMore && photos.length > 0 && (
                  <p className="text-gray-500">已加载全部图片</p>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * 单个图片卡片组件
 */
interface PhotoCardProps {
  photo: UnsplashPhoto;
  viewMode: 'grid' | 'list';
  isSelected: boolean;
  isDownloading: boolean;
  displayUrl: string;
  onSelect: (photo: UnsplashPhoto) => void;
}

function PhotoCard({
  photo,
  viewMode,
  isSelected,
  isDownloading,
  displayUrl,
  onSelect
}: PhotoCardProps) {
  const handleSelect = useCallback(() => {
    onSelect(photo);
  }, [photo, onSelect]);

  const handleUserClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    window.open(photo.user.links.html, '_blank');
  }, [photo.user.links.html]);

  const handleOriginalClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    window.open(photo.links.html, '_blank');
  }, [photo.links.html]);

  if (viewMode === 'list') {
    return (
      <Card 
        className={`flex gap-4 p-4 cursor-pointer transition-all hover:shadow-md ${
          isSelected ? 'ring-2 ring-blue-500' : ''
        }`}
        onClick={handleSelect}
      >
        <div className="w-32 h-20 flex-shrink-0 bg-gray-100 rounded-lg overflow-hidden">
          <img
            src={displayUrl}
            alt={photo.alt_description || photo.description || '图片'}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between mb-2">
            <div className="flex-1 min-w-0">
              <p className="text-sm text-gray-600 truncate">
                {photo.alt_description || photo.description || '无描述'}
              </p>
              <p className="text-xs text-gray-500">
                {photo.width} × {photo.height}
              </p>
            </div>
            
            <div className="flex items-center gap-1 ml-2">
              {isDownloading ? (
                <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
              ) : isSelected ? (
                <Download className="h-4 w-4 text-blue-500" />
              ) : null}
            </div>
          </div>
          
          <div className="flex items-center gap-4 text-xs text-gray-500">
            <button
              onClick={handleUserClick}
              className="flex items-center gap-1 hover:text-gray-700 transition-colors"
              title={`摄影师：${photo.user.name}`}
            >
              <User className="h-3 w-3" />
              <span className="truncate max-w-20">{photo.user.name}</span>
            </button>
            
            <button
              onClick={handleOriginalClick}
              className="flex items-center gap-1 hover:text-gray-700 transition-colors"
              title="在Unsplash查看原图"
            >
              <ExternalLink className="h-3 w-3" />
              <span>查看原图</span>
            </button>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card 
      className={`group cursor-pointer transition-all hover:shadow-lg ${
        isSelected ? 'ring-2 ring-blue-500' : ''
      }`}
      onClick={handleSelect}
    >
      <div className="relative aspect-[4/3] bg-gray-100 rounded-t-lg overflow-hidden">
        <img
          src={displayUrl}
          alt={photo.alt_description || photo.description || '图片'}
          className="w-full h-full object-cover transition-transform group-hover:scale-105"
          loading="lazy"
        />
        
        {/* 选中状态指示器 */}
        {(isDownloading || isSelected) && (
          <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
            {isDownloading ? (
              <Loader2 className="h-8 w-8 text-white animate-spin" />
            ) : (
              <Download className="h-6 w-6 text-white" />
            )}
          </div>
        )}
        
        {/* 悬停操作按钮 */}
        <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            size="sm"
            variant="secondary"
            onClick={handleOriginalClick}
            className="h-8 w-8 p-0"
            title="查看原图"
          >
            <ExternalLink className="h-3 w-3" />
          </Button>
        </div>
      </div>
      
      <div className="p-3">
        <div className="flex items-center justify-between mb-1">
          <button
            onClick={handleUserClick}
            className="flex items-center gap-1 text-xs text-gray-600 hover:text-gray-800 transition-colors truncate"
            title={`摄影师：${photo.user.name}`}
          >
            <User className="h-3 w-3 flex-shrink-0" />
            <span className="truncate">{photo.user.name}</span>
          </button>
          
          <span className="text-xs text-gray-500 ml-2">
            {photo.width} × {photo.height}
          </span>
        </div>
        
        {(photo.description || photo.alt_description) && (
          <p className="text-xs text-gray-500 truncate">
            {photo.alt_description || photo.description}
          </p>
        )}
      </div>
    </Card>
  );
}
