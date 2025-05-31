/**
 * 图标样式书签组件
 * 对应图片2的样式：图标在上方，文字在下方，无背景
 */

import React from 'react';
import BookmarkIcon from './BookmarkIcon';
import { ICON_STYLE_CONFIG } from '@/constants/bookmark-style.constants';
import type { BookmarkCardProps } from '@/types/bookmark-style.types';

const BookmarkIconStyle: React.FC<BookmarkCardProps> = ({
  bookmark,
  settings,
  onClick,
  onContextMenu,
  className = '',
}) => {
  const handleClick = () => {
    onClick?.(bookmark);
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    onContextMenu?.(bookmark, e);
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
      className={`group hover:scale-105 active:scale-95 ${className}`}
      style={containerStyle}
      onClick={handleClick}
      onContextMenu={handleContextMenu}
    >
      {/* 书签图标 */}
      <BookmarkIcon
        bookmark={bookmark}
        size={ICON_STYLE_CONFIG.iconSize}
        borderRadius={settings.borderRadius} // 图标式样式中，调整的是图标的圆角
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
