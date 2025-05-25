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
    <div className="space-y-4">
      {/* 背景类型选择 - 紧凑设计 */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Palette className="w-4 h-4 text-indigo-600" />
            背景设置
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* 背景类型标签 */}
          <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="gradient" className="flex items-center gap-1 text-xs">
                <Palette className="w-3 h-3" />
                渐变色
                {backgroundSettings.type === 'gradient' && (
                  <Badge variant="secondary" className="ml-1 text-xs scale-75">当前</Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="image" className="flex items-center gap-1 text-xs">
                <Image className="w-3 h-3" />
                本地图片
                {backgroundSettings.type === 'image' && (
                  <Badge variant="secondary" className="ml-1 text-xs scale-75">当前</Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="unsplash" className="flex items-center gap-1 text-xs">
                <Globe className="w-3 h-3" />
                Unsplash
                {backgroundSettings.type === 'unsplash' && (
                  <Badge variant="secondary" className="ml-1 text-xs scale-75">当前</Badge>
                )}
              </TabsTrigger>
            </TabsList>

            {/* 渐变背景设置 */}
            <TabsContent value="gradient" className="mt-4">
              <div className="bg-gray-50 rounded-lg p-3">
                <GradientPicker
                  value={backgroundSettings.gradient}
                  onChange={handleGradientChange}
                />
              </div>
            </TabsContent>

            {/* 本地图片设置 */}
            <TabsContent value="image" className="mt-4">
              <div className="bg-gray-50 rounded-lg p-3">
                <ImageUploader
                  value={backgroundSettings.image}
                  onChange={handleImageChange}
                />
              </div>
            </TabsContent>

            {/* Unsplash设置 */}
            <TabsContent value="unsplash" className="mt-4">
              <div className="bg-gray-50 rounded-lg p-1">
                <div className="h-80">
                  <UnsplashGallery
                    onSelectImage={handleUnsplashSelect}
                    selectedImageId={backgroundSettings.type === 'unsplash' ? backgroundSettings.unsplashPhoto?.id : undefined}
                    className="h-full"
                  />
                </div>
              </div>
            </TabsContent>
          </Tabs>

          {/* 显示效果设置 - 紧凑布局 */}
          <div className="space-y-3 pt-2 border-t">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium text-gray-800">显示效果</h4>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              {/* 填充模式 */}
              <SettingItem
                label="填充模式"
                description=""
                className="mb-0"
              >
                <SelectControl
                  value={backgroundSettings.display.fillMode}
                  onValueChange={(fillMode) => updateDisplaySettings({ fillMode })}
                  options={[
                    { value: 'cover', label: 'Cover' },
                    { value: 'contain', label: 'Contain' },
                    { value: 'stretch', label: 'Stretch' },
                    { value: 'center', label: 'Center' }
                  ]}
                  className="w-24 text-xs"
                />
              </SettingItem>

              {/* 不透明度 */}
              <SettingItem
                label="不透明度"
                description=""
                className="mb-0"
              >
                <SliderControl
                  value={backgroundSettings.display.opacity}
                  onChange={(opacity) => updateDisplaySettings({ opacity })}
                  min={10}
                  max={100}
                  step={5}
                  suffix="%"
                  className="w-24"
                />
              </SettingItem>

              {/* 模糊程度 */}
              <SettingItem
                label="模糊程度"
                description=""
                className="mb-0"
              >
                <SliderControl
                  value={backgroundSettings.display.blur}
                  onChange={(blur) => updateDisplaySettings({ blur })}
                  min={0}
                  max={20}
                  step={1}
                  suffix="px"
                  className="w-24"
                />
              </SettingItem>

              {/* 亮度调节 */}
              <SettingItem
                label="亮度调节"
                description=""
                className="mb-0"
              >
                <SliderControl
                  value={backgroundSettings.display.brightness}
                  onChange={(brightness) => updateDisplaySettings({ brightness })}
                  min={50}
                  max={150}
                  step={5}
                  suffix="%"
                  className="w-24"
                />
              </SettingItem>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 高级设置切换 */}
      <Card>
        <CardContent className="p-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="w-full flex items-center justify-between text-sm"
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
        <div className="space-y-4">
          {/* Unsplash高级设置标签 */}
          <Tabs defaultValue="api" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="api" className="flex items-center gap-1 text-xs">
                <Key className="w-3 h-3" />
                API密钥
              </TabsTrigger>
              <TabsTrigger value="preferences" className="flex items-center gap-1 text-xs">
                <Settings className="w-3 h-3" />
                偏好设置
              </TabsTrigger>
              <TabsTrigger value="cache" className="flex items-center gap-1 text-xs">
                <HardDrive className="w-3 h-3" />
                缓存管理
              </TabsTrigger>
              <TabsTrigger value="autoswitch" className="flex items-center gap-1 text-xs">
                <Timer className="w-3 h-3" />
                自动切换
              </TabsTrigger>
            </TabsList>

            <TabsContent value="api" className="mt-4">
              <UnsplashAPISettings />
            </TabsContent>

            <TabsContent value="preferences" className="mt-4">
              <UnsplashPreferences />
            </TabsContent>

            <TabsContent value="cache" className="mt-4">
              <CacheManagement />
            </TabsContent>

            <TabsContent value="autoswitch" className="mt-4">
              <AutoSwitchSettings />
            </TabsContent>
          </Tabs>
        </div>
      )}

      {/* 使用提示 - 精简版 */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-3">
          <div className="flex items-start gap-2">
            <div className="text-blue-600 mt-0.5 text-sm">💡</div>
            <div className="text-xs text-blue-800">
              <p className="font-medium mb-1">背景设置小贴士：</p>
              <ul className="text-xs space-y-0.5 text-blue-700">
                <li>• <strong>渐变色</strong>：现代化视觉效果，快速加载</li>
                <li>• <strong>本地图片</strong>：个性化定制，建议高分辨率图片</li>
                <li>• <strong>Unsplash</strong>：专业摄影作品，点击高级设置配置API密钥</li>
                <li>• <strong>显示效果</strong>：调整模糊和亮度可提升内容可读性</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
