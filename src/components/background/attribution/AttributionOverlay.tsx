import React from 'react';
import type { Attribution, AttributionDisplayConfig } from '@/types/attribution';
import { useAttributionDisplay } from '@/hooks/attribution';

interface AttributionOverlayProps {
  attribution: Attribution | null;
  config?: Partial<AttributionDisplayConfig>;
  className?: string;
}

/**
 * 背景图片归属信息叠加层组件
 * 在背景图片上显示版权归属信息
 */
export const AttributionOverlay: React.FC<AttributionOverlayProps> = ({
  attribution,
  config = {},
  className = ''
}) => {
  // 完整的配置对象
  const fullConfig: AttributionDisplayConfig = {
    show: true,
    position: 'bottom-right',
    style: 'compact',
    autoHide: false,
    autoHideDelay: 3000,
    opacity: 0.8,
    ...config
  };

  // 使用归属信息显示控制Hook
  const {
    state,
    isHovered,
    handleMouseEnter,
    handleMouseLeave,
    shouldShow
  } = useAttributionDisplay(attribution, fullConfig);

  // 如果不应该显示，返回空
  if (!shouldShow || !state.current) {
    return null;
  }

  /**
   * 获取位置样式类名
   */
  const getPositionClasses = () => {
    switch (fullConfig.position) {
      case 'bottom-left':
        return 'bottom-4 left-4';
      case 'top-right':
        return 'top-4 right-4';
      case 'top-left':
        return 'top-4 left-4';
      case 'bottom-right':
      default:
        return 'bottom-4 right-4';
    }
  };

  /**
   * 获取容器样式
   */
  const getContainerStyle = () => ({
    opacity: isHovered ? 1 : fullConfig.opacity
  });

  /**
   * 处理链接点击
   */
  const handleLinkClick = (url: string, linkType: 'profile' | 'photo') => {
    // 在Chrome扩展环境中安全地打开外部链接
    if (typeof chrome !== 'undefined' && chrome.tabs) {
      chrome.tabs.create({ url, active: false });
    } else {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  /**
   * 渲染归属信息内容
   */
  const renderAttributionContent = () => {
    switch (state.current.source) {
      case 'local':
      case 'upload':
        return (
          <div className="text-white/70 text-xs flex items-center gap-1">
            <span>本地图片</span>
            {state.current.authorName && (
              <>
                <span>•</span>
                <span>{state.current.authorName}</span>
              </>
            )}
          </div>
        );
      
      default:
        return (
          <div className="text-white/70 text-xs">
            {state.current.authorName || '未知来源'}
          </div>
        );
    }
  };

  return (
    <div
      className={`
        fixed z-50 pointer-events-auto
        ${getPositionClasses()}
        ${className}
      `}
      style={getContainerStyle()}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div
        className={`
          bg-black/40 backdrop-blur-sm rounded-lg px-3 py-2
          border border-white/10
          transition-all duration-300 ease-out
          ${isHovered ? 'bg-black/60 scale-105' : ''}
          ${fullConfig.style === 'full' ? 'min-w-48' : ''}
        `}
      >
        {renderAttributionContent()}
      </div>
    </div>
  );
};
