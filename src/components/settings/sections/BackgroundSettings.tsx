/**
 * 背景设置组件
 * 集成在设置弹窗中的背景配置面板
 */

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Palette, Image, Globe, Settings } from 'lucide-react';

import { SettingItem } from '../components/SettingItem';
import { SliderControl } from '../components/SliderControl';
import { ToggleSwitch } from '../components/ToggleSwitch';
import { SelectOption as SelectControl } from '../components/SelectOption';
import { GradientPicker } from '@/components/background/GradientPicker';
import { ImageUploader } from '@/components/background/ImageUploader';
import { useBackground } from '@/hooks/useBackground';

export function BackgroundSettings() {
  const { 
    backgroundSettings, 
    setGradientBackground, 
    setImageBackground, 
    updateDisplaySettings 
  } = useBackground();
  
  const [activeTab, setActiveTab] = useState<'gradient' | 'image' | 'unsplash'>('gradient');

  const handleGradientChange = (gradient: typeof backgroundSettings.gradient) => {
    setGradientBackground(gradient);
  };

  const handleImageChange = async (imageFile: File | null) => {
    if (imageFile) {
      try {
        await setImageBackground(imageFile);
        // 切换到图片模式
        if (backgroundSettings.type !== 'image') {
          setActiveTab('image');
        }
      } catch (error) {
        console.error('Failed to set image background:', error);
        alert('图片上传失败，请重试');
      }
    }
  };

  const handleTabChange = (tab: typeof activeTab) => {
    setActiveTab(tab);
    // 当切换标签时，同步更新背景类型
    if (tab !== backgroundSettings.type) {
      // 这里可以添加切换逻辑，暂时只切换标签
    }
  };

  return (
    <div className="space-y-6">
      {/* 背景类型选择 */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
          <Palette className="w-5 h-5 text-indigo-600" />
          背景类型
        </h3>
        
        <div className="flex gap-2">
          <Button
            variant={activeTab === 'gradient' ? "default" : "outline"}
            size="sm"
            onClick={() => handleTabChange('gradient')}
            className="flex items-center gap-2"
          >
            <Palette className="w-4 h-4" />
            渐变色
            {backgroundSettings.type === 'gradient' && (
              <Badge variant="secondary" className="ml-1 text-xs">当前</Badge>
            )}
          </Button>
          
          <Button
            variant={activeTab === 'image' ? "default" : "outline"}
            size="sm"
            onClick={() => handleTabChange('image')}
            className="flex items-center gap-2"
          >
            <Image className="w-4 h-4" />
            本地图片
            {backgroundSettings.type === 'image' && (
              <Badge variant="secondary" className="ml-1 text-xs">当前</Badge>
            )}
          </Button>
          
          <Button
            variant={activeTab === 'unsplash' ? "default" : "outline"}
            size="sm"
            onClick={() => handleTabChange('unsplash')}
            disabled
            className="flex items-center gap-2 opacity-50"
          >
            <Globe className="w-4 h-4" />
            Unsplash
            <Badge variant="outline" className="ml-1 text-xs">即将推出</Badge>
          </Button>
        </div>
      </div>

      <div className="h-px bg-gray-200 my-6"></div>

      {/* 背景配置区域 */}
      <div className="space-y-4">
        {activeTab === 'gradient' && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Palette className="w-4 h-4 text-indigo-600" />
                渐变背景设置
              </CardTitle>
            </CardHeader>
            <CardContent>
              <GradientPicker
                value={backgroundSettings.gradient}
                onChange={handleGradientChange}
              />
            </CardContent>
          </Card>
        )}

        {activeTab === 'image' && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Image className="w-4 h-4 text-indigo-600" />
                图片背景设置
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ImageUploader
                value={backgroundSettings.image}
                onChange={handleImageChange}
              />
            </CardContent>
          </Card>
        )}

        {activeTab === 'unsplash' && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Globe className="w-4 h-4 text-indigo-600" />
                Unsplash 背景设置
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="p-8 text-center space-y-3">
                <div className="text-4xl">🚧</div>
                <p className="text-gray-600 font-medium">Unsplash 集成即将推出</p>
                <p className="text-sm text-gray-500">
                  将支持从 Unsplash 获取高质量背景图片，敬请期待
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <div className="h-px bg-gray-200 my-6"></div>

      {/* 显示效果设置 */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
          <Settings className="w-5 h-5 text-indigo-600" />
          显示效果设置
        </h3>

        <div className="grid grid-cols-1 gap-4">
          {/* 填充模式 */}
          <SettingItem
            label="填充模式"
            description="设置背景图片的显示方式"
          >
            <SelectControl
              value={backgroundSettings.display.fillMode}
              onValueChange={(fillMode) => updateDisplaySettings({ fillMode })}
              options={[
                { value: 'cover', label: '覆盖 (Cover)' },
                { value: 'contain', label: '包含 (Contain)' },
                { value: 'stretch', label: '拉伸 (Stretch)' },
                { value: 'center', label: '居中 (Center)' }
              ]}
              className="w-40"
            />
          </SettingItem>

          {/* 不透明度 */}
          <SettingItem
            label="不透明度"
            description="调整背景的不透明度"
          >
            <SliderControl
              value={backgroundSettings.display.opacity}
              onChange={(opacity) => updateDisplaySettings({ opacity })}
              min={10}
              max={100}
              step={5}
              suffix="%"
              className="w-32"
            />
          </SettingItem>

          {/* 模糊程度 */}
          <SettingItem
            label="模糊程度"
            description="为背景添加模糊效果"
          >
            <SliderControl
              value={backgroundSettings.display.blur}
              onChange={(blur) => updateDisplaySettings({ blur })}
              min={0}
              max={20}
              step={1}
              suffix="px"
              className="w-32"
            />
          </SettingItem>

          {/* 亮度调节 */}
          <SettingItem
            label="亮度调节"
            description="调整背景的亮度"
          >
            <SliderControl
              value={backgroundSettings.display.brightness}
              onChange={(brightness) => updateDisplaySettings({ brightness })}
              min={50}
              max={150}
              step={5}
              suffix="%"
              className="w-32"
            />
          </SettingItem>
        </div>
      </div>

      {/* 使用提示 */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-4">
          <div className="flex items-start gap-2">
            <div className="text-blue-600 mt-0.5">💡</div>
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-2">背景设置小贴士：</p>
              <ul className="text-xs space-y-1 text-blue-700">
                <li>• <strong>渐变色背景</strong>：现代化的视觉效果，加载速度快，支持无限缩放</li>
                <li>• <strong>本地图片</strong>：个性化定制，建议使用高分辨率横向图片</li>
                <li>• <strong>模糊和亮度</strong>：可以提升文字内容的可读性</li>
                <li>• <strong>不透明度</strong>：较低的不透明度可以突出前景内容</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
