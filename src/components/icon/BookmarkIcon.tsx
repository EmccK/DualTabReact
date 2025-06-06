/**
 * 统一的书签图标组件
 * 替换所有现有的图标组件，提供一致的接口和功能
 */

import React, { useState, useCallback, useMemo } from 'react';
import { Globe, Image, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { 
  getBookmarkIconUrl, 
  isInternalDomain, 
  extractDomain,
  generateDefaultIconColor 
} from '@/utils/icon-utils';
import type { Bookmark, NetworkMode } from '@/types';
import type { IconType } from '@/types/bookmark-icon.types';

interface BookmarkIconProps {
  bookmark: Bookmark;
  networkMode: NetworkMode;
  size?: number;
  borderRadius?: number;
  className?: string;
  showLoadingState?: boolean;
  onClick?: () => void;
  onLoad?: () => void;
  onError?: (error: Error) => void;
}

export const BookmarkIcon: React.FC<BookmarkIconProps> = ({
  bookmark,
  networkMode,
  size = 32,
  borderRadius = 8,
  className,
  showLoadingState = true,
  onClick,
  onLoad,
  onError,
}) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // 获取图标类型
  const iconType: IconType = bookmark.iconType || 'official';

  // 统一的容器样式
  const containerStyle = useMemo(() => ({
    width: size,
    height: size,
    borderRadius: `${borderRadius}px`,
    overflow: 'hidden',
    flexShrink: 0,
  }), [size, borderRadius]);

  // 处理图片加载成功
  const handleImageLoad = useCallback(() => {
    setImageLoaded(true);
    setImageError(false);
    setIsLoading(false);
    onLoad?.();
  }, [onLoad]);

  // 处理图片加载错误
  const handleImageError = useCallback(() => {
    setImageError(true);
    setIsLoading(false);
    const error = new Error(`图标加载失败: ${bookmark.title}`);
    onError?.(error);
  }, [bookmark.title, onError]);

  // 渲染文字图标
  const renderTextIcon = () => {
    const text = bookmark.iconText || bookmark.title.charAt(0).toUpperCase();
    const backgroundColor = bookmark.iconColor || generateDefaultIconColor(text);
    
    return (
      <div
        className="flex items-center justify-center text-white font-bold transition-colors duration-200"
        style={{
          ...containerStyle,
          backgroundColor,
          fontSize: `${size * 0.4}px`,
        }}
      >
        {text}
      </div>
    );
  };

  // 渲染上传图标
  const renderUploadIcon = () => {
    const imageData = bookmark.iconData || bookmark.iconImage;
    
    if (!imageData) {
      return (
        <div
          className="flex items-center justify-center bg-gray-100 text-gray-400"
          style={containerStyle}
        >
          <Image size={size * 0.4} />
        </div>
      );
    }

    return (
      <div style={containerStyle} className="relative">
        {showLoadingState && isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100 animate-pulse">
            <Image size={size * 0.4} className="text-gray-400" />
          </div>
        )}
        <img
          src={imageData}
          alt={bookmark.title}
          className={cn(
            "w-full h-full object-cover transition-opacity duration-200",
            imageLoaded ? "opacity-100" : "opacity-0"
          )}
          style={{ borderRadius: `${borderRadius}px` }}
          onLoad={handleImageLoad}
          onError={handleImageError}
        />
        {imageError && (
          <div className="absolute inset-0 flex items-center justify-center bg-red-50 text-red-400">
            <AlertCircle size={size * 0.4} />
          </div>
        )}
      </div>
    );
  };

  // 渲染官方图标
  const renderOfficialIcon = () => {
    // 获取当前激活的URL
    const getActiveUrl = () => {
      if (networkMode === 'internal' && bookmark.internalUrl) {
        return bookmark.internalUrl;
      }
      if (networkMode === 'external' && bookmark.externalUrl) {
        return bookmark.externalUrl;
      }
      return bookmark.url;
    };

    const activeUrl = getActiveUrl();
    const domain = extractDomain(activeUrl);

    // 检查是否为内网地址
    if (isInternalDomain(domain)) {
      return (
        <div
          className="flex items-center justify-center bg-orange-50 text-orange-600 font-medium"
          style={{
            ...containerStyle,
            fontSize: `${size * 0.5}px`,
          }}
        >
          🏠
        </div>
      );
    }

    // 获取favicon URL
    const faviconUrl = getBookmarkIconUrl(bookmark, networkMode, Math.min(size, 64));
    
    if (!faviconUrl) {
      // 回退到文字图标
      const fallbackText = bookmark.title.slice(0, 2).toUpperCase();
      const backgroundColor = bookmark.iconColor || generateDefaultIconColor(fallbackText);
      
      return (
        <div
          className="flex items-center justify-center text-white font-bold"
          style={{
            ...containerStyle,
            backgroundColor,
            fontSize: `${size * 0.35}px`,
          }}
        >
          {fallbackText}
        </div>
      );
    }

    return (
      <div style={containerStyle} className="relative">
        {showLoadingState && isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100 animate-pulse">
            <Globe size={size * 0.4} className="text-gray-400" />
          </div>
        )}
        <div 
          className={cn(
            "w-full h-full bg-white p-1 transition-opacity duration-200",
            imageLoaded ? "opacity-100" : "opacity-0"
          )}
          style={{ borderRadius: `${borderRadius}px` }}
        >
          <img
            src={faviconUrl}
            alt={bookmark.title}
            className="w-full h-full object-contain"
            style={{ borderRadius: `${borderRadius * 0.5}px` }}
            onLoad={handleImageLoad}
            onError={handleImageError}
          />
        </div>
        {imageError && (
          <div
            className="absolute inset-0 flex items-center justify-center text-white font-bold"
            style={{
              backgroundColor: bookmark.iconColor || generateDefaultIconColor(bookmark.title),
              fontSize: `${size * 0.35}px`,
            }}
          >
            {bookmark.title.slice(0, 2).toUpperCase()}
          </div>
        )}
      </div>
    );
  };

  // 根据图标类型渲染内容
  const renderIconContent = () => {
    switch (iconType) {
      case 'text':
        return renderTextIcon();
      case 'upload':
        return renderUploadIcon();
      case 'official':
      default:
        return renderOfficialIcon();
    }
  };

  return (
    <div
      className={cn(
        'cursor-pointer transition-transform duration-200 hover:scale-105',
        className
      )}
      onClick={onClick}
      title={bookmark.title}
    >
      {renderIconContent()}
    </div>
  );
};

export default BookmarkIcon;
