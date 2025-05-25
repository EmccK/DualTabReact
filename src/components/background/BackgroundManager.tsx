import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Palette, Upload, Cloud, Settings, Eye, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useBackground } from '@/hooks/useBackground';
import { ColorPicker } from '@/components/bookmarks/ColorPicker';
import { LocalImageUploader } from './LocalImageUploader';
import { BackgroundPreview } from './BackgroundPreview';
import { GradientPicker } from './GradientPicker';
import type { BackgroundSettings } from '@/types/settings';

interface BackgroundManagerProps {
  className?: string;
  showPreview?: boolean;
}

/**
 * 背景管理组件
 * 提供完整的背景设置和管理功能
 */
export function BackgroundManager({ 
  className,
  showPreview = true 
}: BackgroundManagerProps) {
  const {
    settings,
    backgroundStyles,
    currentLocalImageData,
    totalLocalImagesSize,
    localImagesCount,
    setBackgroundType,
    setColorBackground,
    setGradientBackground,
    applyGradientPreset,
    addLocalImage,
    removeLocalImage,
    setCurrentLocalImage,
    updateDisplaySettings,
  } = useBackground();

  const [activeTab, setActiveTab] = useState<BackgroundSettings['type']>(settings.type);

  // 处理背景类型切换
  const handleTypeChange = useCallback(async (type: BackgroundSettings['type']) => {
    setActiveTab(type);
    await setBackgroundType(type);
  }, [setBackgroundType]);

  // 处理颜色选择
  const handleColorChange = useCallback(async (color: string) => {
    await setColorBackground(color);
  }, [setColorBackground]);

  // 处理渐变选择
  const handleGradientChange = useCallback(async (gradient: BackgroundSettings['gradient']) => {
    await setGradientBackground(gradient);
  }, [setGradientBackground]);

  // 处理渐变预设选择
  const handleGradientPresetSelect = useCallback(async (presetId: string) => {
    await applyGradientPreset(presetId);
  }, [applyGradientPreset]);

  // 处理显示效果设置变化
  const handleDisplayChange = useCallback(async (
    key: keyof BackgroundSettings['display'],
    value: any
  ) => {
    await updateDisplaySettings({ [key]: value });
  }, [updateDisplaySettings]);

  // 重置显示效果
  const resetDisplaySettings = useCallback(async () => {
    await updateDisplaySettings({
      fillMode: 'cover',
      opacity: 100,
      blur: 0,
      brightness: 100,
      contrast: 100,
      saturation: 100,
      overlay: false,
      overlayColor: '#000000',
      overlayOpacity: 20,
    });
  }, [updateDisplaySettings]);

  // 格式化文件大小
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  };

  return (
    <div className={cn('space-y-6', className)}>
      {/* 预览区域 */}
      {showPreview && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Eye className="w-4 h-4" />
              背景预览
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <BackgroundPreview
                settings={settings}
                size="lg"
                showLabel={true}
              />
              <div className="flex-1 space-y-2">
                <p className="text-sm text-gray-600">
                  当前设置将应用到新标签页背景
                </p>
                {settings.type === 'local' && (
                  <p className="text-xs text-gray-500">
                    本地图片: {localImagesCount} 张 ({formatFileSize(totalLocalImagesSize)})
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 背景类型选择 */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">背景类型</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs 
            value={activeTab} 
            onValueChange={(value) => handleTypeChange(value as BackgroundSettings['type'])}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="color" className="flex items-center gap-2">
                <Palette className="w-4 h-4" />
                纯色
              </TabsTrigger>
              <TabsTrigger value="gradient" className="flex items-center gap-2">
                <Palette className="w-4 h-4" />
                渐变
              </TabsTrigger>
              <TabsTrigger value="local" className="flex items-center gap-2">
                <Upload className="w-4 h-4" />
                本地图片
              </TabsTrigger>
              <TabsTrigger value="unsplash" className="flex items-center gap-2">
                <Cloud className="w-4 h-4" />
                Unsplash
              </TabsTrigger>
            </TabsList>

            {/* 纯色背景设置 */}
            <TabsContent value="color" className="space-y-4 mt-4">
              <div className="space-y-3">
                <Label className="text-sm font-medium">选择颜色</Label>
                <ColorPicker
                  selectedColor={settings.color}
                  onColorChange={handleColorChange}
                />
              </div>
            </TabsContent>

            {/* 渐变背景设置 */}
            <TabsContent value="gradient" className="space-y-4 mt-4">
              <GradientPicker
                currentGradient={settings.gradient}
                gradientPresets={settings.gradientPresets}
                onGradientSelect={handleGradientChange}
                onPresetSelect={handleGradientPresetSelect}
              />
            </TabsContent>

            {/* 本地图片设置 */}
            <TabsContent value="local" className="space-y-4 mt-4">
              <LocalImageUploader
                images={settings.localImages}
                currentImageId={settings.currentLocalImage}
                onImageAdd={addLocalImage}
                onImageRemove={removeLocalImage}
                onImageSelect={setCurrentLocalImage}
                maxImages={20}
              />
            </TabsContent>

            {/* Unsplash设置 */}
            <TabsContent value="unsplash" className="space-y-4 mt-4">
              <div className="text-center py-8 text-gray-500">
                <Cloud className="w-12 h-12 mx-auto mb-2 opacity-30" />
                <p className="text-sm">Unsplash 功能将在后续版本中实现</p>
                <p className="text-xs mt-1">
                  将支持从 Unsplash 获取高质量背景图片
                </p>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* 显示效果设置 */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Settings className="w-4 h-4" />
              显示效果
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={resetDisplaySettings}
              className="flex items-center gap-1"
            >
              <RotateCcw className="w-3 h-3" />
              重置
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* 填充模式 */}
          {(settings.type !== 'color' && settings.type !== 'gradient') && (
            <div className="space-y-2">
              <Label className="text-sm font-medium">填充模式</Label>
              <Select
                value={settings.display.fillMode}
                onValueChange={(value) => handleDisplayChange('fillMode', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cover">覆盖 (推荐)</SelectItem>
                  <SelectItem value="contain">包含</SelectItem>
                  <SelectItem value="fill">拉伸</SelectItem>
                  <SelectItem value="repeat">重复</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* 透明度 */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">透明度</Label>
              <span className="text-sm text-gray-500">{settings.display.opacity}%</span>
            </div>
            <Slider
              value={[settings.display.opacity]}
              onValueChange={([value]) => handleDisplayChange('opacity', value)}
              min={0}
              max={100}
              step={5}
              className="w-full"
            />
          </div>

          {/* 模糊效果 */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">模糊效果</Label>
              <span className="text-sm text-gray-500">{settings.display.blur}px</span>
            </div>
            <Slider
              value={[settings.display.blur]}
              onValueChange={([value]) => handleDisplayChange('blur', value)}
              min={0}
              max={20}
              step={1}
              className="w-full"
            />
          </div>

          {/* 亮度调节 */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">亮度</Label>
              <span className="text-sm text-gray-500">{settings.display.brightness}%</span>
            </div>
            <Slider
              value={[settings.display.brightness]}
              onValueChange={([value]) => handleDisplayChange('brightness', value)}
              min={0}
              max={200}
              step={10}
              className="w-full"
            />
          </div>

          {/* 对比度调节 */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">对比度</Label>
              <span className="text-sm text-gray-500">{settings.display.contrast}%</span>
            </div>
            <Slider
              value={[settings.display.contrast]}
              onValueChange={([value]) => handleDisplayChange('contrast', value)}
              min={0}
              max={200}
              step={10}
              className="w-full"
            />
          </div>

          {/* 饱和度调节 */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">饱和度</Label>
              <span className="text-sm text-gray-500">{settings.display.saturation}%</span>
            </div>
            <Slider
              value={[settings.display.saturation]}
              onValueChange={([value]) => handleDisplayChange('saturation', value)}
              min={0}
              max={200}
              step={10}
              className="w-full"
            />
          </div>

          {/* 叠加层设置 */}
          <div className="space-y-4 pt-4 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">启用叠加层</Label>
              <Switch
                checked={settings.display.overlay}
                onCheckedChange={(checked) => handleDisplayChange('overlay', checked)}
              />
            </div>

            {settings.display.overlay && (
              <div className="space-y-4 pl-4 border-l-2 border-gray-100">
                {/* 叠加层颜色 */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">叠加层颜色</Label>
                  <ColorPicker
                    selectedColor={settings.display.overlayColor}
                    onColorChange={(color) => handleDisplayChange('overlayColor', color)}
                  />
                </div>

                {/* 叠加层透明度 */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium">叠加层透明度</Label>
                    <span className="text-sm text-gray-500">{settings.display.overlayOpacity}%</span>
                  </div>
                  <Slider
                    value={[settings.display.overlayOpacity]}
                    onValueChange={([value]) => handleDisplayChange('overlayOpacity', value)}
                    min={0}
                    max={100}
                    step={5}
                    className="w-full"
                  />
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
