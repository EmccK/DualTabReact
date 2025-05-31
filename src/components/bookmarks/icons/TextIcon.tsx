/**
 * 文字图标组件
 * 支持自定义文字、颜色和背景
 */

import React, { useMemo } from 'react';
import IconBackground from './IconBackground';
import type { BaseIconProps, TextIconConfig } from '@/types/bookmark-icon.types';

interface TextIconProps extends BaseIconProps {
  config: TextIconConfig;
  fallbackText?: string;
}

const TextIcon: React.FC<TextIconProps> = ({
  config,
  fallbackText,
  size,
  borderRadius,
  className = '',
  style = {},
  onLoad,
  onError,
}) => {
  // 计算显示的文字
  const displayText = useMemo(() => {
    const text = config.text || fallbackText || '?';
    return text.charAt(0).toUpperCase();
  }, [config.text, fallbackText]);

  // 计算文字样式
  const textStyle: React.CSSProperties = {
    fontSize: `${config.fontSize || size * 0.6}px`,
    fontWeight: config.fontWeight || 'bold',
    color: config.textColor || '#ffffff',
    lineHeight: 1,
    userSelect: 'none',
  };

  // 背景配置
  const backgroundConfig = {
    color: config.backgroundColor,
    opacity: 1,
  };

  // 边框配置
  const borderConfig = {
    width: config.borderWidth || 0,
    color: config.borderColor || 'transparent',
    style: 'solid' as const,
    radius: borderRadius,
  };

  // 组件挂载时触发加载完成
  React.useEffect(() => {
    onLoad?.();
  }, [onLoad]);

  return (
    <IconBackground
      background={backgroundConfig}
      border={borderConfig}
      size={size}
      className={`text-icon ${className}`}
      style={style}
    >
      <span style={textStyle}>
        {displayText}
      </span>
    </IconBackground>
  );
};

export default TextIcon;
