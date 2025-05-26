/**
 * 背景设置组件 - 重构版本
 * 集成在设置弹窗中的背景配置面板，采用紧凑布局设计
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Palette, 
  Globe
} from 'lucide-react';

import { GradientPicker } from '@/components/background/GradientPicker';
import { UniversalImageGallery } from '@/components/background/UniversalImageGallery';
import { useBackground } from '@/hooks/useBackground';
import type { BackgroundImage } from '@/types/background';
import type { BackgroundSettings } from '@/types/settings';

export function BackgroundSettings() {
  const { 
    backgroundSettings, 
    setGradientBackground, 
    setOnlineImageBackground,
    updateBackground,
    updateDisplaySettings 
  } = useBackground();
  
  // 监听背景类型变化，同步选项选择
  useEffect(() => {
    if (backgroundSettings.type === 'random') {
      setSelectedType('random');
    } else if (backgroundSettings.type === 'gradient') {
      setSelectedType('gradient');
    }
  }, [backgroundSettings.type]);
  
  const [selectedType, setSelectedType] = useState<'gradient' | 'random'>(
    backgroundSettings.type === 'random' ? 'random' : 'gradient'
  );

  const handleGradientChange = (gradient: typeof backgroundSettings.gradient) => {
    setGradientBackground(gradient);
  };


  const handleRandomImageSelect = async (image: BackgroundImage, imageUrl: string) => {
    try {
      await setOnlineImageBackground(image, imageUrl);
      // 自动切换到随机图片类型
      setSelectedType('random');
      console.log('随机图片背景设置成功:', image.id);
    } catch (error) {
      console.error('Failed to set random image background:', error);
      alert('设置随机图片背景失败，请重试');
    }
  };

  const handleTypeChange = async (type: 'gradient' | 'random') => {
    setSelectedType(type);
    
    if (type === 'gradient') {
      // 当用户选择渐变色时，自动应用当前渐变设置
      await setGradientBackground(backgroundSettings.gradient);
    } else if (type === 'random') {
      // 当用户选择随机图片时，如果已经有随机图片，则直接应用
      if (backgroundSettings.unsplashPhoto?.cachedUrl) {
        // 如果已经有随机图片，直接切换类型
        await updateBackground({ type: 'random' });
      } else {
        // 如果没有随机图片，也要先切换类型，让刷新按钮显示
        await updateBackground({ type: 'random' });
      }
    }
  };

  return (
    <div className="space-y-3">
      {/* 主要背景设置 */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Palette className="w-4 h-4 text-indigo-600" />
            背景设置
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* 背景类型选择 */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">背景类型</label>
            <div className="flex gap-2">
              <Button
                variant={selectedType === 'gradient' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleTypeChange('gradient')}
                className="flex items-center gap-2 h-8"
              >
                <Palette className="w-3 h-3" />
                渐变色
              </Button>
              <Button
                variant={selectedType === 'random' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleTypeChange('random')}
                className="flex items-center gap-2 h-8"
              >
                <Globe className="w-3 h-3" />
                随机图片
              </Button>
            </div>
          </div>

          {/* 渐变背景设置 */}
          {selectedType === 'gradient' && (
            <div className="bg-gray-50 rounded-lg p-2">
              <GradientPicker
                value={backgroundSettings.gradient}
                onChange={handleGradientChange}
              />
            </div>
          )}

          {/* 随机图片设置 */}
          {selectedType === 'random' && (
            <div className="space-y-2">
              {!backgroundSettings.unsplashPhoto?.cachedUrl && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-2">
                  <p className="text-xs text-blue-800">
                    已选择随机图片模式，可以点击右下角的刷新按钮获取随机背景图片，或在下方设置分类。
                  </p>
                </div>
              )}
              <div className="bg-gray-50 rounded-lg p-3">
                <UniversalImageGallery
                  onSelect={handleRandomImageSelect}
                  initialSource="random"
                  initialCategory="nature"
                  initialTheme="all"
                  maxHistory={8}
                />
              </div>
            </div>
          )}


        </CardContent>
      </Card>

    </div>
  );
}
