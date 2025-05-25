/**
 * 背景设置组件 - 重构版本
 * 集成在设置弹窗中的背景配置面板，采用紧凑布局设计
 */

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Palette, 
  Image, 
  Globe, 
  Settings, 
  Key,
  HardDrive,
  Timer,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

import { SettingItem } from '../components/SettingItem';
import { SliderControl } from '../components/SliderControl';
import { SelectOption as SelectControl } from '../components/SelectOption';
import { GradientPicker } from '@/components/background/GradientPicker';
import { ImageUploader } from '@/components/background/ImageUploader';
import { UnsplashGallery } from '@/components/background/UnsplashGallery';
import { 
  UnsplashAPISettings,
  UnsplashPreferences,
  CacheManagement,
  AutoSwitchSettings
} from './background';
import { useBackground } from '@/hooks/useBackground';
import type { UnsplashPhoto } from '@/services/unsplash';

export function BackgroundSettings() {
  const { 
    backgroundSettings, 
    setGradientBackground, 
    setImageBackground, 
    setUnsplashBackground,
    updateDisplaySettings 
  } = useBackground();
  
  const [activeTab, setActiveTab] = useState<'gradient' | 'image' | 'unsplash'>('gradient');
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleGradientChange = (gradient: typeof backgroundSettings.gradient) => {
    setGradientBackground(gradient);
  };

  const handleImageChange = async (imageFile: File | null) => {
    if (imageFile) {
      try {
        await setImageBackground(imageFile);
        if (backgroundSettings.type !== 'image') {
          setActiveTab('image');
        }
      } catch (error) {
        console.error('Failed to set image background:', error);
        alert('图片上传失败，请重试');
      }
    }
  };

  const handleUnsplashSelect = async (photo: UnsplashPhoto, imageUrl: string) => {
    try {
      await setUnsplashBackground(photo, imageUrl);
      console.log('Unsplash背景设置成功:', photo.user.name);
    } catch (error) {
      console.error('Failed to set Unsplash background:', error);
      alert('设置Unsplash背景失败，请重试');
    }
  };

  const handleTabChange = (tab: typeof activeTab) => {
    setActiveTab(tab);
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
            <TabsList className="grid w-full grid-cols-3 h-8">
              <TabsTrigger value="gradient" className="flex items-center gap-1 text-xs px-2">
                <Palette className="w-3 h-3" />
                渐变色
                {backgroundSettings.type === 'gradient' && (
                  <Badge variant="secondary" className="ml-1 text-xs scale-75">●</Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="image" className="flex items-center gap-1 text-xs px-2">
                <Image className="w-3 h-3" />
                本地图片
                {backgroundSettings.type === 'image' && (
                  <Badge variant="secondary" className="ml-1 text-xs scale-75">●</Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="unsplash" className="flex items-center gap-1 text-xs px-2">
                <Globe className="w-3 h-3" />
                Unsplash
                {backgroundSettings.type === 'unsplash' && (
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

            {/* 本地图片设置 */}
            <TabsContent value="image" className="mt-3">
              <div className="bg-gray-50 rounded-lg p-2">
                <ImageUploader
                  value={backgroundSettings.image}
                  onChange={handleImageChange}
                />
              </div>
            </TabsContent>

            {/* Unsplash设置 */}
            <TabsContent value="unsplash" className="mt-3">
              <div className="bg-gray-50 rounded-lg p-1">
                <div className="h-56">
                  <UnsplashGallery
                    onSelectImage={handleUnsplashSelect}
                    selectedImageId={backgroundSettings.type === 'unsplash' ? backgroundSettings.unsplashPhoto?.id : undefined}
                    className="h-full"
                  />
                </div>
              </div>
            </TabsContent>
          </Tabs>

          {/* 显示效果设置 - 更紧凑的网格 */}
          <div className="pt-2 border-t">
            <h4 className="text-sm font-medium text-gray-800 mb-2">显示效果</h4>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {/* 填充模式 */}
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-600">填充模式</span>
                <SelectControl
                  value={backgroundSettings.display.fillMode}
                  onValueChange={(fillMode) => updateDisplaySettings({ fillMode })}
                  options={[
                    { value: 'cover', label: 'Cover' },
                    { value: 'contain', label: 'Contain' },
                    { value: 'stretch', label: 'Stretch' },
                    { value: 'center', label: 'Center' }
                  ]}
                  className="w-20 h-7 text-xs"
                />
              </div>

              {/* 不透明度 */}
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-600">不透明度</span>
                <SliderControl
                  value={backgroundSettings.display.opacity}
                  onChange={(opacity) => updateDisplaySettings({ opacity })}
                  min={10}
                  max={100}
                  step={5}
                  suffix="%"
                  className="w-20 h-7"
                />
              </div>

              {/* 模糊程度 */}
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-600">模糊程度</span>
                <SliderControl
                  value={backgroundSettings.display.blur}
                  onChange={(blur) => updateDisplaySettings({ blur })}
                  min={0}
                  max={20}
                  step={1}
                  suffix="px"
                  className="w-20 h-7"
                />
              </div>

              {/* 亮度调节 */}
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-600">亮度调节</span>
                <SliderControl
                  value={backgroundSettings.display.brightness}
                  onChange={(brightness) => updateDisplaySettings({ brightness })}
                  min={50}
                  max={150}
                  step={5}
                  suffix="%"
                  className="w-20 h-7"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 高级设置切换 */}
      <Card>
        <CardContent className="p-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="w-full flex items-center justify-between text-sm h-8"
          >
            <div className="flex items-center gap-2">
              <Settings className="w-4 h-4 text-indigo-600" />
              <span>高级背景设置</span>
            </div>
            {showAdvanced ? 
              <ChevronUp className="w-4 h-4" /> : 
              <ChevronDown className="w-4 h-4" />
            }
          </Button>
        </CardContent>
      </Card>

      {/* 高级设置内容 */}
      {showAdvanced && (
        <div className="space-y-3">
          <Card>
            <CardContent className="p-3">
              {/* Unsplash高级设置标签 */}
              <Tabs defaultValue="api" className="w-full">
                <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4 h-8">
                  <TabsTrigger value="api" className="flex items-center gap-1 text-xs px-2">
                    <Key className="w-3 h-3" />
                    API
                  </TabsTrigger>
                  <TabsTrigger value="preferences" className="flex items-center gap-1 text-xs px-2">
                    <Settings className="w-3 h-3" />
                    偏好
                  </TabsTrigger>
                  <TabsTrigger value="cache" className="flex items-center gap-1 text-xs px-2">
                    <HardDrive className="w-3 h-3" />
                    缓存
                  </TabsTrigger>
                  <TabsTrigger value="autoswitch" className="flex items-center gap-1 text-xs px-2">
                    <Timer className="w-3 h-3" />
                    自动
                  </TabsTrigger>
                </TabsList>

                <div className="mt-3">
                  <TabsContent value="api" className="mt-0">
                    <UnsplashAPISettings />
                  </TabsContent>

                  <TabsContent value="preferences" className="mt-0">
                    <UnsplashPreferences />
                  </TabsContent>

                  <TabsContent value="cache" className="mt-0">
                    <CacheManagement />
                  </TabsContent>

                  <TabsContent value="autoswitch" className="mt-0">
                    <AutoSwitchSettings />
                  </TabsContent>
                </div>
              </Tabs>
            </CardContent>
          </Card>

          {/* 使用提示 - 精简版 */}
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-2">
              <div className="flex items-start gap-2">
                <div className="text-blue-600 mt-0.5 text-sm">💡</div>
                <div className="text-xs text-blue-800">
                  <p className="font-medium mb-1">使用提示：</p>
                  <ul className="text-xs space-y-0.5 text-blue-700">
                    <li>• <strong>渐变色</strong>：现代化视觉效果，快速加载</li>
                    <li>• <strong>本地图片</strong>：个性化定制，建议高分辨率图片</li>
                    <li>• <strong>Unsplash</strong>：专业摄影作品，配置API密钥获得更好体验</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
