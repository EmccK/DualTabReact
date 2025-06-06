/**
 * 随机图片画廊组件
 */

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import {
  RefreshCw,
  Download,
  Info,
  Loader2,
  AlertCircle,
  Grid,
  List
} from 'lucide-react';

import { useRandomImage } from '@/hooks/randomImage';
import type { 
  RandomImageWallpaper, 
  RandomImageCategoryId, 
  RandomImageThemeId
} from '@/types/randomImage';
import { RANDOM_IMAGE_CATEGORIES, RANDOM_IMAGE_THEMES } from '@/types/randomImage';
import { randomImageService } from '@/services/randomImage';

interface RandomImageGalleryProps {
  onSelect?: (wallpaper: RandomImageWallpaper, imageUrl: string) => void;
  onSelectMultiple?: (wallpapers: RandomImageWallpaper[]) => void;
  className?: string;
  initialCategory?: RandomImageCategoryId;
  initialTheme?: RandomImageThemeId;
  maxHistory?: number;
}

export function RandomImageGallery({
  onSelect,
  onSelectMultiple,
  className = '',
  initialCategory = 'all',
  initialTheme = 'all',
  maxHistory = 12
}: RandomImageGalleryProps) {
  const [selectedCategory, setSelectedCategory] = useState<RandomImageCategoryId>(initialCategory);
  const [selectedTheme, setSelectedTheme] = useState<RandomImageThemeId>(initialTheme);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedWallpapers, setSelectedWallpapers] = useState<Set<number>>(new Set());

  const {
    currentWallpaper,
    isLoading,
    error,
    history,
    fetchRandomWallpaper,
    fetchRandomWallpapers,
    clearError,
    retry,
    getImageInfo,
    hasHistory
  } = useRandomImage({
    categoryId: selectedCategory,
    themeId: selectedTheme,
    maxHistory
  });

  // 获取单张图片
  const handleFetchSingle = async () => {
    try {
      await fetchRandomWallpaper(selectedCategory, selectedTheme);
    } catch (error) {
      console.error('获取随机图片失败:', error);
    }
  };

  // 获取多张图片
  const handleFetchMultiple = async () => {
    try {
      await fetchRandomWallpapers(6, selectedCategory, selectedTheme);
    } catch (error) {
      console.error('批量获取随机图片失败:', error);
    }
  };

  // 选择图片作为背景
  const handleSelectWallpaper = (wallpaper: RandomImageWallpaper) => {
    if (onSelect) {
      const imageUrl = randomImageService.getImageUrl(wallpaper, 'original');
      onSelect(wallpaper, imageUrl);
    }
  };

  // 切换壁纸选中状态
  const toggleWallpaperSelection = (wallpaperId: number) => {
    const newSelection = new Set(selectedWallpapers);
    if (newSelection.has(wallpaperId)) {
      newSelection.delete(wallpaperId);
    } else {
      newSelection.add(wallpaperId);
    }
    setSelectedWallpapers(newSelection);
  };

  // 应用多选
  const handleApplyMultipleSelection = () => {
    if (onSelectMultiple && selectedWallpapers.size > 0) {
      const selectedWallpaperList = history.filter(w => selectedWallpapers.has(w.udId));
      onSelectMultiple(selectedWallpaperList);
      setSelectedWallpapers(new Set());
    }
  };

  // 下载图片
  const handleDownloadWallpaper = async (wallpaper: RandomImageWallpaper) => {
    try {
      const imageUrl = randomImageService.getImageUrl(wallpaper, 'original');
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `wallpaper_${wallpaper.udId}.${wallpaper.mimeType.split('/')[1]}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('下载图片失败:', error);
      alert('下载失败，请重试');
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* 控制面板 */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-2">
              <RefreshCw className="w-4 h-4 text-indigo-600" />
              随机图片
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
                className="h-7 px-2"
              >
                {viewMode === 'grid' ? <List className="w-3 h-3" /> : <Grid className="w-3 h-3" />}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* 筛选选项 */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs text-gray-600">分类</label>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {RANDOM_IMAGE_CATEGORIES.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <label className="text-xs text-gray-600">主题</label>
              <Select value={selectedTheme} onValueChange={setSelectedTheme}>
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {RANDOM_IMAGE_THEMES.map((theme) => (
                    <SelectItem key={theme.id} value={theme.id}>
                      {theme.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* 操作按钮 */}
          <div className="flex gap-2">
            <Button
              onClick={handleFetchSingle}
              disabled={isLoading}
              className="flex-1 h-8"
            >
              {isLoading ? (
                <Loader2 className="w-3 h-3 mr-1 animate-spin" />
              ) : (
                <RefreshCw className="w-3 h-3 mr-1" />
              )}
              获取图片
            </Button>
            <Button
              variant="outline"
              onClick={handleFetchMultiple}
              disabled={isLoading}
              className="flex-1 h-8"
            >
              {isLoading ? (
                <Loader2 className="w-3 h-3 mr-1 animate-spin" />
              ) : (
                <Grid className="w-3 h-3 mr-1" />
              )}
              批量获取
            </Button>
          </div>

          {/* 多选操作 */}
          {selectedWallpapers.size > 0 && (
            <div className="flex items-center justify-between p-2 bg-blue-50 rounded">
              <span className="text-sm text-blue-800">
                已选择 {selectedWallpapers.size} 张图片
              </span>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedWallpapers(new Set())}
                  className="h-6 text-xs"
                >
                  取消
                </Button>
                <Button
                  size="sm"
                  onClick={handleApplyMultipleSelection}
                  className="h-6 text-xs"
                >
                  应用选择
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 错误提示 */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-3 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm text-red-800">{error}</p>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  clearError();
                  retry();
                }}
                className="mt-1 h-6 text-xs text-red-700 hover:text-red-800"
              >
                重试
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 图片画廊 */}
      {hasHistory && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center justify-between">
              <span>图片画廊</span>
              <Badge variant="secondary" className="text-xs">
                {history.length} 张
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={
              viewMode === 'grid' 
                ? "grid grid-cols-2 md:grid-cols-3 gap-3" 
                : "space-y-3"
            }>
              {history.map((wallpaper) => {
                const imageInfo = getImageInfo(wallpaper);
                const isSelected = selectedWallpapers.has(wallpaper.udId);
                const isCurrentWallpaper = currentWallpaper?.udId === wallpaper.udId;
                
                return (
                  <Card 
                    key={wallpaper.udId}
                    className={`
                      cursor-pointer transition-all hover:shadow-md
                      ${isCurrentWallpaper ? 'ring-2 ring-blue-500' : ''}
                      ${isSelected ? 'ring-2 ring-green-500' : ''}
                    `}
                    onClick={() => {
                      if (onSelectMultiple) {
                        toggleWallpaperSelection(wallpaper.udId);
                      } else {
                        handleSelectWallpaper(wallpaper);
                      }
                    }}
                  >
                    <div className="relative">
                      <img
                        src={randomImageService.getImageUrl(wallpaper, 'overview')}
                        alt={wallpaper.keyword || '随机壁纸'}
                        className="w-full h-32 object-cover rounded-t-lg"
                        loading="lazy"
                      />
                      
                      {/* 选中指示器 */}
                      {(isSelected || isCurrentWallpaper) && (
                        <div className="absolute top-2 right-2">
                          <Badge 
                            variant={isCurrentWallpaper ? "default" : "secondary"}
                            className="text-xs"
                          >
                            {isCurrentWallpaper ? '当前' : '已选'}
                          </Badge>
                        </div>
                      )}

                      {/* 操作按钮 */}
                      <div className="absolute bottom-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDownloadWallpaper(wallpaper);
                          }}
                          className="h-6 w-6 p-0"
                        >
                          <Download className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>

                    <CardContent className="p-3">
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium truncate">
                            ID: {imageInfo.id}
                          </span>
                          <span className="text-xs text-gray-500">
                            {imageInfo.dimensions}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {imageInfo.category}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {imageInfo.theme}
                          </Badge>
                        </div>

                        {imageInfo.keywords.length > 0 && (
                          <p className="text-xs text-gray-600 truncate">
                            关键词: {imageInfo.keywords.slice(0, 3).join(', ')}
                          </p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 使用提示 */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-3">
          <div className="flex items-start gap-2">
            <Info className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="text-xs text-blue-800">
              <p className="font-medium mb-1">使用说明：</p>
              <ul className="space-y-0.5 text-blue-700">
                <li>• 点击"获取图片"随机获取一张新图片</li>
                <li>• 点击"批量获取"一次获取多张图片</li>
                <li>• 选择分类和主题可筛选特定风格的图片</li>
                <li>• 点击图片可直接设置为背景</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
