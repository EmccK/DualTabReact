/**
 * 官方图标组件
 * 支持多重回退和智能加载
 */

import React, { useState, useCallback, useEffect } from 'react';
import { Globe, AlertCircle } from 'lucide-react';
import IconBackground from './IconBackground';
import { FAVICON_SERVICE_URLS, ICON_RETRY_CONFIG } from '@/constants';
import { getUrlDomain } from '@/utils/url-utils';
import { getFaviconFallbackUrls } from '@/utils/icon-utils';
import type { BaseIconProps, OfficialIconConfig, IconStatus } from '@/types/bookmark-icon.types';

interface OfficialIconProps extends BaseIconProps {
  config: OfficialIconConfig;
  url: string;
}

const OfficialIcon: React.FC<OfficialIconProps> = ({
  config,
  url,
  size,
  borderRadius,
  className = '',
  style = {},
  onLoad,
  onError,
}) => {
  const [status, setStatus] = useState<IconStatus>('loading');
  const [currentUrl, setCurrentUrl] = useState<string>('');
  const [fallbackIndex, setFallbackIndex] = useState(0);
  const [retryCount, setRetryCount] = useState(0);
  const [lastError, setLastError] = useState<Error | null>(null);

  // 生成回退URL列表 - 使用增强的图标获取逻辑
  const generateFallbackUrls = useCallback((targetUrl: string): string[] => {
    // 使用新的智能图标获取函数
    return getFaviconFallbackUrls(targetUrl, size);
  }, [size]);

  // 初始化图标URL
  useEffect(() => {
    setStatus('loading');
    setFallbackIndex(0);
    setRetryCount(0);
    setLastError(null);

    const fallbackUrls = generateFallbackUrls(url);
    if (fallbackUrls.length > 0) {
      setCurrentUrl(fallbackUrls[0]);
    } else {
      setStatus('error');
      const error = new Error('无法解析域名');
      setLastError(error);
      onError?.(error);
    }
  }, [url, size, generateFallbackUrls, onError]);

  // 处理图片加载成功
  const handleImageLoad = useCallback(() => {
    setStatus('loaded');
    setLastError(null);
    onLoad?.();
  }, [onLoad]);

  // 处理图片加载失败
  const handleImageError = useCallback(() => {
    const fallbackUrls = generateFallbackUrls(url);
    const nextIndex = fallbackIndex + 1;

    // 还有备用URL可以尝试
    if (nextIndex < fallbackUrls.length) {
      setFallbackIndex(nextIndex);
      setCurrentUrl(fallbackUrls[nextIndex]);
      console.log(`尝试备用图标 ${nextIndex + 1}/${fallbackUrls.length}: ${fallbackUrls[nextIndex]}`);
      return;
    }

    // 可以重试
    if (retryCount < ICON_RETRY_CONFIG.maxRetries) {
      const delay = Math.min(
        ICON_RETRY_CONFIG.retryDelay * Math.pow(ICON_RETRY_CONFIG.backoffMultiplier, retryCount),
        ICON_RETRY_CONFIG.maxRetryDelay
      );

      setTimeout(() => {
        setRetryCount(prev => prev + 1);
        setFallbackIndex(0);
        setCurrentUrl(fallbackUrls[0]);
      }, delay);
      return;
    }

    // 所有尝试都失败了
    setStatus('error');
    const error = new Error(`图标加载失败: ${url}`);
    setLastError(error);
    onError?.(error);
  }, [url, fallbackIndex, retryCount, generateFallbackUrls, onError]);

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

  // 图片样式
  const imageStyle: React.CSSProperties = {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    borderRadius: `${borderRadius}px`,
  };

  // 渲染内容
  const renderContent = () => {
    // 加载中状态
    if (status === 'loading' && currentUrl) {
      return (
        <>
          <img
            src={currentUrl}
            alt="网站图标"
            style={{ ...imageStyle, display: 'none' }}
            onLoad={handleImageLoad}
            onError={handleImageError}
          />
          <div className="flex items-center justify-center bg-gray-200 animate-pulse rounded">
            <Globe size={size * 0.5} className="text-gray-400" />
          </div>
        </>
      );
    }

    // 加载成功状态
    if (status === 'loaded' && currentUrl) {
      return (
        <img
          src={currentUrl}
          alt="网站图标"
          style={imageStyle}
        />
      );
    }

    // 错误状态 - 显示默认图标
    return (
      <div className="flex items-center justify-center text-blue-500">
        <Globe size={size * 0.5} />
      </div>
    );
  };

  return (
    <IconBackground
      background={backgroundConfig}
      border={borderConfig}
      size={size}
      className={`official-icon ${className}`}
      style={style}
    >
      {renderContent()}
      
      {/* 开发环境错误提示 */}
      {process.env.NODE_ENV === 'development' && lastError && status === 'error' && (
        <div className="absolute -top-1 -right-1">
          <AlertCircle 
            size={12} 
            className="text-red-500" 
            title={`${lastError.message} (重试: ${retryCount}/${ICON_RETRY_CONFIG.maxRetries})`}
          />
        </div>
      )}
    </IconBackground>
  );
};

export default OfficialIcon;
