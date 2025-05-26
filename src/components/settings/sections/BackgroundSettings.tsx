/**
 * 背景设置组件 - 重构版本
 * 集成在设置弹窗中的背景配置面板，采用紧凑布局设计
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Palette, 
  Image, 
  Globe
} from 'lucide-react';

import { GradientPicker } from '@/components/background/GradientPicker';
import { UniversalImageGallery } from '@/components/background/UniversalImageGallery';
import { useBackground } from '@/hooks/useBackground';
import type { BackgroundImage } from '@/types/background';

export function BackgroundSettings() {
  const { 
    backgroundSettings, 
    setGradientBackground, 
    setOnlineImageBackground,
    updateDisplaySettings 
  } = useBackground();
  
  // 监听背景类型变化，同步标签选择
  useEffect(() => {
    if (backgroundSettings.type === 'random') {
      setActiveTab('random');
    } else if (backgroundSettings.type === 'gradient') {
      setActiveTab('gradient');
    }
  }, [backgroundSettings.type]);
  
  const [activeTab, setActiveTab] = useState<'gradient' | 'random'>(
    backgroundSettings.type === 'random' ? 'random' : 'gradient'
  );

  const handleGradientChange = (gradient: typeof backgroundSettings.gradient) => {
    setGradientBackground(gradient);
  };


  const handleRandomImageSelect = async (image: BackgroundImage, imageUrl: string) => {
    try {
      await setOnlineImageBackground(image, imageUrl);
      // 自动切换到随机图片标签
      setActiveTab('random');
      console.log('随机图片背景设置成功:', image.id);
    } catch (error) {
      console.error('Failed to set random image background:', error);
      alert('设置随机图片背景失败，请重试');
    }
  };

  const handleTabChange = (tab: typeof activeTab) => {
    setActiveTab(tab);
    // 当用户手动切换标签时，如果切换到渐变色，可以考虑自动应用默认渐变
    if (tab === 'gradient' && backgroundSettings.type !== 'gradient') {
      // 如果需要，可以在这里自动应用默认渐变
      // setGradientBackground(backgroundSettings.gradient);
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
          {/* 背景类型标签 */}
          <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
            <TabsList className="grid w-full grid-cols-2 h-8">
              <TabsTrigger value="gradient" className="flex items-center gap-1 text-xs px-2">
                <Palette className="w-3 h-3" />
                渐变色
                {backgroundSettings.type === 'gradient' && (
                  <Badge variant="secondary" className="ml-1 text-xs scale-75">●</Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="random" className="flex items-center gap-1 text-xs px-2">
                <Globe className="w-3 h-3" />
                随机图片
                {backgroundSettings.type === 'random' && (
                  <Badge variant="secondary" className="ml-1 text-xs scale-75">●</Badge>
                )}
              </TabsTrigger>
            </TabsList>

            {/* 渐变背景设置 */}
            <TabsContent value="gradient" className="mt-3">
              <div className="bg-gray-50 rounded-lg p-2">
                <GradientPicker
                  value={backgroundSettings.gradient}
                  onChange={handleGradientChange}
                />
              </div>
            </TabsContent>

            {/* 随机图片设置 */}
            <TabsContent value="random" className="mt-3">
              <div className="bg-gray-50 rounded-lg p-3">
                <UniversalImageGallery
                  onSelect={handleRandomImageSelect}
                  initialSource="random"
                  initialCategory="nature"
                  initialTheme="all"
                  maxHistory={8}
                />
              </div>
            </TabsContent>
          </Tabs>


        </CardContent>
      </Card>

    </div>
  );
}
