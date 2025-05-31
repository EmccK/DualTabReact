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
 * 包含书签显示、布局、交互、分类等设置
 */
export function BookmarkSettings({ settings, onUpdate }: BookmarkSettingsProps) {
  // 每行数量选项
  const itemsPerRowOptions = [
    { value: 'auto', label: '自适应' },
    { value: '3', label: '3个/行' },
    { value: '4', label: '4个/行' },
    { value: '5', label: '5个/行' },
    { value: '6', label: '6个/行' },
    { value: '7', label: '7个/行' },
    { value: '8', label: '8个/行' },
  ];

  // 列数选项
  const columnsOptions = [
    { value: 'auto', label: '响应式' },
    { value: '3', label: '3列' },
    { value: '4', label: '4列' },
    { value: '5', label: '5列' },
    { value: '6', label: '6列' },
    { value: '7', label: '7列' },
    { value: '8', label: '8列' },
  ];

  // 纵横比选项
  const aspectRatioOptions = [
    { value: '1/1', label: '正方形' },
    { value: '4/3', label: '4:3' },
    { value: '3/2', label: '3:2' },
    { value: '16/9', label: '16:9' },
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
  const formatWidth = (value: number) => `${value}px`;

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
              title="书签图标大小"
              description="调整书签卡片中图标的显示大小"
            >
              <div className="w-32">
                <SliderControl
                  value={settings.display.iconSize}
                  onValueChange={(value) => onUpdate({ 
                    display: { ...settings.display, iconSize: value }
                  })}
                  min={16}
                  max={48}
                  step={2}
                  valueFormatter={formatPixels}
                />
              </div>
            </SettingItem>

            <SettingItem
              title="显示书签标题"
              description="在书签卡片中显示标题文字"
            >
              <ToggleSwitch
                checked={settings.display.showTitle}
                onCheckedChange={(checked) => onUpdate({ 
                  display: { ...settings.display, showTitle: checked }
                })}
              />
            </SettingItem>

            <SettingItem
              title="每行书签数量"
              description="设置网格布局下每行显示的书签数量"
            >
              <SelectOption
                value={String(settings.display.itemsPerRow)}
                onValueChange={(value) => onUpdate({ 
                  display: { 
                    ...settings.display, 
                    itemsPerRow: value === 'auto' ? 'auto' : Number(value)
                  }
                })}
                options={itemsPerRowOptions}
                className="w-28"
              />
            </SettingItem>

            <SettingItem
              title="卡片间距"
              description="调整书签卡片之间的间距"
            >
              <div className="w-32">
                <SliderControl
                  value={settings.display.cardSpacing}
                  onValueChange={(value) => onUpdate({ 
                    display: { ...settings.display, cardSpacing: value }
                  })}
                  min={4}
                  max={16}
                  step={2}
                  valueFormatter={formatPixels}
                />
              </div>
            </SettingItem>

            <SettingItem
              title="卡片内边距"
              description="调整书签卡片内部的填充空间"
            >
              <div className="w-32">
                <SliderControl
                  value={settings.display.cardPadding}
                  onValueChange={(value) => onUpdate({ 
                    display: { ...settings.display, cardPadding: value }
                  })}
                  min={8}
                  max={24}
                  step={2}
                  valueFormatter={formatPixels}
                />
              </div>
            </SettingItem>

            <SettingItem
              title="显示网站图标"
              description="在书签卡片中显示网站的favicon图标"
            >
              <ToggleSwitch
                checked={settings.display.showFavicons}
                onCheckedChange={(checked) => onUpdate({ 
                  display: { ...settings.display, showFavicons: checked }
                })}
              />
            </SettingItem>

            <SettingItem
              title="显示描述信息"
              description="在书签卡片中显示描述文字"
            >
              <ToggleSwitch
                checked={settings.display.showDescriptions}
                onCheckedChange={(checked) => onUpdate({ 
                  display: { ...settings.display, showDescriptions: checked }
                })}
              />
            </SettingItem>
          </div>
        </section>

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
      </div>

      {/* 右列 */}
      <div className="space-y-4">
        {/* 网格布局 */}
        <section>
          <h3 className="text-base font-semibold text-gray-900 mb-3 flex items-center">
            <span className="w-2 h-2 bg-orange-500 rounded-full mr-2"></span>
            网格布局
          </h3>
          <div className="space-y-0 border border-gray-200 rounded-lg bg-white">
            <SettingItem
              title="列数设置"
              description="设置网格的列数，响应式会根据屏幕自动调整"
            >
              <SelectOption
                value={String(settings.grid.columns)}
                onValueChange={(value) => onUpdate({ 
                  grid: { 
                    ...settings.grid, 
                    columns: value === 'auto' ? 'auto' : Number(value)
                  }
                })}
                options={columnsOptions}
                className="w-28"
              />
            </SettingItem>

            <SettingItem
              title="卡片纵横比"
              description="设置书签卡片的宽高比例"
            >
              <SelectOption
                value={settings.grid.aspectRatio}
                onValueChange={(value) => onUpdate({ 
                  grid: { ...settings.grid, aspectRatio: value }
                })}
                options={aspectRatioOptions}
                className="w-28"
              />
            </SettingItem>

            <SettingItem
              title="响应式布局"
              description="根据屏幕大小自动调整布局"
            >
              <ToggleSwitch
                checked={settings.grid.responsive}
                onCheckedChange={(checked) => onUpdate({ 
                  grid: { ...settings.grid, responsive: checked }
                })}
              />
            </SettingItem>

            <SettingItem
              title="最小卡片宽度"
              description="设置书签卡片的最小宽度"
            >
              <div className="w-32">
                <SliderControl
                  value={settings.grid.minCardWidth}
                  onValueChange={(value) => onUpdate({ 
                    grid: { ...settings.grid, minCardWidth: value }
                  })}
                  min={80}
                  max={200}
                  step={10}
                  valueFormatter={formatWidth}
                />
              </div>
            </SettingItem>

            <SettingItem
              title="最大卡片宽度"
              description="设置书签卡片的最大宽度"
            >
              <div className="w-32">
                <SliderControl
                  value={settings.grid.maxCardWidth}
                  onValueChange={(value) => onUpdate({ 
                    grid: { ...settings.grid, maxCardWidth: value }
                  })}
                  min={120}
                  max={300}
                  step={10}
                  valueFormatter={formatWidth}
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
