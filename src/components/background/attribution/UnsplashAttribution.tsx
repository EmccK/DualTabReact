import React from 'react';
import { ExternalLink, Camera } from 'lucide-react';
import type { UnsplashAttribution } from '@/types/attribution';
import { generateUnsplashUrl, formatCopyrightText } from '@/utils/attribution';

interface UnsplashAttributionProps {
  attribution: UnsplashAttribution;
  style?: 'compact' | 'full' | 'minimal';
  onLinkClick?: (url: string, linkType: 'profile' | 'photo') => void;
  className?: string;
}

/**
 * Unsplash专用归属组件
 * 显示摄影师信息和相关链接
 */
export const UnsplashAttribution: React.FC<UnsplashAttributionProps> = ({
  attribution,
  style = 'compact',
  onLinkClick,
  className = ''
}) => {
  /**
   * 处理链接点击
   */
  const handleLinkClick = (linkType: 'profile' | 'photo') => {
    const url = generateUnsplashUrl(attribution, linkType);
    if (url) {
      if (onLinkClick) {
        onLinkClick(url, linkType);
      } else {
        // 在新标签页中打开链接
        window.open(url, '_blank', 'noopener,noreferrer');
      }
    }
  };

  /**
   * 获取显示样式类名
   */
  const getStyleClasses = () => {
    const baseClasses = 'text-white/90 transition-all duration-200';
    
    switch (style) {
      case 'minimal':
        return `${baseClasses} text-xs`;
      case 'full':
        return `${baseClasses} text-sm`;
      case 'compact':
      default:
        return `${baseClasses} text-xs`;
    }
  };

  /**
   * 渲染紧凑样式
   */
  const renderCompactStyle = () => (
    <div className={`flex items-center gap-1 ${getStyleClasses()}`}>
      <Camera className="w-3 h-3 opacity-70" />
      <span>by</span>
      <button
        onClick={() => handleLinkClick('profile')}
        className="hover:text-white underline underline-offset-2 transition-colors"
        title={`查看 ${attribution.authorName} 的更多作品`}
      >
        {attribution.authorName}
      </button>
      <ExternalLink className="w-3 h-3 opacity-50" />
    </div>
  );

  /**
   * 渲染完整样式
   */
  const renderFullStyle = () => (
    <div className={`space-y-1 ${getStyleClasses()}`}>
      <div className="flex items-center gap-2">
        <Camera className="w-4 h-4 opacity-70" />
        <span className="font-medium">{formatCopyrightText(attribution)}</span>
      </div>
      <div className="flex items-center gap-3 text-xs opacity-80">
        <button
          onClick={() => handleLinkClick('profile')}
          className="flex items-center gap-1 hover:text-white underline underline-offset-2 transition-colors"
          title={`访问 ${attribution.authorName} 的个人主页`}
        >
          <span>作者主页</span>
          <ExternalLink className="w-3 h-3" />
        </button>
        <button
          onClick={() => handleLinkClick('photo')}
          className="flex items-center gap-1 hover:text-white underline underline-offset-2 transition-colors"
          title="查看原始图片"
        >
          <span>原图</span>
          <ExternalLink className="w-3 h-3" />
        </button>
      </div>
    </div>
  );

  /**
   * 渲染最小样式
   */
  const renderMinimalStyle = () => (
    <button
      onClick={() => handleLinkClick('profile')}
      className={`flex items-center gap-1 ${getStyleClasses()} hover:text-white transition-colors`}
      title={formatCopyrightText(attribution)}
    >
      <Camera className="w-3 h-3 opacity-50" />
      <span className="opacity-70">{attribution.authorName}</span>
    </button>
  );

  /**
   * 根据样式渲染内容
   */
  const renderContent = () => {
    switch (style) {
      case 'minimal':
        return renderMinimalStyle();
      case 'full':
        return renderFullStyle();
      case 'compact':
      default:
        return renderCompactStyle();
    }
  };

  return (
    <div className={`unsplash-attribution ${className}`}>
      {renderContent()}
    </div>
  );
};
