/**
 * 通用背景图片画廊组件
 * 使用统一的BackgroundImageManager服务
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
  List,
  Settings
} from 'lucide-react';

import { backgroundImageManager } from '@/services/background';
import type { 
  BackgroundImage, 
  BackgroundImageSource,
  BackgroundImageFilters
} from '@/types/background';
import { RANDOM_IMAGE_CATEGORIES, RANDOM_IMAGE_THEMES } from '@/types/randomImage';

interface UniversalImageGalleryProps {
  onSelect?: (image: BackgroundImage, imageUrl: string) => void;
  onSelectMultiple?: (images: BackgroundImage[]) => void;
  className?: string;
  initialSource?: BackgroundImageSource;
  initialCategory?: string;
  initialTheme?: string;
  maxHistory?: number;
}

interface GalleryState {
  images: BackgroundImage[];
  currentImage: BackgroundImage | null;
  isLoading: boolean;
  error: string | null;
  selectedImages: Set<string>;
}

export function UniversalImageGallery({
  onSelect,
  onSelectMultiple,
  className = '',
  initialSource = 'random',
  initialCategory = 'all',
  initialTheme = 'all',
  maxHistory = 12
}: UniversalImageGalleryProps) {
  const [selectedSource, setSelectedSource] = useState<BackgroundImageSource>(initialSource);
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [selectedTheme, setSelectedTheme] = useState(initialTheme);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  
  const [state, setState] = useState<GalleryState>({
    images: [],
    currentImage: null,
    isLoading: false,
    error: null,
    selectedImages: new Set()
  });

  // 获取单张图片
  const fetchSingle = async () => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const filters: BackgroundImageFilters = {
        category: selectedCategory !== 'all' ? selectedCategory : undefined,
        theme: selectedTheme !== 'all' ? selectedTheme : undefined
      };

      const image = await backgroundImageManager.getRandomImageFromSource(selectedSource, filters);
      
      // 验证图片
      if (!backgroundImageManager.isValidBackgroundImage(image)) {
        throw new Error('获取到的图片不适合作为背景');
      }

      // 预加载图片
      const preloadSuccess = await backgroundImageManager.preloadImage(image);
      if (!preloadSuccess) {
        throw new Error('图片预加载失败');
      }

      setState(prev => ({
        ...prev,
        currentImage: image,
        images: [image, ...prev.images.slice(0, maxHistory - 1)],
        isLoading: false
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '获取图片失败';
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage
      }));
    }
  };

  // 获取多张图片
  const fetchMultiple = async () => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const filters: BackgroundImageFilters = {
        category: selectedCategory !== 'all' ? selectedCategory : undefined,
        theme: selectedTheme !== 'all' ? selectedTheme : undefined
      };

      const images = await backgroundImageManager.getRandomImagesFromSource(selectedSource, 6, filters);
      
      // 过滤有效图片
      const validImages = images.filter(img => backgroundImageManager.isValidBackgroundImage(img));

      if (validImages.length === 0) {
        throw new Error('未获取到有效的背景图片');
      }

      setState(prev => ({
        ...prev,
        currentImage: validImages[0],
        images: validImages.slice(0, maxHistory),
        isLoading: false
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '批量获取图片失败';
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage
      }));
    }
  };

  // 选择图片
  const handleSelectImage = (image: BackgroundImage) => {
    if (onSelect) {
      const imageUrl = backgroundImageManager.getImageUrl(image, 'large');
      onSelect(image, imageUrl);
    }
  };

  // 切换图片选中状态
  const toggleImageSelection = (imageId: string) => {
    setState(prev => {
      const newSelection = new Set(prev.selectedImages);
      if (newSelection.has(imageId)) {
        newSelection.delete(imageId);
      } else {
        newSelection.add(imageId);
      }
      return {
        ...prev,
        selectedImages: newSelection
      };
    });
  };

  // 应用多选
  const handleApplySelection = () => {
    if (onSelectMultiple && state.selectedImages.size > 0) {
      const selectedImageList = state.images.filter(img => state.selectedImages.has(img.id));
      onSelectMultiple(selectedImageList);
      setState(prev => ({ ...prev, selectedImages: new Set() }));
    }
  };

  // 下载图片
  const handleDownloadImage = async (image: BackgroundImage) => {
    try {
      const imageUrl = backgroundImageManager.getImageUrl(image, 'original');
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `background_${image.id}.jpg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('下载图片失败:', error);
      alert('下载失败，请重试');
    }
  };

  // 重试
  const handleRetry = () => {
    setState(prev => ({ ...prev, error: null }));
    fetchSingle();
  };

  // 获取可用源
  const availableSources = backgroundImageManager.getAvailableSources();

  return (
    <div className={`space-y-4 ${className}`}>
      {/* 控制面板 */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-2">
              <RefreshCw className="w-4 h-4 text-indigo-600" />
              背景图片
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
          {/* 图片源选择 */}
          <div className="space-y-1">
            <label className="text-xs text-gray-600">图片来源</label>
            <Select value={selectedSource} onValueChange={setSelectedSource}>
              <SelectTrigger className="h-8 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {availableSources.map((source) => (
                  <SelectItem key={source} value={source}>
                    {source === 'random' ? '随机壁纸' : 
                     source === 'unsplash' ? 'Unsplash' : 
                     source.charAt(0).toUpperCase() + source.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

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
              onClick={fetchSingle}
              disabled={state.isLoading}
              className="flex-1 h-8"
            >
              {state.isLoading ? (
                <Loader2 className="w-3 h-3 mr-1 animate-spin" />
              ) : (
                <RefreshCw className="w-3 h-3 mr-1" />
              )}
              获取图片
            </Button>
            <Button
              variant="outline"
              onClick={fetchMultiple}
              disabled={state.isLoading}
              className="flex-1 h-8"
            >
              {state.isLoading ? (
                <Loader2 className="w-3 h-3 mr-1 animate-spin" />
              ) : (
                <Grid className="w-3 h-3 mr-1" />
              )}
              批量获取
            </Button>
          </div>

          {/* 多选操作 */}
          {state.selectedImages.size > 0 && (
            <div className="flex items-center justify-between p-2 bg-blue-50 rounded">
              <span className="text-sm text-blue-800">
                已选择 {state.selectedImages.size} 张图片
              </span>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setState(prev => ({ ...prev, selectedImages: new Set() }))}
                  className="h-6 text-xs"
                >
                  取消
                </Button>
                <Button
                  size="sm"
                  onClick={handleApplySelection}
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
      {state.error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-3 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm text-red-800">{state.error}</p>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRetry}
                className="mt-1 h-6 text-xs text-red-700 hover:text-red-800"
              >
                重试
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 图片画廊 */}
      {state.images.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center justify-between">
              <span>图片画廊</span>
              <Badge variant="secondary" className="text-xs">
                {state.images.length} 张
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={
              viewMode === 'grid' 
                ? "grid grid-cols-2 md:grid-cols-3 gap-3" 
                : "space-y-3"
            }>
              {state.images.map((image) => {
                const isSelected = state.selectedImages.has(image.id);
                const isCurrentImage = state.currentImage?.id === image.id;
                
                return (
                  <Card 
                    key={image.id}
                    className={`
                      cursor-pointer transition-all hover:shadow-md group
                      ${isCurrentImage ? 'ring-2 ring-blue-500' : ''}
                      ${isSelected ? 'ring-2 ring-green-500' : ''}
                    `}
                    onClick={() => {
                      if (onSelectMultiple) {
                        toggleImageSelection(image.id);
                      } else {
                        handleSelectImage(image);
                      }
                    }}
                  >
                    <div className="relative">
                      <img
                        src={backgroundImageManager.getImageUrl(image, 'small')}
                        alt={image.description || '背景图片'}
                        className="w-full h-32 object-cover rounded-t-lg"
                        loading="lazy"
                      />
                      
                      {/* 选中指示器 */}
                      {(isSelected || isCurrentImage) && (
                        <div className="absolute top-2 right-2">
                          <Badge 
                            variant={isCurrentImage ? "default" : "secondary"}
                            className="text-xs"
                          >
                            {isCurrentImage ? '当前' : '已选'}
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
                            handleDownloadImage(image);
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
                            {image.source === 'random' ? `ID: ${image.id}` : image.id}
                          </span>
                          <span className="text-xs text-gray-500">
                            {image.width}×{image.height}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {image.category || '未分类'}
                          </Badge>
                          {image.theme && (
                            <Badge variant="outline" className="text-xs">
                              {image.theme}
                            </Badge>
                          )}
                        </div>

                        {image.description && (
                          <p className="text-xs text-gray-600 truncate">
                            {image.description}
                          </p>
                        )}

                        {image.author && (
                          <p className="text-xs text-gray-500">
                            作者: {image.author.name}
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
                <li>• 选择图片来源：随机壁纸、Unsplash等</li>
                <li>• 通过分类和主题筛选特定风格图片</li>
                <li>• 点击"获取图片"随机获取一张新图片</li>
                <li>• 点击"批量获取"一次获取多张图片</li>
                <li>• 点击图片可直接设置为背景</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
