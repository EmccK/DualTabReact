import React, { useMemo } from 'react';
import { cn } from '@/lib/utils';
import type { BackgroundSettings } from '@/types/settings';

interface BackgroundPreviewProps {
  settings: BackgroundSettings;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  onClick?: () => void;
}

/**
 * 背景预览组件
 * 显示当前背景设置的预览效果
 */
export function BackgroundPreview({
  settings,
  className,
  size = 'md',
  showLabel = true,
  onClick,
}: BackgroundPreviewProps) {
  // 计算预览样式
  const previewStyles = useMemo(() => {
    const { type, color, gradient, currentLocalImage, localImages, display } = settings;
    const {
      fillMode,
      opacity,
      blur,
      brightness,
      contrast,
      saturation,
      overlay,
      overlayColor,
      overlayOpacity,
    } = display;

    let backgroundImage = 'none';
    let backgroundColor = 'transparent';

    // 根据背景类型设置图像或颜色
    switch (type) {
      case 'color':
        backgroundColor = color;
        break;
      case 'gradient':
        // 生成CSS渐变
        const gradientColors = gradient.colors
          .sort((a, b) => a.position - b.position)
          .map(c => `${c.color} ${c.position}%`)
          .join(', ');
        
        if (gradient.type === 'linear') {
          backgroundImage = `linear-gradient(${gradient.direction}deg, ${gradientColors})`;
        } else {
          backgroundImage = `radial-gradient(circle at ${gradient.radialPosition.x}% ${gradient.radialPosition.y}%, ${gradientColors})`;
        }
        break;
      case 'local':
        if (currentLocalImage) {
          const image = localImages.find(img => img.id === currentLocalImage);
          if (image) {
            backgroundImage = `url(${image.data})`;
          }
        }
        break;
      case 'unsplash':
        // Unsplash图片将在后续实现
        if (settings.currentUnsplashImage) {
          backgroundImage = `url(${settings.currentUnsplashImage.url})`;
        }
        break;
    }

    // 构建CSS滤镜
    const filters = [];
    if (blur > 0) filters.push(`blur(${blur}px)`);
    if (brightness !== 100) filters.push(`brightness(${brightness}%)`);
    if (contrast !== 100) filters.push(`contrast(${contrast}%)`);
    if (saturation !== 100) filters.push(`saturate(${saturation}%)`);

    // 主背景样式
    const mainStyle: React.CSSProperties = {
      backgroundImage,
      backgroundColor,
      backgroundSize: (type === 'color' || type === 'gradient') ? 'auto' : fillMode,
      backgroundPosition: 'center',
      backgroundRepeat: fillMode === 'repeat' ? 'repeat' : 'no-repeat',
      opacity: opacity / 100,
      filter: filters.length > 0 ? filters.join(' ') : 'none',
    };

    // 叠加层样式
    const overlayStyle: React.CSSProperties = overlay
      ? {
          backgroundColor: overlayColor,
          opacity: overlayOpacity / 100,
        }
      : {};

    return { main: mainStyle, overlay: overlayStyle, hasOverlay: overlay };
  }, [settings]);

  // 获取背景类型标签
  const getTypeLabel = () => {
    switch (settings.type) {
      case 'color':
        return '纯色背景';
      case 'gradient':
        const gradientType = settings.gradient.type === 'linear' ? '线性' : '径向';
        return `${gradientType}渐变`;
      case 'local':
        if (settings.currentLocalImage) {
          const image = settings.localImages.find(img => img.id === settings.currentLocalImage);
          return image ? `本地图片: ${image.name}` : '本地图片';
        }
        return '本地图片 (未选择)';
      case 'unsplash':
        return settings.currentUnsplashImage
          ? `Unsplash: ${settings.currentUnsplashImage.author}`
          : 'Unsplash (未选择)';
      default:
        return '未知类型';
    }
  };

  // 尺寸样式
  const sizeClasses = {
    sm: 'w-16 h-10',
    md: 'w-24 h-16',
    lg: 'w-32 h-20',
  };

  return (
    <div className={cn('space-y-2', className)}>
      {/* 预览区域 */}
      <div
        className={cn(
          'relative overflow-hidden rounded-lg border-2 border-gray-200 transition-all duration-200',
          sizeClasses[size],
          onClick && 'cursor-pointer hover:border-gray-300 hover:scale-105'
        )}
        onClick={onClick}
      >
        {/* 主背景 */}
        <div
          className="absolute inset-0"
          style={previewStyles.main}
        />
        
        {/* 叠加层 */}
        {previewStyles.hasOverlay && (
          <div
            className="absolute inset-0"
            style={previewStyles.overlay}
          />
        )}
        
        {/* 无背景时的占位符 */}
        {settings.type === 'local' && !settings.currentLocalImage && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
            <div className="text-center">
              <div className="w-6 h-6 mx-auto mb-1 bg-gray-300 rounded" />
              <p className="text-xs text-gray-500">无图片</p>
            </div>
          </div>
        )}
        
        {settings.type === 'unsplash' && !settings.currentUnsplashImage && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
            <div className="text-center">
              <div className="w-6 h-6 mx-auto mb-1 bg-gray-300 rounded" />
              <p className="text-xs text-gray-500">无图片</p>
            </div>
          </div>
        )}
        
        {/* 类型指示器 */}
        <div className="absolute bottom-1 left-1">
          <div className={cn(
            'px-1.5 py-0.5 text-xs font-medium rounded shadow-sm',
            settings.type === 'color' && 'bg-blue-500 text-white',
            settings.type === 'gradient' && 'bg-purple-500 text-white',
            settings.type === 'local' && 'bg-green-500 text-white',
            settings.type === 'unsplash' && 'bg-pink-500 text-white'
          )}>
            {settings.type === 'color' && '色'}
            {settings.type === 'gradient' && '渐'}
            {settings.type === 'local' && '本'}
            {settings.type === 'unsplash' && 'U'}
          </div>
        </div>
      </div>
      
      {/* 标签信息 */}
      {showLabel && (
        <div className="space-y-1">
          <p className="text-xs font-medium text-gray-700 truncate">
            {getTypeLabel()}
          </p>
          
          {/* 效果信息 */}
          <div className="flex flex-wrap gap-1">
            {settings.display.opacity < 100 && (
              <span className="text-xs px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded">
                透明度 {settings.display.opacity}%
              </span>
            )}
            {settings.display.blur > 0 && (
              <span className="text-xs px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded">
                模糊 {settings.display.blur}px
              </span>
            )}
            {settings.display.brightness !== 100 && (
              <span className="text-xs px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded">
                亮度 {settings.display.brightness}%
              </span>
            )}
            {settings.display.overlay && (
              <span className="text-xs px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded">
                叠加层
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
