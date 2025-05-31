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
  showDescriptions = false,
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

  // 计算卡片高度：与网格统一高度保持一致
  const cardHeight = showDescriptions 
    ? CARD_STYLE_CONFIG.heightWithDescription  // 显示描述时的统一高度
    : CARD_STYLE_CONFIG.height; // 基础高度

  const cardStyle: React.CSSProperties = {
    width: CARD_STYLE_CONFIG.width,
    height: cardHeight,
    borderRadius: `${settings.borderRadius}px`,
    padding: CARD_STYLE_CONFIG.padding,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    backdropFilter: 'blur(10px)',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    display: 'flex',
    alignItems: 'center', // 始终居中对齐，通过textContainer的justifyContent来控制文本对齐
    gap: CARD_STYLE_CONFIG.spacing,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    userSelect: 'none',
    transform: isHovered ? `scale(${settings.hoverScale})` : 'scale(1)',
  };

  const titleStyle: React.CSSProperties = {
    color: 'white',
    fontSize: '14px',
    fontWeight: '500',
    lineHeight: '1.2',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    width: '100%',
    minWidth: 0,
  };

  const descriptionStyle: React.CSSProperties = {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: '12px',
    fontWeight: '400',
    lineHeight: '1.3',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    width: '100%',
    minWidth: 0,
  };

  const textContainerStyle: React.CSSProperties = {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center', // 始终居中，通过内容自然排列
    minWidth: 0, // 确保flex子项可以收缩
    gap: showDescriptions && bookmark.description ? '2px' : '0', // 标题和描述之间的间距
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
      
      {/* 书签文本容器 */}
      <div style={textContainerStyle}>
        {/* 书签标题 */}
        <div style={titleStyle} title={bookmark.title}>
          {bookmark.title}
        </div>
        
        {/* 书签描述 - 只在卡片样式且启用显示描述时显示 */}
        {showDescriptions && bookmark.description && (
          <div style={descriptionStyle} title={bookmark.description}>
            {bookmark.description}
          </div>
        )}
      </div>
    </div>
  );
};

export default BookmarkCardStyle;
