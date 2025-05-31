/**
 * 上传图标组件
 * 支持本地图片上传和背景色设置
 */

import React, { useState, useCallback } from 'react';
import { Image, AlertCircle } from 'lucide-react';
import IconBackground from './IconBackground';
import type { BaseIconProps, UploadIconConfig, IconStatus } from '@/types/bookmark-icon.types';

interface UploadIconProps extends BaseIconProps {
  config: UploadIconConfig;
}

const UploadIcon: React.FC<UploadIconProps> = ({
  config,
  size,
  borderRadius,
  className = '',
  style = {},
  onLoad,
  onError,
}) => {
  const [status, setStatus] = useState<IconStatus>('loading');
  const [imageError, setImageError] = useState<Error | null>(null);

  // 处理图片加载成功
  const handleImageLoad = useCallback(() => {
    setStatus('loaded');
    setImageError(null);
    onLoad?.();
  }, [onLoad]);

  // 处理图片加载失败
  const handleImageError = useCallback(() => {
    const error = new Error('上传图片加载失败');
    setStatus('error');
    setImageError(error);
    onError?.(error);
  }, [onError]);

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
    objectFit: config.objectFit || 'cover',
    borderRadius: `${borderRadius}px`,
  };

  // 渲染内容
  const renderContent = () => {
    // 如果没有图片数据，显示错误状态
    if (!config.imageData) {
      return (
        <div className="flex items-center justify-center text-gray-400">
          <Image size={size * 0.4} />
        </div>
      );
    }

    // 加载中状态
    if (status === 'loading') {
      return (
        <>
          <img
            src={config.imageData}
            alt="上传的图标"
            style={imageStyle}
            onLoad={handleImageLoad}
            onError={handleImageError}
          />
          <div className="absolute inset-0 flex items-center justify-center bg-gray-200 animate-pulse rounded">
            <Image size={size * 0.4} className="text-gray-400" />
          </div>
        </>
      );
    }

    // 加载成功状态
    if (status === 'loaded') {
      return (
        <img
          src={config.imageData}
          alt="上传的图标"
          style={imageStyle}
        />
      );
    }

    // 错误状态
    return (
      <div className="flex items-center justify-center text-red-400">
        <AlertCircle size={size * 0.4} />
      </div>
    );
  };

  return (
    <IconBackground
      background={backgroundConfig}
      border={borderConfig}
      size={size}
      className={`upload-icon ${className}`}
      style={style}
    >
      {renderContent()}
      
      {/* 开发环境错误提示 */}
      {process.env.NODE_ENV === 'development' && imageError && (
        <div className="absolute -top-1 -right-1">
          <AlertCircle 
            size={12} 
            className="text-red-500" 
            title={imageError.message}
          />
        </div>
      )}
    </IconBackground>
  );
};

export default UploadIcon;
