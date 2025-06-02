/**
 * 通用背景图片画廊组件
 * 使用统一的BackgroundImageManager服务
 */

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  RefreshCw, 
  Info, 
  Grid,
  List
} from 'lucide-react';

import { backgroundImageManager } from '@/services/background';
import { useSettings } from '@/hooks/useSettings';
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
  const { settings, updateSettings } = useSettings();
  const [selectedSource] = useState<BackgroundImageSource>(initialSource);
  const [selectedCategory, setSelectedCategory] = useState(settings.background.randomImageCategory || initialCategory);
  const [selectedTheme, setSelectedTheme] = useState(settings.background.randomImageTheme || initialTheme);
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
          {/* 筛选选项 */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs text-gray-600">分类</label>
              <Select value={selectedCategory} onValueChange={(value) => {
                setSelectedCategory(value);
                // 保存选择的分类到设置中
                updateSettings('background', {
                  ...settings.background,
                  randomImageCategory: value
                });
              }}>
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
              <Select value={selectedTheme} onValueChange={(value) => {
                setSelectedTheme(value);
                // 保存选择的主题到设置中
                updateSettings('background', {
                  ...settings.background,
                  randomImageTheme: value
                });
              }}>
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
        </CardContent>
      </Card>

      {/* 使用提示 */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-3">
          <div className="flex items-start gap-2">
            <Info className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="text-xs text-blue-800">
              <p className="font-medium mb-1">使用说明：</p>
              <p className="text-blue-700">选择喜欢的图片分类，然后点击右下角的刷新按钮获取随机背景图片</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
