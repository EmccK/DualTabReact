/**
 * 书签图标组件 - 重定向到新的统一组件
 * 保持向后兼容性
 */

import React from 'react';
import { BookmarkIcon as NewBookmarkIcon } from '@/components/icon';
import type { BookmarkItem } from '@/types/bookmark-style.types';
import type { Bookmark, NetworkMode } from '@/types';

// 兼容旧的接口
interface BookmarkIconProps {
  bookmark: BookmarkItem | Bookmark;
  size: number;
  borderRadius: number;
  className?: string;
  networkMode?: NetworkMode;
  onClick?: () => void;
  onLoad?: () => void;
  onError?: (error: Error) => void;
}

const BookmarkIcon: React.FC<BookmarkIconProps> = ({
  bookmark,
  size,
  borderRadius,
  className = '',
  networkMode = 'external',
  onClick,
  onLoad,
  onError,
}) => {
  // 转换BookmarkItem到Bookmark格式
  const normalizedBookmark: Bookmark = {
    id: bookmark.id,
    name: bookmark.title,
    title: bookmark.title,
    url: bookmark.url,
    description: 'description' in bookmark ? bookmark.description : undefined,
    iconType: bookmark.iconType === 'favicon' ? 'official' : 
              bookmark.iconType === 'image' ? 'upload' : 
              bookmark.iconType,
    iconText: bookmark.iconText,
    iconImage: 'iconImage' in bookmark ? bookmark.iconImage : undefined,
    iconData: 'iconData' in bookmark ? bookmark.iconData : 
              'icon' in bookmark ? bookmark.icon : undefined,
    iconColor: bookmark.iconColor,
    imageScale: 'imageScale' in bookmark ? bookmark.imageScale : undefined,
    backgroundColor: 'backgroundColor' in bookmark ? bookmark.backgroundColor : undefined,
    internalUrl: 'internalUrl' in bookmark ? bookmark.internalUrl : undefined,
    externalUrl: 'externalUrl' in bookmark ? bookmark.externalUrl : undefined,
    categoryId: 'categoryId' in bookmark ? bookmark.categoryId : undefined,
    position: 'position' in bookmark ? bookmark.position : undefined,
    createdAt: 'createdAt' in bookmark ? bookmark.createdAt : Date.now(),
    updatedAt: 'updatedAt' in bookmark ? bookmark.updatedAt : Date.now(),
  };

  return (
    <NewBookmarkIcon
      bookmark={normalizedBookmark}
      networkMode={networkMode}
      size={size}
      borderRadius={borderRadius}
      className={className}
      onClick={onClick}
      onLoad={onLoad}
      onError={onError}
    />
  );
};

export default BookmarkIcon;
