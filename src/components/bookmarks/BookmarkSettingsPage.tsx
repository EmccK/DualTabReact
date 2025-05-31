/**
 * 新版书签设置页面
 * 只包含样式选择和圆角调整
 */

import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { RotateCcw, Eye } from 'lucide-react';
import BookmarkStyleSelector from './BookmarkStyleSelector';
import BorderRadiusSlider from './BorderRadiusSlider';
import BookmarkCard from './BookmarkCard';
import { 
  DEFAULT_BOOKMARK_SETTINGS, 
  BOOKMARK_STYLE_TYPES 
} from '@/constants/bookmark-style.constants';
import type { BookmarkStyleSettings, BookmarkItem } from '@/types/bookmark-style.types';

interface BookmarkSettingsPageProps {
  settings: BookmarkStyleSettings;
  onSettingsChange: (settings: BookmarkStyleSettings) => void;
  disabled?: boolean;
  className?: string;
}

const BookmarkSettingsPage: React.FC<BookmarkSettingsPageProps> = ({
  settings,
  onSettingsChange,
  disabled = false,
  className = '',
}) => {
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // 示例书签数据
  const sampleBookmarks: BookmarkItem[] = [
    {
      id: 'sample1',
      title: 'OpenWrt',
      url: 'https://openwrt.org',
      iconType: 'text',
      iconText: 'Op',
      iconColor: '#f59e0b',
    },
    {
      id: 'sample2',
      title: 'FnOS',
      url: 'https://fnos.com',
      iconType: 'text',
      iconText: 'Fn',
      iconColor: '#10b981',
    },
    {
      id: 'sample3',
      title: 'MoviePilot',
      url: 'https://moviepilot.com',
      iconType: 'text',
      iconText: 'MP',
      iconColor: '#8b5cf6',
    },
  ];

  // 处理样式类型变更
  const handleStyleTypeChange = (styleType: typeof settings.styleType) => {
    const newSettings = { ...settings, styleType };
    onSettingsChange(newSettings);
    setHasUnsavedChanges(true);
  };

  // 处理圆角变更
  const handleBorderRadiusChange = (borderRadius: number) => {
    const newSettings = { ...settings, borderRadius };
    onSettingsChange(newSettings);
    setHasUnsavedChanges(true);
  };

  // 重置设置
  const handleReset = () => {
    onSettingsChange(DEFAULT_BOOKMARK_SETTINGS);
    setHasUnsavedChanges(false);
  };

  // 保存设置（这里可以添加实际的保存逻辑）
  const handleSave = () => {
    setHasUnsavedChanges(false);
    // 实际保存逻辑
    console.log('保存书签设置:', settings);
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            书签设置
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            自定义书签的显示样式和外观
          </p>
        </div>
        
        {/* 操作按钮 */}
        <div className="flex space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleReset}
            disabled={disabled || !hasUnsavedChanges}
          >
            <RotateCcw size={14} className="mr-1" />
            重置
          </Button>
          <Button
            size="sm"
            onClick={handleSave}
            disabled={disabled || !hasUnsavedChanges}
          >
            保存设置
          </Button>
        </div>
      </div>

      <Separator />

      {/* 主要内容 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 设置面板 */}
        <div className="lg:col-span-2 space-y-6">
          {/* 样式选择 */}
          <Card className="p-6">
            <BookmarkStyleSelector
              value={settings.styleType}
              onChange={handleStyleTypeChange}
              disabled={disabled}
            />
          </Card>

          {/* 圆角设置 */}
          <Card className="p-6">
            <BorderRadiusSlider
              value={settings.borderRadius}
              onChange={handleBorderRadiusChange}
              disabled={disabled}
            />
          </Card>

          {/* 设置说明 */}
          <Card className="p-6 bg-blue-50 dark:bg-blue-950/50 border-blue-200 dark:border-blue-800">
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Eye size={16} className="text-blue-600 dark:text-blue-400" />
                <Label className="text-sm font-medium text-blue-900 dark:text-blue-100">
                  设置说明
                </Label>
              </div>
              <div className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                <div>• <strong>卡片样式</strong>：图标和文字在同一行，有背景</div>
                <div>• <strong>图标样式</strong>：图标在上方，文字在下方，无背景</div>
                <div>• <strong>圆角设置</strong>：卡片样式调整整体圆角，图标样式调整图标圆角</div>
                <div>• 添加书签时文字图标支持任意字符数，但建议2-4个字符</div>
              </div>
            </div>
          </Card>
        </div>

        {/* 实时预览面板 */}
        <div className="space-y-4">
          <Card className="p-4">
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Eye size={16} className="text-gray-500" />
                <Label className="text-base font-medium text-gray-900 dark:text-gray-100">
                  实时预览
                </Label>
              </div>
              
              {/* 当前设置信息 */}
              <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
                <div>样式: {settings.styleType === BOOKMARK_STYLE_TYPES.CARD ? '卡片样式' : '图标样式'}</div>
                <div>圆角: {settings.borderRadius}px</div>
              </div>

              {/* 预览区域 */}
              <div className="p-6 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-lg">
                <div className={`
                  ${settings.styleType === BOOKMARK_STYLE_TYPES.CARD 
                    ? 'space-y-3' 
                    : 'grid grid-cols-2 gap-4 justify-items-center'
                  }
                `}>
                  {sampleBookmarks.slice(0, settings.styleType === BOOKMARK_STYLE_TYPES.CARD ? 3 : 4).map((bookmark) => (
                    <BookmarkCard
                      key={bookmark.id}
                      bookmark={bookmark}
                      settings={settings}
                    />
                  ))}
                </div>
              </div>
            </div>
          </Card>

          {/* 未保存提示 */}
          {hasUnsavedChanges && (
            <Card className="p-4 bg-yellow-50 dark:bg-yellow-950/50 border-yellow-200 dark:border-yellow-800">
              <div className="text-sm text-yellow-800 dark:text-yellow-200">
                <div className="font-medium mb-1">有未保存的更改</div>
                <div className="text-xs">请点击保存按钮来应用更改</div>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default BookmarkSettingsPage;
