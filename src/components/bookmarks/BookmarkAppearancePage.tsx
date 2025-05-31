/**
 * 书签外观设置页面
 * 整合所有书签相关的外观设置
 */

import React, { useState, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { RotateCcw, Eye, Settings2, Palette } from 'lucide-react';
import { 
  DisplayStyleSelector, 
  BorderRadiusSlider, 
  ColorPicker, 
  IconStyleSettings 
} from './settings';
import type { BookmarkDisplayStyle } from '@/types/bookmark-display.types';
import type { BookmarkSettings } from '@/types/settings';
import type { Bookmark } from '@/types';
import { BOOKMARK_DISPLAY_STYLES } from '@/constants';

interface BookmarkAppearancePageProps {
  bookmarkSettings: BookmarkSettings;
  onSettingsChange: (updates: Partial<BookmarkSettings>) => void;
  sampleBookmark?: Bookmark;
  disabled?: boolean;
  className?: string;
}

const BookmarkAppearancePage: React.FC<BookmarkAppearancePageProps> = ({
  bookmarkSettings,
  onSettingsChange,
  sampleBookmark,
  disabled = false,
  className = '',
}) => {
  const [previewStyle, setPreviewStyle] = useState<BookmarkDisplayStyle>(
    BOOKMARK_DISPLAY_STYLES.DETAILED
  );
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // 示例书签数据
  const defaultSampleBookmark: Bookmark = {
    id: 'sample',
    name: '示例书签',
    title: '示例书签',
    url: 'https://example.com',
    description: '这是一个示例书签的描述信息',
    iconType: 'official',
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  const bookmark = sampleBookmark || defaultSampleBookmark;

  // 处理显示样式变更
  const handleDisplayStyleChange = useCallback((style: BookmarkDisplayStyle) => {
    setPreviewStyle(style);
    // 这里应该更新设置，但由于我们还没有完整的设置系统，先记录变更
    setHasUnsavedChanges(true);
    console.log('显示样式变更:', style);
  }, []);

  // 处理圆角变更
  const handleBorderRadiusChange = useCallback((radius: number) => {
    setHasUnsavedChanges(true);
    console.log('圆角变更:', radius);
  }, []);

  // 处理书签更新
  const handleBookmarkChange = useCallback((updates: Partial<Bookmark>) => {
    setHasUnsavedChanges(true);
    console.log('书签更新:', updates);
  }, []);

  // 重置所有设置
  const handleReset = useCallback(() => {
    setPreviewStyle(BOOKMARK_DISPLAY_STYLES.DETAILED);
    setHasUnsavedChanges(false);
    console.log('重置设置');
  }, []);

  // 保存设置
  const handleSave = useCallback(() => {
    setHasUnsavedChanges(false);
    console.log('保存设置');
  }, []);

  return (
    <div className={`space-y-6 ${className}`}>
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            书签外观设置
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            自定义书签的显示样式、图标和颜色
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
          <Tabs defaultValue="display" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="display" className="flex items-center space-x-1">
                <Eye size={14} />
                <span>显示</span>
              </TabsTrigger>
              <TabsTrigger value="style" className="flex items-center space-x-1">
                <Settings2 size={14} />
                <span>样式</span>
              </TabsTrigger>
              <TabsTrigger value="icon" className="flex items-center space-x-1">
                <Palette size={14} />
                <span>图标</span>
              </TabsTrigger>
            </TabsList>

            {/* 显示设置 */}
            <TabsContent value="display" className="space-y-6">
              <Card className="p-6">
                <DisplayStyleSelector
                  value={previewStyle}
                  onChange={handleDisplayStyleChange}
                  disabled={disabled}
                />
              </Card>

              <Card className="p-6">
                <div className="space-y-4">
                  <Label className="text-base font-medium text-gray-900 dark:text-gray-100">
                    布局设置
                  </Label>
                  
                  {/* 这里可以添加更多布局相关的设置 */}
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    更多布局选项即将推出...
                  </div>
                </div>
              </Card>
            </TabsContent>

            {/* 样式设置 */}
            <TabsContent value="style" className="space-y-6">
              <Card className="p-6">
                <BorderRadiusSlider
                  value={8}
                  onChange={handleBorderRadiusChange}
                  disabled={disabled}
                  showPreview={true}
                />
              </Card>

              <Card className="p-6">
                <div className="space-y-4">
                  <Label className="text-base font-medium text-gray-900 dark:text-gray-100">
                    颜色主题
                  </Label>
                  
                  <ColorPicker
                    label="默认背景色"
                    value="#3b82f6"
                    onChange={(color) => console.log('背景色变更:', color)}
                    type="background"
                    disabled={disabled}
                  />
                </div>
              </Card>
            </TabsContent>

            {/* 图标设置 */}
            <TabsContent value="icon" className="space-y-6">
              <IconStyleSettings
                bookmark={bookmark}
                onChange={handleBookmarkChange}
                disabled={disabled}
              />
            </TabsContent>
          </Tabs>
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
              
              {/* 预览切换 */}
              <div className="flex space-x-2">
                <Button
                  variant={previewStyle === BOOKMARK_DISPLAY_STYLES.DETAILED ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setPreviewStyle(BOOKMARK_DISPLAY_STYLES.DETAILED)}
                >
                  详细
                </Button>
                <Button
                  variant={previewStyle === BOOKMARK_DISPLAY_STYLES.COMPACT ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setPreviewStyle(BOOKMARK_DISPLAY_STYLES.COMPACT)}
                >
                  紧凑
                </Button>
              </div>

              {/* 预览区域 */}
              <div className="p-6 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-lg">
                <div className="flex justify-center">
                  {previewStyle === BOOKMARK_DISPLAY_STYLES.DETAILED ? (
                    <div className="w-32 h-24 bg-white/10 backdrop-blur-md border border-white/20 rounded-lg flex flex-col items-center justify-center p-3">
                      <div className="w-8 h-8 bg-blue-500 rounded-lg mb-2 flex items-center justify-center text-white text-sm font-bold">
                        {bookmark.iconType === 'text' ? (bookmark.iconText?.[0] || bookmark.title[0]) : '🌐'}
                      </div>
                      <div className="text-xs text-white text-center truncate w-full">
                        {bookmark.title}
                      </div>
                      <div className="text-xs text-white/70 text-center truncate w-full mt-1">
                        {bookmark.description}
                      </div>
                    </div>
                  ) : (
                    <div className="w-20 h-24 bg-white/10 backdrop-blur-md border border-white/20 rounded-lg flex flex-col items-center justify-between p-2">
                      <div className="flex-1 flex items-center">
                        <div className="w-6 h-6 bg-green-500 rounded-lg flex items-center justify-center text-white text-xs font-bold">
                          {bookmark.iconType === 'text' ? (bookmark.iconText?.[0] || bookmark.title[0]) : '🌐'}
                        </div>
                      </div>
                      <div className="text-xs text-white text-center truncate w-full">
                        {bookmark.title}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* 预览信息 */}
              <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
                <div>样式: {previewStyle === BOOKMARK_DISPLAY_STYLES.DETAILED ? '详细样式' : '紧凑样式'}</div>
                <div>图标类型: {bookmark.iconType || 'official'}</div>
                <div>圆角: 8px</div>
              </div>
            </div>
          </Card>

          {/* 设置提示 */}
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

export default BookmarkAppearancePage;
