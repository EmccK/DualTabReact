/**
 * 统一的书签图标组件
 * 替换所有现有的图标组件，提供一致的接口和功能
 */

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { Globe, Image, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  isInternalDomain,
  extractDomain,
  generateDefaultIconColor,
  getFaviconFallbackUrls
} from '@/utils/icon-utils';
import { iconCache } from '@/utils/icon-cache';
import type { Bookmark, NetworkMode } from '@/types';
import type { IconType } from '@/types/bookmark-icon.types';

// 开发环境下加载调试工具
if (process.env.NODE_ENV === 'development') {
  import('@/utils/icon-debug');
}

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
  const [currentFaviconUrl, setCurrentFaviconUrl] = useState<string | null>(null);
  const [fallbackIndex, setFallbackIndex] = useState(0);
  const [allUrlsFailed, setAllUrlsFailed] = useState(false);
  const [cacheChecked, setCacheChecked] = useState(false);

  // 获取图标类型
  const iconType: IconType = bookmark.iconType || 'official';

  // 当书签或网络模式改变时重置状态并立即检查缓存
  useEffect(() => {
    
    // 重置所有状态
    setImageLoaded(false);
    setImageError(false);
    setIsLoading(true);
    setFallbackIndex(0);
    setAllUrlsFailed(false);
    setCurrentFaviconUrl(null); // 先清空，避免显示错误的图标
    setCacheChecked(false);
    
    // 立即检查验证缓存
    if (iconType === 'official') {
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
      
      // 如果是内网地址，直接跳过
      if (isInternalDomain(domain)) {
        return;
      }
      
      // 优先检查已验证的缓存（成功URL记忆）
      iconCache.getValidated(activeUrl, size).then(validatedUrl => {
        
        if (validatedUrl) {
          setCurrentFaviconUrl(validatedUrl);
          setIsLoading(false);
        }
        setCacheChecked(true);
      }).catch(() => {
        setCacheChecked(true);
      });
    } else {
      setCacheChecked(true);
    }
  }, [bookmark.url, bookmark.internalUrl, bookmark.externalUrl, networkMode, size, iconType]);

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
    
    // 将成功加载的图标URL保存为已验证的缓存
    if (currentFaviconUrl && iconType === 'official') {
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
      
      // 检查是否已经是验证缓存并保存
      iconCache.getValidated(activeUrl, size).then(existingValidated => {
        if (existingValidated !== currentFaviconUrl) {
          // 保存新的成功URL到验证缓存
          iconCache.setValidated(activeUrl, size, currentFaviconUrl);
        }
      });
    }
    
    onLoad?.();
  }, [onLoad, currentFaviconUrl, iconType, bookmark, networkMode, size]);

  // 处理图片加载错误 - 尝试备用URL
  const handleImageError = useCallback(() => {
    console.log(`❌ 图标加载失败: ${currentFaviconUrl}`);
    
    // 只有官方图标才尝试备用URL
    if (bookmark.iconType === 'official' || !bookmark.iconType) {
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
      let fallbackUrls = getFaviconFallbackUrls(activeUrl, size);

      // 如果书签有保存的真实favicon URL，优先使用
      if (bookmark.realFaviconUrl) {
        fallbackUrls = [bookmark.realFaviconUrl, ...fallbackUrls.filter(url => url !== bookmark.realFaviconUrl)];
      }

      const nextIndex = fallbackIndex + 1;

      // 还有备用URL可以尝试
      if (nextIndex < fallbackUrls.length) {
        console.log(`🔄 尝试下一个URL (${nextIndex}/${fallbackUrls.length-1}): ${fallbackUrls[nextIndex]}`);
        setFallbackIndex(nextIndex);
        setCurrentFaviconUrl(fallbackUrls[nextIndex]);
        setImageLoaded(false);
        setImageError(false);
        setIsLoading(true);
        return;
      }

      // 所有URL都失败了
      console.log(`💥 所有fallback URL都失败了: ${activeUrl}`);
      setAllUrlsFailed(true);
    }

    // 显示错误状态
    setImageError(true);
    setIsLoading(false);
    const error = new Error(`图标加载失败: ${bookmark.title}`);
    onError?.(error);
  }, [bookmark, networkMode, size, fallbackIndex, currentFaviconUrl, onError]);

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

    // 如果所有URL都失败了，显示兜底文字图标
    if (allUrlsFailed || (imageError && !currentFaviconUrl)) {
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

    // 初始化favicon URL（如果还没有设置）- 等待缓存检查完成
    if (!currentFaviconUrl && !allUrlsFailed && cacheChecked) {
      let fallbackUrls = getFaviconFallbackUrls(activeUrl, size);

      // 如果书签有保存的真实favicon URL，优先使用
      if (bookmark.realFaviconUrl) {
        fallbackUrls = [bookmark.realFaviconUrl, ...fallbackUrls.filter(url => url !== bookmark.realFaviconUrl)];
      }

      if (fallbackUrls.length > 0) {
        console.log(`🔄 开始尝试第一个URL [${bookmark.title}]: ${fallbackUrls[0]}`);
        setCurrentFaviconUrl(fallbackUrls[0]);
        setFallbackIndex(0);
        setIsLoading(true);
        setImageError(false);
      } else {
        // 没有可用的URL，直接显示兜底图标
        console.log(`❌ 没有可用的fallback URL [${bookmark.title}]`);
        setAllUrlsFailed(true);
      }
      return null; // 等待下次渲染
    }

    // 如果缓存还没检查完成，显示加载状态
    if (!cacheChecked) {
      return (
        <div style={containerStyle} className="relative">
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100 animate-pulse">
            <Globe size={size * 0.4} className="text-gray-400" />
          </div>
        </div>
      );
    }

    if (!currentFaviconUrl) {
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
            src={currentFaviconUrl}
            alt={bookmark.title}
            className="w-full h-full object-contain"
            style={{ borderRadius: `${borderRadius * 0.5}px` }}
            onLoad={handleImageLoad}
            onError={handleImageError}
          />
        </div>
        {(imageError || allUrlsFailed) && (
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
