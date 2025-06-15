/**
 * 背景设置组件 - 重构版本
 * 集成在设置弹窗中的背景配置面板，采用紧凑布局设计
 */

import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Palette,
  Globe
} from 'lucide-react';

import { GradientPicker } from '@/components/background/GradientPicker';
import { UniversalImageGallery } from '@/components/background/UniversalImageGallery';
import { useBackground } from '@/hooks/useBackground';
import { useSettings } from '@/hooks/useSettings';
import type { BackgroundImage } from '@/types/background';
import type { BackgroundSettings } from '@/types/settings';

export function BackgroundSettings() {
  const {
    backgroundSettings,
    setGradientBackground,
    setOnlineImageBackground,
    updateBackground
  } = useBackground();

  const { isLoading: settingsLoading } = useSettings();

  // 直接从 backgroundSettings 计算当前选择的类型，避免状态不一致
  // 必须在条件渲染之前调用所有 hooks
  const selectedType = useMemo(() => {
    return backgroundSettings.type === 'random' ? 'random' : 'gradient';
  }, [backgroundSettings.type]);

  const handleGradientChange = (gradient: typeof backgroundSettings.gradient) => {
    setGradientBackground(gradient);
  };

  const handleRandomImageSelect = async (image: BackgroundImage, imageUrl: string) => {
    try {
      await setOnlineImageBackground(image, imageUrl);
      // 不需要手动设置 selectedType，因为它会自动从 backgroundSettings.type 计算
    } catch {
      alert('设置随机图片背景失败，请重试');
    }
  };

  const handleTypeChange = async (type: 'gradient' | 'random') => {
    // 不需要手动设置 selectedType，直接更新背景设置
    if (type === 'gradient') {
      // 当用户选择渐变色时，自动应用当前渐变设置
      await setGradientBackground(backgroundSettings.gradient);
    } else if (type === 'random') {
      // 当用户选择随机图片时，切换到随机图片类型
      await updateBackground({ type: 'random' });
    }
  };

  // 在设置加载完成之前显示加载状态
  if (settingsLoading) {
    return (
      <div className="space-y-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Palette className="w-4 h-4 text-indigo-600" />
              背景设置
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-center py-8">
              <div className="text-sm text-gray-500">加载设置中...</div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

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

          {/* 渐变背景设置 - 移除过渡动画和条件渲染 */}
          <div
            className={selectedType === 'gradient' ? 'block' : 'hidden'}
          >
            <div className="bg-gray-50 rounded-lg p-2">
              <GradientPicker
                value={backgroundSettings.gradient}
                onChange={handleGradientChange}
              />
            </div>
          </div>

          {/* 随机图片设置 - 移除过渡动画和条件渲染 */}
          <div
            className={selectedType === 'random' ? 'block space-y-2' : 'hidden'}
          >
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-2">
              <p className="text-xs text-blue-800">
                已选择随机图片模式，可以点击右下角的刷新按钮获取随机背景图片，或在下方设置分类。
              </p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <UniversalImageGallery
                onSelect={handleRandomImageSelect}
                initialSource="random"
                initialCategory={backgroundSettings.randomImageCategory || "all"}
                initialTheme={backgroundSettings.randomImageTheme || "all"}
                maxHistory={8}
              />
            </div>
          </div>


        </CardContent>
      </Card>

    </div>
  );
}
