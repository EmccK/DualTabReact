/**
 * 书签类型适配器
 * 将旧的Bookmark类型转换为新的BookmarkItem类型
 */

import type { Bookmark } from '@/types';
import type { BookmarkItem, BookmarkStyleSettings } from '@/types/bookmark-style.types';

// 将旧的Bookmark转换为新的BookmarkItem
export const adaptBookmarkToItem = (bookmark: Bookmark): BookmarkItem => {
  // 确定图标类型
  let iconType: BookmarkItem['iconType'] = 'text';
  if (bookmark.iconType === 'favicon' || bookmark.iconType === 'official') {
    iconType = 'favicon';
  } else if (bookmark.iconType === 'upload' || bookmark.iconType === 'image') {
    iconType = 'image';
  } else {
    iconType = 'text';
  }

  return {
    url: bookmark.url, // 使用URL作为唯一标识
    title: bookmark.title,
    description: bookmark.description,
    iconType,
    iconText: bookmark.iconText || bookmark.title.slice(0, 2),
    iconImage: bookmark.iconImage || bookmark.iconData || bookmark.icon,
    iconColor: bookmark.iconColor || '#3b82f6',
    imageScale: bookmark.imageScale,
    originalIconImage: bookmark.originalIconImage,
  };
};

// 将新的BookmarkItem转换为旧的Bookmark（用于保存）
export const adaptItemToBookmark = (item: BookmarkItem, originalBookmark?: Bookmark): Bookmark => {
  const now = Date.now();
  
  return {
    name: item.title,
    title: item.title,
    url: item.url,
    categoryName: originalBookmark?.categoryName,
    internalUrl: originalBookmark?.internalUrl,
    externalUrl: originalBookmark?.externalUrl,
    description: item.description || originalBookmark?.description,
    iconType: item.iconType === 'image' ? 'upload' : item.iconType === 'favicon' ? 'favicon' : 'text',
    iconText: item.iconText,
    iconImage: item.iconImage,
    iconData: item.iconType === 'image' ? item.iconImage : undefined,
    icon: item.iconType === 'favicon' ? item.iconImage : undefined,
    iconColor: item.iconColor,
    imageScale: item.imageScale,
    originalIconImage: item.originalIconImage,
    backgroundColor: originalBookmark?.backgroundColor,
    position: originalBookmark?.position,
    createdAt: originalBookmark?.createdAt || now,
    updatedAt: now,
  };
};

// 从设置中提取BookmarkStyleSettings
export const extractBookmarkStyleSettings = (bookmarkSettings: any): BookmarkStyleSettings => {
  return {
    styleType: bookmarkSettings?.display?.styleType || 'card',
    borderRadius: bookmarkSettings?.display?.borderRadius ?? 12,
    hoverScale: bookmarkSettings?.behavior?.hoverScale ?? 1.05,
  };
};
