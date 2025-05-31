/**
 * 新的统一书签图标组件
 * 整合三种图标类型，支持可配置样式
 */

import React, { useMemo } from 'react';
import { TextIcon, UploadIcon, OfficialIcon } from './icons';
import { ICON_TYPES } from '@/constants';
import type { Bookmark, NetworkMode } from '@/types';
import type { BaseIconProps, TextIconConfig, UploadIconConfig, OfficialIconConfig } from '@/types/bookmark-icon.types';

interface BookmarkIconV2Props {
  bookmark: Bookmark;
  networkMode: NetworkMode;
  size?: number;
  borderRadius?: number;
  className?: string;
  style?: React.CSSProperties;
  onLoad?: () => void;
  onError?: (error: Error) => void;
}

const BookmarkIconV2: React.FC<BookmarkIconV2Props> = ({
  bookmark,
  networkMode,
  size = 32,
  borderRadius = 8,
  className = '',
  style = {},
  onLoad,
  onError,
}) => {
  // 获取当前模式下的URL
  const getActiveUrl = () => {
    if (networkMode === 'internal' && bookmark.internalUrl) {
      return bookmark.internalUrl;
    }
    if (networkMode === 'external' && bookmark.externalUrl) {
      return bookmark.externalUrl;
    }
    return bookmark.url;
  };

  // 通用Props
  const baseProps: BaseIconProps = {
    size,
    borderRadius,
    className,
    style,
    onLoad,
    onError,
  };

  // 生成图标配置
  const iconConfig = useMemo(() => {
    const iconType = bookmark.iconType || ICON_TYPES.OFFICIAL;

    switch (iconType) {
      case ICON_TYPES.TEXT: {
        const config: TextIconConfig = {
          text: bookmark.iconText || bookmark.title?.charAt(0) || '?',
          fontSize: size * 0.6,
          fontWeight: 'bold',
          textColor: bookmark.iconColor || '#ffffff',
          backgroundColor: bookmark.backgroundColor || '#3b82f6',
          borderRadius,
          borderWidth: 0,
          borderColor: 'transparent',
        };
        return { type: ICON_TYPES.TEXT, config };
      }

      case ICON_TYPES.UPLOAD: {
        const config: UploadIconConfig = {
          imageData: bookmark.iconData || bookmark.icon || '',
          backgroundColor: bookmark.backgroundColor,
          borderRadius,
          borderWidth: 0,
          borderColor: 'transparent',
          objectFit: 'cover',
        };
        return { type: ICON_TYPES.UPLOAD, config };
      }

      case ICON_TYPES.OFFICIAL:
      default: {
        const config: OfficialIconConfig = {
          url: getActiveUrl(),
          fallbackUrls: [],
          currentFallbackIndex: 0,
          borderRadius,
          borderWidth: 0,
          borderColor: 'transparent',
          backgroundColor: bookmark.backgroundColor,
        };
        return { type: ICON_TYPES.OFFICIAL, config };
      }
    }
  }, [bookmark, networkMode, size, borderRadius]);

  // 渲染对应的图标组件
  const renderIcon = () => {
    switch (iconConfig.type) {
      case ICON_TYPES.TEXT:
        return (
          <TextIcon
            {...baseProps}
            config={iconConfig.config as TextIconConfig}
            fallbackText={bookmark.title}
          />
        );

      case ICON_TYPES.UPLOAD:
        return (
          <UploadIcon
            {...baseProps}
            config={iconConfig.config as UploadIconConfig}
          />
        );

      case ICON_TYPES.OFFICIAL:
      default:
        return (
          <OfficialIcon
            {...baseProps}
            config={iconConfig.config as OfficialIconConfig}
            url={getActiveUrl()}
          />
        );
    }
  };

  return (
    <div className={`bookmark-icon-v2 ${className}`} style={style}>
      {renderIcon()}
    </div>
  );
};

export default BookmarkIconV2;
