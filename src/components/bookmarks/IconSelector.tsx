/**
 * 图标选择器组件 - 重定向到新的统一组件
 * 保持向后兼容性
 */

import React from 'react';
import { IconSelector as NewIconSelector } from '@/components/icon';
import type { IconType } from '@/types';
import type { ImageScaleConfig } from '@/types/bookmark-style.types';

// 兼容旧的接口
interface IconSelectorProps {
  iconType: IconType;
  iconText?: string;
  iconData?: string;
  backgroundColor?: string;
  url?: string;
  imageScale?: ImageScaleConfig;
  onIconTypeChange: (type: IconType) => void;
  onIconTextChange: (text: string) => void;
  onIconUpload: (data: string) => void;
  onImageScaleChange?: (config: ImageScaleConfig) => void;
  onImageUrlChange?: (url: string) => void;
  className?: string;
}

export function IconSelector({
  iconType,
  iconText = '',
  iconData,
  backgroundColor = '#3b82f6',
  url = '',
  imageScale,
  onIconTypeChange,
  onIconTextChange,
  onIconUpload,
  onImageScaleChange,
  onImageUrlChange,
  className
}: IconSelectorProps) {
  // 处理颜色变化（兼容旧接口）
  const handleColorChange = (color: string) => {
    // 旧接口没有专门的颜色回调，暂时忽略
  };

  return (
    <NewIconSelector
      iconType={iconType}
      iconText={iconText}
      iconData={iconData}
      iconColor={backgroundColor}
      url={url}
      imageScale={imageScale}
      onIconTypeChange={onIconTypeChange}
      onIconTextChange={onIconTextChange}
      onIconColorChange={handleColorChange}
      onIconUpload={onIconUpload}
      onImageScaleChange={onImageScaleChange}
      className={className}
    />
  );
}

export default IconSelector;
