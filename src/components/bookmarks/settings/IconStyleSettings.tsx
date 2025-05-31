/**
 * 图标样式设置组件
 * 支持图标类型、文字、背景色等设置
 */

import React, { useState, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Globe, Type, Image, Upload, Trash2 } from 'lucide-react';
import ColorPicker from './ColorPicker';
import BorderRadiusSlider from './BorderRadiusSlider';
import { ICON_TYPES, ICON_TYPE_LABELS, ICON_TYPE_DESCRIPTIONS, FONT_WEIGHT_OPTIONS } from '@/constants';
import { validateImageFile, fileToBase64, compressImage } from '@/utils/icon-processing.utils';
import type { Bookmark } from '@/types';
import type { IconType } from '@/types/bookmark-icon.types';

interface IconStyleSettingsProps {
  bookmark: Bookmark;
  onChange: (updates: Partial<Bookmark>) => void;
  disabled?: boolean;
  className?: string;
}

const IconStyleSettings: React.FC<IconStyleSettingsProps> = ({
  bookmark,
  onChange,
  disabled = false,
  className = '',
}) => {
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const iconType = bookmark.iconType || ICON_TYPES.OFFICIAL;

  // 处理图标类型变更
  const handleIconTypeChange = useCallback((type: IconType) => {
    onChange({ iconType: type });
  }, [onChange]);

  // 处理文字图标设置
  const handleTextIconChange = useCallback((field: 'iconText' | 'iconColor' | 'backgroundColor', value: string) => {
    onChange({ [field]: value });
  }, [onChange]);

  // 处理文件上传
  const handleFileUpload = useCallback(async (file: File) => {
    try {
      setUploadError(null);
      setUploadProgress(0);

      // 验证文件
      const validation = validateImageFile(file);
      if (!validation.valid) {
        throw new Error(validation.error);
      }

      setUploadProgress(25);

      // 转换为base64
      const imageData = await fileToBase64(file);
      setUploadProgress(50);

      // 压缩图片
      const compressedData = await compressImage(imageData);
      setUploadProgress(75);

      // 更新书签
      onChange({
        iconType: ICON_TYPES.UPLOAD,
        iconData: compressedData,
      });

      setUploadProgress(100);
      setTimeout(() => setUploadProgress(null), 1000);
    } catch (error) {
      console.error('文件上传失败:', error);
      setUploadError(error instanceof Error ? error.message : '上传失败');
      setUploadProgress(null);
    }
  }, [onChange]);

  // 处理文件选择
  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  }, [handleFileUpload]);

  // 删除上传的图片
  const handleRemoveUploadedImage = useCallback(() => {
    onChange({
      iconType: ICON_TYPES.OFFICIAL,
      iconData: undefined,
    });
  }, [onChange]);

  // 渲染图标类型选择器
  const renderIconTypeSelector = () => {
    const iconTypes = [
      {
        type: ICON_TYPES.OFFICIAL,
        label: ICON_TYPE_LABELS[ICON_TYPES.OFFICIAL],
        description: ICON_TYPE_DESCRIPTIONS[ICON_TYPES.OFFICIAL],
        icon: Globe,
      },
      {
        type: ICON_TYPES.TEXT,
        label: ICON_TYPE_LABELS[ICON_TYPES.TEXT],
        description: ICON_TYPE_DESCRIPTIONS[ICON_TYPES.TEXT],
        icon: Type,
      },
      {
        type: ICON_TYPES.UPLOAD,
        label: ICON_TYPE_LABELS[ICON_TYPES.UPLOAD],
        description: ICON_TYPE_DESCRIPTIONS[ICON_TYPES.UPLOAD],
        icon: Image,
      },
    ];

    return (
      <div className="space-y-3">
        <Label className="text-sm font-medium text-gray-900 dark:text-gray-100">
          图标类型
        </Label>
        <div className="grid grid-cols-1 gap-3">
          {iconTypes.map((type) => {
            const Icon = type.icon;
            const isSelected = iconType === type.type;

            return (
              <Card
                key={type.type}
                className={`
                  cursor-pointer transition-all duration-200 hover:shadow-md
                  ${isSelected 
                    ? 'ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-950/50' 
                    : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'
                  }
                  ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
                `}
                onClick={() => !disabled && handleIconTypeChange(type.type)}
              >
                <div className="p-3 flex items-center space-x-3">
                  <Icon 
                    size={20} 
                    className={`
                      ${isSelected ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500'}
                    `}
                  />
                  <div className="flex-1">
                    <div className={`
                      text-sm font-medium
                      ${isSelected ? 'text-blue-700 dark:text-blue-300' : 'text-gray-700 dark:text-gray-300'}
                    `}>
                      {type.label}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {type.description}
                    </div>
                  </div>
                  {isSelected && (
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    );
  };

  // 渲染文字图标设置
  const renderTextIconSettings = () => (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label className="text-sm font-medium text-gray-900 dark:text-gray-100">
          显示文字
        </Label>
        <Input
          type="text"
          value={bookmark.iconText || ''}
          onChange={(e) => handleTextIconChange('iconText', e.target.value)}
          placeholder="输入要显示的文字"
          maxLength={2}
          disabled={disabled}
        />
        <div className="text-xs text-gray-500 dark:text-gray-400">
          建议使用1-2个字符，将自动取首字符显示
        </div>
      </div>

      <ColorPicker
        label="文字颜色"
        value={bookmark.iconColor || '#ffffff'}
        onChange={(color) => handleTextIconChange('iconColor', color)}
        type="text"
        disabled={disabled}
      />

      <ColorPicker
        label="背景颜色"
        value={bookmark.backgroundColor || '#3b82f6'}
        onChange={(color) => handleTextIconChange('backgroundColor', color)}
        type="background"
        disabled={disabled}
      />
    </div>
  );

  // 渲染上传图标设置
  const renderUploadIconSettings = () => (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label className="text-sm font-medium text-gray-900 dark:text-gray-100">
          上传图片
        </Label>
        
        {/* 文件上传区域 */}
        <div className="relative border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center">
          {uploadProgress !== null ? (
            <div className="space-y-2">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                上传中... {uploadProgress}%
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
            </div>
          ) : (
            <>
              <Upload className="mx-auto h-8 w-8 text-gray-400 mb-2" />
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                点击选择图片或拖拽到此处
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                支持 JPG, PNG, GIF, WebP，最大 5MB
              </div>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                disabled={disabled}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
              />
            </>
          )}
        </div>

        {uploadError && (
          <div className="text-sm text-red-600 dark:text-red-400">
            {uploadError}
          </div>
        )}
      </div>

      {/* 当前图片预览 */}
      {bookmark.iconData && (
        <div className="space-y-2">
          <Label className="text-sm font-medium text-gray-900 dark:text-gray-100">
            当前图片
          </Label>
          <Card className="p-3">
            <div className="flex items-center space-x-3">
              <img
                src={bookmark.iconData}
                alt="当前图标"
                className="w-12 h-12 rounded-lg object-cover border border-gray-300 dark:border-gray-600"
              />
              <div className="flex-1">
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  自定义图片
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRemoveUploadedImage}
                disabled={disabled}
                className="text-red-600 hover:text-red-700"
              >
                <Trash2 size={14} />
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* 背景色设置（可选） */}
      <ColorPicker
        label="图片背景色（可选）"
        value={bookmark.backgroundColor || 'transparent'}
        onChange={(color) => handleTextIconChange('backgroundColor', color)}
        type="background"
        disabled={disabled}
      />
    </div>
  );

  // 渲染官方图标设置
  const renderOfficialIconSettings = () => (
    <div className="space-y-4">
      <div className="text-sm text-gray-600 dark:text-gray-400">
        自动从网站获取官方图标，无需额外设置。
      </div>
      
      {/* 可选的背景色设置 */}
      <ColorPicker
        label="备用背景色（加载失败时显示）"
        value={bookmark.backgroundColor || '#3b82f6'}
        onChange={(color) => handleTextIconChange('backgroundColor', color)}
        type="background"
        disabled={disabled}
      />
    </div>
  );

  return (
    <div className={`space-y-6 ${className}`}>
      {/* 图标类型选择 */}
      {renderIconTypeSelector()}

      {/* 特定类型的设置 */}
      <Card className="p-4">
        <div className="space-y-4">
          <Label className="text-base font-medium text-gray-900 dark:text-gray-100">
            {ICON_TYPE_LABELS[iconType]}设置
          </Label>
          
          {iconType === ICON_TYPES.TEXT && renderTextIconSettings()}
          {iconType === ICON_TYPES.UPLOAD && renderUploadIconSettings()}
          {iconType === ICON_TYPES.OFFICIAL && renderOfficialIconSettings()}
        </div>
      </Card>

      {/* 通用样式设置 */}
      <Card className="p-4">
        <div className="space-y-4">
          <Label className="text-base font-medium text-gray-900 dark:text-gray-100">
            通用样式
          </Label>
          
          <BorderRadiusSlider
            value={8} // 这里应该从设置中获取
            onChange={(value) => {
              // 这里应该更新全局设置
              console.log('更新圆角:', value);
            }}
            disabled={disabled}
            showPreview={true}
          />
        </div>
      </Card>

      {/* 预览效果 */}
      <Card className="p-4">
        <div className="space-y-3">
          <Label className="text-base font-medium text-gray-900 dark:text-gray-100">
            预览效果
          </Label>
          
          <div className="flex justify-center space-x-6 p-4 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-lg">
            {/* 详细样式预览 */}
            <div className="text-center">
              <div className="w-20 h-16 bg-white/10 backdrop-blur-md border border-white/20 rounded-lg flex flex-col items-center justify-center p-2 mb-2">
                <div className="w-6 h-6 bg-blue-500 rounded-md mb-1 flex items-center justify-center text-white text-xs font-bold">
                  {iconType === ICON_TYPES.TEXT ? (bookmark.iconText?.[0] || 'A') : '🌐'}
                </div>
                <div className="text-xs text-white truncate w-full text-center">
                  {bookmark.title || '示例标题'}
                </div>
              </div>
              <span className="text-xs text-gray-500">详细样式</span>
            </div>
            
            {/* 紧凑样式预览 */}
            <div className="text-center">
              <div className="w-16 h-16 bg-white/10 backdrop-blur-md border border-white/20 rounded-lg flex flex-col items-center justify-between p-2 mb-2">
                <div className="flex-1 flex items-center">
                  <div className="w-5 h-5 bg-green-500 rounded-md flex items-center justify-center text-white text-xs font-bold">
                    {iconType === ICON_TYPES.TEXT ? (bookmark.iconText?.[0] || 'A') : '🌐'}
                  </div>
                </div>
                <div className="text-xs text-white truncate w-full text-center">
                  {bookmark.title || '示例'}
                </div>
              </div>
              <span className="text-xs text-gray-500">紧凑样式</span>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default IconStyleSettings;
