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
 * 包含书签显示、布局、交互等设置
 */
export function BookmarkSettings({ settings, onUpdate }: BookmarkSettingsProps) {
  const viewOptions = [
    { 
      value: 'grid', 
      label: '网格视图', 
      description: '以网格形式显示书签' 
    },
    { 
      value: 'list', 
      label: '列表视图', 
      description: '以列表形式显示书签' 
    },
  ];

  const cardSizeOptions = [
    { 
      value: 'small', 
      label: '小', 
      description: '紧凑的书签卡片' 
    },
    { 
      value: 'medium', 
      label: '中', 
      description: '标准的书签卡片' 
    },
    { 
      value: 'large', 
      label: '大', 
      description: '宽松的书签卡片' 
    },
  ];

  const formatItemCount = (count: number) => `${count} 个/行`;

  return (
    <div className="space-y-6">
      {/* 显示设置 */}
      <section>
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
          显示设置
        </h3>
        <div className="space-y-0 border border-gray-200 rounded-lg bg-white">
          <SettingItem
            title="默认视图"
            description="书签的默认显示方式"
          >
            <SelectOption
              value={settings.defaultView}
              onValueChange={(value) => onUpdate({ defaultView: value as BookmarkSettings['defaultView'] })}
              options={viewOptions}
              className="w-32"
            />
          </SettingItem>
          
          <SettingItem
            title="卡片大小"
            description="书签卡片的显示大小"
          >
            <SelectOption
              value={settings.cardSize}
              onValueChange={(value) => onUpdate({ cardSize: value as BookmarkSettings['cardSize'] })}
              options={cardSizeOptions}
              className="w-24"
            />
          </SettingItem>
          
          <SettingItem
            title="每行书签数量"
            description="网格视图下每行显示的书签数量"
          >
            <div className="w-40">
              <SliderControl
                value={settings.itemsPerRow}
                onValueChange={(value) => onUpdate({ itemsPerRow: value })}
                min={3}
                max={8}
                step={1}
                valueFormatter={formatItemCount}
              />
            </div>
          </SettingItem>
        </div>
      </section>

      {/* 内容设置 */}
      <section>
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <span className="w-2 h-2 bg-purple-500 rounded-full mr-3"></span>
          内容设置
        </h3>
        <div className="space-y-0 border border-gray-200 rounded-lg bg-white">
          <SettingItem
            title="显示网站图标"
            description="在书签卡片中显示网站的favicon图标"
          >
            <ToggleSwitch
              checked={settings.showFavicons}
              onCheckedChange={(checked) => onUpdate({ showFavicons: checked })}
            />
          </SettingItem>
          
          <SettingItem
            title="显示描述信息"
            description="在书签卡片中显示描述文字"
          >
            <ToggleSwitch
              checked={settings.showDescriptions}
              onCheckedChange={(checked) => onUpdate({ showDescriptions: checked })}
            />
          </SettingItem>
        </div>
      </section>

      {/* 交互设置 */}
      <section>
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <span className="w-2 h-2 bg-orange-500 rounded-full mr-3"></span>
          交互设置
        </h3>
        <div className="space-y-0 border border-gray-200 rounded-lg bg-white">
          <SettingItem
            title="启用拖拽排序"
            description="允许通过拖拽重新排列书签顺序"
          >
            <ToggleSwitch
              checked={settings.enableDragSort}
              onCheckedChange={(checked) => onUpdate({ enableDragSort: checked })}
            />
          </SettingItem>
        </div>
      </section>
    </div>
  );
}
