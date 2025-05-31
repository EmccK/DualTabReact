import React from 'react';
import { SettingItem } from '../components/SettingItem';
import { ToggleSwitch } from '../components/ToggleSwitch';
import { SelectOption } from '../components/SelectOption';
import { SliderControl } from '../components/SliderControl';
import type { BookmarkSettings } from '@/types/settings';

interface BookmarkSettingsProps {
  settings: BookmarkSettings;
  onUpdate: (updates: Partial<BookmarkSettings>) => void;
}

/**
 * 书签设置分组
 * 只包含新书签系统相关的设置
 */
export function BookmarkSettings({ settings, onUpdate }: BookmarkSettingsProps) {
  // 书签样式选项
  const styleTypeOptions = [
    { value: 'card', label: '卡片样式' },
    { value: 'icon', label: '图标样式' },
  ];

  // 打开方式选项
  const openInOptions = [
    { value: 'current', label: '当前标签' },
    { value: 'new', label: '新标签' },
  ];

  // 边栏显示模式选项
  const sidebarVisibleOptions = [
    { value: 'always', label: '始终显示' },
    { value: 'auto', label: '自动隐藏' },
  ];

  // 格式化函数
  const formatPixels = (value: number) => `${value}px`;
  const formatScale = (value: number) => `${Math.round(value * 100)}%`;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* 左列 */}
      <div className="space-y-4">
        {/* 显示设置 */}
        <section>
          <h3 className="text-base font-semibold text-gray-900 mb-3 flex items-center">
            <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
            显示设置
          </h3>
          <div className="space-y-0 border border-gray-200 rounded-lg bg-white">
            <SettingItem
              title="书签样式"
              description="选择书签样式类型：卡片式或图标式"
            >
              <SelectOption
                value={settings.display.styleType || 'card'}
                onValueChange={(value) => onUpdate({ 
                  display: { ...settings.display, styleType: value as 'card' | 'icon' }
                })}
                options={styleTypeOptions}
                className="w-28"
              />
            </SettingItem>

            <SettingItem
              title="圆角大小"
              description={settings.display.styleType === 'card' ? "调整卡片整体圆角" : "调整图标圆角"}
            >
              <div className="w-32">
                <SliderControl
                  value={settings.display.borderRadius}
                  onValueChange={(value) => onUpdate({ 
                    display: { ...settings.display, borderRadius: value }
                  })}
                  min={0}
                  max={100}
                  step={1}
                  valueFormatter={formatPixels}
                />
              </div>
            </SettingItem>


            {settings.display.styleType === 'card' && (
              <SettingItem
                title="显示描述信息"
                description="在书签中显示描述文字"
              >
                <ToggleSwitch
                  checked={settings.display.showDescriptions}
                  onCheckedChange={(checked) => onUpdate({ 
                    display: { ...settings.display, showDescriptions: checked }
                  })}
                />
              </SettingItem>
            )}
          </div>
        </section>
      </div>

      {/* 右列 */}
      <div className="space-y-4">
        {/* 交互行为 */}
        <section>
          <h3 className="text-base font-semibold text-gray-900 mb-3 flex items-center">
            <span className="w-2 h-2 bg-purple-500 rounded-full mr-2"></span>
            交互行为
          </h3>
          <div className="space-y-0 border border-gray-200 rounded-lg bg-white">
            <SettingItem
              title="点击打开方式"
              description="设置点击书签时的打开行为"
            >
              <SelectOption
                value={settings.behavior.openIn}
                onValueChange={(value) => onUpdate({ 
                  behavior: { ...settings.behavior, openIn: value as 'current' | 'new' }
                })}
                options={openInOptions}
                className="w-28"
              />
            </SettingItem>

            <SettingItem
              title="悬停缩放比例"
              description="鼠标悬停时的缩放程度"
            >
              <div className="w-32">
                <SliderControl
                  value={settings.behavior.hoverScale}
                  onValueChange={(value) => onUpdate({ 
                    behavior: { ...settings.behavior, hoverScale: value }
                  })}
                  min={1.0}
                  max={1.2}
                  step={0.05}
                  valueFormatter={formatScale}
                />
              </div>
            </SettingItem>
          </div>
        </section>

        {/* 分类管理 */}
        <section>
          <h3 className="text-base font-semibold text-gray-900 mb-3 flex items-center">
            <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
            分类管理
          </h3>
          <div className="space-y-0 border border-gray-200 rounded-lg bg-white">
            <SettingItem
              title="边栏显示模式"
              description="控制分类边栏的显示行为"
            >
              <SelectOption
                value={settings.categories.sidebarVisible}
                onValueChange={(value) => onUpdate({ 
                  categories: { ...settings.categories, sidebarVisible: value as 'always' | 'auto' }
                })}
                options={sidebarVisibleOptions}
                className="w-28"
              />
            </SettingItem>
          </div>
        </section>
      </div>
    </div>
  );
}
