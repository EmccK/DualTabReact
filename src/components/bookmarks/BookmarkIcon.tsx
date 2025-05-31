/**
 * 书签图标组件
 * 支持文字、图片、favicon三种类型
 */

import React from 'react';
import type { BookmarkItem } from '@/types/bookmark-style.types';

interface BookmarkIconProps {
  bookmark: BookmarkItem;
  size: number;
  borderRadius: number;
  className?: string;
}

const BookmarkIcon: React.FC<BookmarkIconProps> = ({
  bookmark,
  size,
  borderRadius,
  className = '',
}) => {
  const iconStyle: React.CSSProperties = {
    width: size,
    height: size,
    borderRadius: `${borderRadius}px`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: Math.round(size * 0.4),
    fontWeight: 'bold',
    color: 'white',
    overflow: 'hidden',
    flexShrink: 0,
  };

  // 渲染文字图标
  if (bookmark.iconType === 'text') {
    const backgroundColor = bookmark.iconColor || '#3b82f6';
    const text = bookmark.iconText || bookmark.title.slice(0, 2);
    
    return (
      <div
        className={`${className}`}
        style={{
          ...iconStyle,
          backgroundColor,
        }}
      >
        <span style={{
          lineHeight: 1,
          whiteSpace: 'nowrap',
          fontSize: text.length > 2 ? Math.round(size * 0.3) : Math.round(size * 0.4),
        }}>
          {text}
        </span>
      </div>
    );
  }

  // 渲染图片图标
  if (bookmark.iconType === 'image' && bookmark.iconImage) {
    return (
      <div
        className={`${className}`}
        style={iconStyle}
      >
        <img
          src={bookmark.iconImage}
          alt={bookmark.title}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            borderRadius: `${borderRadius}px`,
          }}
          onError={(e) => {
            // 图片加载失败时显示文字
            const target = e.target as HTMLImageElement;
            const parent = target.parentElement;
            if (parent) {
              parent.innerHTML = bookmark.title.slice(0, 2);
              parent.style.backgroundColor = bookmark.iconColor || '#3b82f6';
            }
          }}
        />
      </div>
    );
  }

  // 渲染favicon图标
  if (bookmark.iconType === 'favicon') {
    const faviconUrl = `https://www.google.com/s2/favicons?domain=${new URL(bookmark.url).hostname}&sz=64`;
    
    return (
      <div
        className={`${className}`}
        style={{
          ...iconStyle,
          backgroundColor: '#f8fafc',
          padding: size * 0.1,
        }}
      >
        <img
          src={faviconUrl}
          alt={bookmark.title}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'contain',
            borderRadius: `${borderRadius * 0.5}px`,
          }}
          onError={(e) => {
            // favicon加载失败时显示文字
            const target = e.target as HTMLImageElement;
            const parent = target.parentElement;
            if (parent) {
              parent.innerHTML = bookmark.title.slice(0, 2);
              parent.style.backgroundColor = bookmark.iconColor || '#3b82f6';
              parent.style.color = 'white';
              parent.style.padding = '0';
            }
          }}
        />
      </div>
    );
  }

  // 默认文字图标
  return (
    <div
      className={`${className}`}
      style={{
        ...iconStyle,
        backgroundColor: bookmark.iconColor || '#3b82f6',
      }}
    >
      {bookmark.title.slice(0, 2)}
    </div>
  );
};

export default BookmarkIcon;
