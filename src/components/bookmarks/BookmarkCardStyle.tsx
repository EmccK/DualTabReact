/**
 * 卡片样式书签组件
 * 对应图片1的样式：图标在左侧，文字在右侧，有背景
 */

import React, { useState } from 'react';
import BookmarkIcon from './BookmarkIcon';
import { CARD_STYLE_CONFIG } from '@/constants/bookmark-style.constants';
import type { BookmarkCardProps } from '@/types/bookmark-style.types';

const BookmarkCardStyle: React.FC<BookmarkCardProps> = ({
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

  const cardStyle: React.CSSProperties = {
    width: CARD_STYLE_CONFIG.width,
    height: CARD_STYLE_CONFIG.height,
    borderRadius: `${settings.borderRadius}px`,
    padding: CARD_STYLE_CONFIG.padding,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    backdropFilter: 'blur(10px)',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    display: 'flex',
    alignItems: 'center',
    gap: CARD_STYLE_CONFIG.spacing,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    userSelect: 'none',
    transform: isHovered ? `scale(${settings.hoverScale})` : 'scale(1)',
  };

  const textStyle: React.CSSProperties = {
    flex: 1,
    color: 'white',
    fontSize: '14px',
    fontWeight: '500',
    lineHeight: '1.2',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  };

  return (
    <div
      className={`group hover:shadow-lg active:scale-95 ${className}`}
      style={cardStyle}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleClick}
      onContextMenu={handleContextMenu}
    >
      {/* 书签图标 */}
      <BookmarkIcon
        bookmark={bookmark}
        size={CARD_STYLE_CONFIG.iconSize}
        borderRadius={settings.borderRadius * 0.6} // 图标圆角稍小
      />
      
      {/* 书签标题 */}
      <div style={textStyle} title={bookmark.title}>
        {bookmark.title}
      </div>
    </div>
  );
};

export default BookmarkCardStyle;
