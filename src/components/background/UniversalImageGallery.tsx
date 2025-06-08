/**
 * 通用背景图片画廊组件
 * 使用统一的BackgroundImageManager服务
 */

import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import {
  Info
} from 'lucide-react';

import { useSettings } from '@/hooks/useSettings';
import type {
  BackgroundImage,
  BackgroundImageSource,
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


export function UniversalImageGallery({
  className = '',
  initialCategory = 'all',
  initialTheme = 'all'
}: UniversalImageGalleryProps) {
  const { settings, updateSettings, isLoading } = useSettings();

  // 使用 useMemo 来稳定初始值，避免因为 settings 变化导致的重新渲染
  const stableInitialCategory = useMemo(() => {
    return settings.background.randomImageCategory || initialCategory;
  }, [settings.background.randomImageCategory, initialCategory]);

  const stableInitialTheme = useMemo(() => {
    return settings.background.randomImageTheme || initialTheme;
  }, [settings.background.randomImageTheme, initialTheme]);

  const [selectedCategory, setSelectedCategory] = useState(stableInitialCategory);
  const [selectedTheme, setSelectedTheme] = useState(stableInitialTheme);

  // 当设置加载完成后，同步状态
  useEffect(() => {
    if (!isLoading) {
      setSelectedCategory(settings.background.randomImageCategory || initialCategory);
      setSelectedTheme(settings.background.randomImageTheme || initialTheme);
    }
  }, [isLoading, settings.background.randomImageCategory, settings.background.randomImageTheme, initialCategory, initialTheme]);



  return (
    <div className={`space-y-4 ${className}`}>
      {/* 控制面板 */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Info className="w-4 h-4 text-indigo-600" />
            随机图片设置
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* 筛选选项 */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs text-gray-600">分类</label>
              <Select
                value={selectedCategory}
                onValueChange={(value) => {
                  setSelectedCategory(value);
                  // 使用防抖更新设置，避免频繁的状态更新
                  updateSettings('background', {
                    ...settings.background,
                    randomImageCategory: value
                  });
                }}
                disabled={isLoading}
              >
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue placeholder="选择分类..." />
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
              <Select
                value={selectedTheme}
                onValueChange={(value) => {
                  setSelectedTheme(value);
                  // 使用防抖更新设置，避免频繁的状态更新
                  updateSettings('background', {
                    ...settings.background,
                    randomImageTheme: value
                  });
                }}
                disabled={isLoading}
              >
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue placeholder="选择主题..." />
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
              <p className="text-blue-700">
                选择喜欢的图片分类和主题，然后点击右下角的刷新按钮获取随机背景图片。
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
