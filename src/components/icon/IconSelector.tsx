/**
 * 简化的图标选择器组件
 * 基于新的统一架构重构
 */

import React, { useState, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Upload, Type, Globe } from 'lucide-react';
import { cn } from '@/lib/utils';
import { 
  validateImageFile, 
  fileToBase64, 
  compressAndScaleImage
} from '@/utils/icon-processing.utils';
import { generateDefaultIconColor } from '@/utils/icon-utils';
import { ICON_TYPES, PRESET_BACKGROUND_COLORS } from '@/constants/icon.constants';
import type { IconType } from '@/types/bookmark-icon.types';
import type { ImageScaleConfig } from '@/types/bookmark-style.types';

interface IconSelectorProps {
  iconType: IconType;
  iconText?: string;
  iconData?: string;
  iconColor?: string;
  url?: string;
  imageScale?: ImageScaleConfig;
  onIconTypeChange: (type: IconType) => void;
  onIconTextChange: (text: string) => void;
  onIconColorChange: (color: string) => void;
  onIconUpload: (data: string) => void;
  onImageScaleChange?: (config: ImageScaleConfig) => void;
  className?: string;
}

export const IconSelector: React.FC<IconSelectorProps> = ({
  iconType,
  iconText = '',
  iconData,
  iconColor,
  imageScale,
  onIconTypeChange,
  onIconTextChange,
  onIconColorChange,
  onIconUpload,
  className
}) => {
  const [uploadFileName, setUploadFileName] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 处理图标类型选择
  const handleIconTypeSelect = useCallback((type: IconType) => {
    onIconTypeChange(type);
  }, [onIconTypeChange]);

  // 处理文字输入
  const handleTextChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const text = e.target.value;
    onIconTextChange(text);
    
    // 如果没有设置颜色，自动生成一个
    if (!iconColor && text) {
      const defaultColor = generateDefaultIconColor(text);
      onIconColorChange(defaultColor);
    }
  }, [onIconTextChange, onIconColorChange, iconColor]);

  // 处理颜色选择
  const handleColorSelect = useCallback((color: string) => {
    onIconColorChange(color);
  }, [onIconColorChange]);

  // 处理文件上传
  const handleFileUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 验证文件
    const validation = validateImageFile(file);
    if (!validation.valid) {
      alert(validation.error);
      return;
    }

    try {
      setIsUploading(true);
      setUploadFileName(file.name);

      // 转换为base64
      const imageData = await fileToBase64(file);
      
      // 压缩图片
      const compressedData = await compressAndScaleImage(
        imageData,
        imageScale,
        256,
        256,
        0.8
      );

      onIconUpload(compressedData);
    } catch {
      alert('图片上传失败，请重试');
    } finally {
      setIsUploading(false);
    }
  }, [imageScale, onIconUpload]);

  // 触发文件选择
  const handleUploadClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  // 渲染图标预览
  const renderIconPreview = () => {
    const previewSize = 48;
    const previewStyle = {
      width: previewSize,
      height: previewSize,
      borderRadius: '8px',
    };

    switch (iconType) {
      case ICON_TYPES.TEXT: {
        const text = iconText || 'A';
        const backgroundColor = iconColor || generateDefaultIconColor(text);
        return (
          <div
            className="flex items-center justify-center text-white font-bold shadow-md"
            style={{
              ...previewStyle,
              backgroundColor,
              fontSize: `${previewSize * 0.4}px`,
            }}
          >
            {text.charAt(0).toUpperCase()}
          </div>
        );
      }

      case ICON_TYPES.UPLOAD:
        return iconData ? (
          <img
            src={iconData}
            alt="上传的图标"
            className="shadow-md object-cover"
            style={previewStyle}
          />
        ) : (
          <div
            className="flex items-center justify-center bg-gray-100 text-gray-400 shadow-md"
            style={previewStyle}
          >
            <Upload size={previewSize * 0.4} />
          </div>
        );

      case ICON_TYPES.OFFICIAL:
      default:
        return (
          <div
            className="flex items-center justify-center bg-blue-50 text-blue-500 shadow-md"
            style={previewStyle}
          >
            <Globe size={previewSize * 0.4} />
          </div>
        );
    }
  };

  return (
    <div className={cn("space-y-4", className)}>
      {/* 图标类型选择 */}
      <div className="flex space-x-2">
        <Button
          type="button"
          variant={iconType === ICON_TYPES.OFFICIAL ? 'default' : 'outline'}
          onClick={() => handleIconTypeSelect(ICON_TYPES.OFFICIAL)}
          className="flex-1 h-12 flex-col space-y-1"
          size="sm"
        >
          <Globe className="w-4 h-4" />
          <span className="text-xs">官方</span>
        </Button>

        <Button
          type="button"
          variant={iconType === ICON_TYPES.TEXT ? 'default' : 'outline'}
          onClick={() => handleIconTypeSelect(ICON_TYPES.TEXT)}
          className="flex-1 h-12 flex-col space-y-1"
          size="sm"
        >
          <Type className="w-4 h-4" />
          <span className="text-xs">文字</span>
        </Button>

        <Button
          type="button"
          variant={iconType === ICON_TYPES.UPLOAD ? 'default' : 'outline'}
          onClick={() => handleIconTypeSelect(ICON_TYPES.UPLOAD)}
          className="flex-1 h-12 flex-col space-y-1"
          size="sm"
        >
          <Upload className="w-4 h-4" />
          <span className="text-xs">上传</span>
        </Button>
      </div>

      {/* 图标预览和设置 */}
      <div className="flex items-start space-x-4">
        {/* 预览 */}
        <div className="flex-shrink-0">
          {renderIconPreview()}
        </div>

        {/* 设置 */}
        <div className="flex-1 space-y-3">
          {/* 文字图标设置 */}
          {iconType === ICON_TYPES.TEXT && (
            <>
              <Input
                value={iconText}
                onChange={handleTextChange}
                placeholder="输入文字"
                maxLength={4}
                className="h-9"
              />
              
              {/* 颜色选择 */}
              <div className="grid grid-cols-4 gap-2">
                {PRESET_BACKGROUND_COLORS.map(({ label, value }) => (
                  <button
                    key={value}
                    type="button"
                    className={cn(
                      "w-8 h-8 rounded border-2 border-gray-200 transition-all",
                      iconColor === value && "border-gray-900 scale-110"
                    )}
                    style={{ backgroundColor: value }}
                    onClick={() => handleColorSelect(value)}
                    title={label}
                  />
                ))}
              </div>
            </>
          )}

          {/* 上传图标设置 */}
          {iconType === ICON_TYPES.UPLOAD && (
            <div className="space-y-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
              
              <Button
                type="button"
                variant="outline"
                onClick={handleUploadClick}
                disabled={isUploading}
                className="w-full h-9"
                size="sm"
              >
                <Upload className="w-4 h-4 mr-2" />
                {isUploading ? '上传中...' : '选择图片'}
              </Button>
              
              {uploadFileName && (
                <p className="text-xs text-gray-600 truncate">
                  {uploadFileName}
                </p>
              )}
            </div>
          )}

          {/* 官方图标说明 */}
          {iconType === ICON_TYPES.OFFICIAL && (
            <p className="text-sm text-gray-600">
              自动从网站获取官方图标
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default IconSelector;
