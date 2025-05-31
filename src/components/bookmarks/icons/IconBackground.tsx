/**
 * 图标背景组件
 * 提供统一的图标背景样式处理
 */

import React from 'react';
import type { IconBackground, IconBorder } from '@/types/bookmark-icon.types';

interface IconBackgroundProps {
  children: React.ReactNode;
  background?: IconBackground;
  border?: IconBorder;
  size: number;
  className?: string;
  style?: React.CSSProperties;
  onClick?: () => void;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
}

const IconBackground: React.FC<IconBackgroundProps> = ({
  children,
  background,
  border,
  size,
  className = '',
  style = {},
  onClick,
  onMouseEnter,
  onMouseLeave,
}) => {
  // 计算背景样式
  const getBackgroundStyle = (): React.CSSProperties => {
    if (!background) return {};

    const styles: React.CSSProperties = {
      opacity: background.opacity ?? 1,
    };

    if (background.color) {
      styles.backgroundColor = background.color;
    }

    if (background.gradient) {
      const { type, colors, direction } = background.gradient;
      
      if (type === 'linear') {
        const angle = direction || 0;
        styles.background = `linear-gradient(${angle}deg, ${colors.join(', ')})`;
      } else if (type === 'radial') {
        styles.background = `radial-gradient(circle, ${colors.join(', ')})`;
      }
    }

    return styles;
  };

  // 计算边框样式
  const getBorderStyle = (): React.CSSProperties => {
    if (!border) return {};

    return {
      borderWidth: `${border.width}px`,
      borderColor: border.color,
      borderStyle: border.style,
      borderRadius: `${border.radius}px`,
    };
  };

  // 组合样式
  const combinedStyle: React.CSSProperties = {
    width: `${size}px`,
    height: `${size}px`,
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    ...getBackgroundStyle(),
    ...getBorderStyle(),
    ...style,
  };

  return (
    <div
      className={`icon-background ${className}`}
      style={combinedStyle}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {children}
    </div>
  );
};

export default IconBackground;
