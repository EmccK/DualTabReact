/**
 * 图标样式书签组件
 * 对应图片2的样式：图标在上方，文字在下方，无背景
 * 使用新的统一图标组件
 */

import React, { useState } from 'react';
import { BookmarkIcon } from '@/components/icon';
import { ICON_STYLE_CONFIG } from '@/constants/bookmark-style.constants';
import type { BookmarkCardProps } from '@/types/bookmark-style.types';
import type { Bookmark } from '@/types';

const BookmarkIconStyle: React.FC<BookmarkCardProps> = ({
  bookmark,
  settings,
  onClick,
  onContextMenu,
  className = '',
}) => {
  const [isHovered, setIsHovered] = useState(false);

  const handleClick = () => {
    onClick?.(bookmark);
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    onContextMenu?.(bookmark, e);
  };

  // 转换BookmarkItem到Bookmark格式 - 简化版本
  const normalizedBookmark: Bookmark = {
    name: bookmark.title,
    title: bookmark.title,
    url: bookmark.url,
    description: bookmark.description,
    iconType: bookmark.iconType,
    iconText: bookmark.iconText,
    iconImage: bookmark.iconImage,
    iconData: bookmark.iconImage,
    iconColor: bookmark.iconColor,
    imageScale: bookmark.imageScale,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  const containerStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: ICON_STYLE_CONFIG.spacing,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    userSelect: 'none',
    maxWidth: ICON_STYLE_CONFIG.textMaxWidth,
    transform: isHovered ? `scale(${settings.hoverScale})` : 'scale(1)',
  };

  const textStyle: React.CSSProperties = {
    color: 'white',
    fontSize: '12px',
    fontWeight: '500',
    lineHeight: '1.2',
    textAlign: 'center',
    width: '100%',
    overflow: 'hidden',
    display: '-webkit-box',
    WebkitLineClamp: 1,
    WebkitBoxOrient: 'vertical',
    wordBreak: 'break-all',
  };

  return (
    <div
      className={`group active:scale-95 ${className}`}
      style={containerStyle}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleClick}
      onContextMenu={handleContextMenu}
    >
      {/* 书签图标 - 使用新的统一组件 */}
      <BookmarkIcon
        bookmark={normalizedBookmark}
        networkMode="external"
        size={ICON_STYLE_CONFIG.iconSize}
        borderRadius={settings.borderRadius}
        className="shadow-lg"
      />
      
      {/* 书签标题 */}
      <div style={textStyle} title={bookmark.title}>
        {bookmark.title}
      </div>
    </div>
  );
};

export default BookmarkIconStyle;
