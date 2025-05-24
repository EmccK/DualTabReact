import React from 'react';
import { SettingItem } from '../components/SettingItem';
import { ToggleSwitch } from '../components/ToggleSwitch';
import { SelectOption } from '../components/SelectOption';
import { SliderControl } from '../components/SliderControl';
import type { BackgroundSettings } from '@/types/settings';

interface BackgroundSettingsProps {
  settings: BackgroundSettings;
  onUpdate: (updates: Partial<BackgroundSettings>) => void;
}

/**
 * 背景设置分组
 * 包含背景类型、Unsplash设置、效果调节等设置
 */
export function BackgroundSettings({ settings, onUpdate }: BackgroundSettingsProps) {
  const backgroundTypeOptions = [
    { 
      value: 'unsplash', 
      label: 'Unsplash图片', 
      description: '使用Unsplash API获取精美图片' 
    },
    { 
      value: 'local', 
      label: '本地图片', 
      description: '使用自己上传的图片' 
    },
    { 
      value: 'solid', 
      label: '纯色背景', 
      description: '使用单一颜色作为背景' 
    },
  ];

  const unsplashCategoryOptions = [
    { value: 'nature', label: '自然风光', description: '山川湖海、花草树木' },
    { value: 'architecture', label: '建筑艺术', description: '现代建筑、古典建筑' },
    { value: 'texture', label: '纹理材质', description: '各种材质纹理' },
    { value: 'minimal', label: '简约风格', description: '简洁清爽的图片' },
    { value: 'abstract', label: '抽象艺术', description: '抽象图案和色彩' },
    { value: 'wallpapers', label: '精选壁纸', description: '高质量壁纸图片' },
  ];

  const refreshIntervalOptions = [
    { value: '1', label: '1小时', description: '每小时更换背景' },
    { value: '6', label: '6小时', description: '每6小时更换背景' },
    { value: '24', label: '24小时', description: '每天更换背景' },
    { value: '168', label: '1周', description: '每周更换背景' },
    { value: '0', label: '手动更换', description: '不自动更换背景' },
  ];

  const formatHours = (hours: number) => {
    if (hours === 0) return '手动';
    if (hours === 1) return '1小时';
    if (hours < 24) return `${hours}小时`;
    if (hours === 24) return '1天';
    return `${Math.round(hours / 24)}天`;
  };

  const formatOpacity = (value: number) => `${value}%`;

  return (
    <div className="space-y-6">
      {/* 背景类型 */}
      <section>
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <span className="w-2 h-2 bg-pink-500 rounded-full mr-3"></span>
          背景类型
        </h3>
        <div className="space-y-0 border border-gray-200 rounded-lg bg-white">
          <SettingItem
            title="背景模式"
            description="选择背景图片的来源"
          >
            <SelectOption
              value={settings.type}
              onValueChange={(value) => onUpdate({ type: value as BackgroundSettings['type'] })}
              options={backgroundTypeOptions}
              className="w-36"
            />
          </SettingItem>
          
          {settings.type === 'solid' && (
            <SettingItem
              title="背景颜色"
              description="选择纯色背景的颜色"
            >
              <input
                type="color"
                value={settings.solidColor}
                onChange={(e) => onUpdate({ solidColor: e.target.value })}
                className="w-12 h-8 rounded border border-gray-300 cursor-pointer"
              />
            </SettingItem>
          )}
        </div>
      </section>

      {/* Unsplash设置 */}
      {settings.type === 'unsplash' && (
        <section>
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <span className="w-2 h-2 bg-cyan-500 rounded-full mr-3"></span>
            Unsplash设置
          </h3>
          <div className="space-y-0 border border-gray-200 rounded-lg bg-white">
            <SettingItem
              title="图片分类"
              description="选择Unsplash图片的类别"
            >
              <SelectOption
                value={settings.unsplashCategory}
                onValueChange={(value) => onUpdate({ unsplashCategory: value })}
                options={unsplashCategoryOptions}
                className="w-36"
              />
            </SettingItem>
            
            <SettingItem
              title="刷新频率"
              description="自动更换背景图片的时间间隔"
            >
              <SelectOption
                value={settings.refreshInterval.toString()}
                onValueChange={(value) => onUpdate({ refreshInterval: parseInt(value) })}
                options={refreshIntervalOptions}
                className="w-32"
              />
            </SettingItem>
            
            <SettingItem
              title="显示图片归属"
              description="在页面底部显示图片作者和来源信息"
            >
              <ToggleSwitch
                checked={settings.showAttribution}
                onCheckedChange={(checked) => onUpdate({ showAttribution: checked })}
              />
            </SettingItem>
          </div>
        </section>
      )}

      {/* 视觉效果 */}
      <section>
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <span className="w-2 h-2 bg-yellow-500 rounded-full mr-3"></span>
          视觉效果
        </h3>
        <div className="space-y-0 border border-gray-200 rounded-lg bg-white">
          <SettingItem
            title="模糊程度"
            description="调节背景图片的模糊效果"
          >
            <div className="w-40">
              <SliderControl
                value={settings.blurLevel}
                onValueChange={(value) => onUpdate({ blurLevel: value })}
                min={0}
                max={10}
                step={1}
                valueFormatter={(value) => value === 0 ? '无' : `${value}级`}
              />
            </div>
          </SettingItem>
          
          <SettingItem
            title="透明度"
            description="调节背景的透明度"
          >
            <div className="w-40">
              <SliderControl
                value={settings.opacity}
                onValueChange={(value) => onUpdate({ opacity: value })}
                min={10}
                max={100}
                step={5}
                valueFormatter={formatOpacity}
              />
            </div>
          </SettingItem>
        </div>
      </section>
    </div>
  );
}
