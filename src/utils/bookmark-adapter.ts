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
  if (bookmark.iconType === 'text' || bookmark.iconText) {
    iconType = 'text';
  } else if (bookmark.iconType === 'upload' && bookmark.iconData) {
    iconType = 'image';
  } else if (bookmark.iconType === 'image' && bookmark.iconImage) {
    iconType = 'image';
  } else if (bookmark.iconType === 'favicon' || bookmark.iconType === 'official' || bookmark.icon) {
    iconType = 'favicon';
  }

  return {
    id: bookmark.id,
    title: bookmark.title,
    url: bookmark.url,
    iconType,
    iconText: bookmark.iconText || bookmark.title.slice(0, 2),
    iconImage: bookmark.iconImage || bookmark.iconData || bookmark.icon,
    iconColor: bookmark.iconColor || '#3b82f6',
  };
};

// 将新的BookmarkItem转换为旧的Bookmark（用于保存）
export const adaptItemToBookmark = (item: BookmarkItem, originalBookmark?: Bookmark): Bookmark => {
  const now = Date.now();
  
  return {
    id: item.id,
    name: item.title,
    title: item.title,
    url: item.url,
    categoryId: originalBookmark?.categoryId,
    internalUrl: originalBookmark?.internalUrl,
    externalUrl: originalBookmark?.externalUrl,
    description: originalBookmark?.description,
    iconType: item.iconType === 'image' ? 'upload' : item.iconType === 'favicon' ? 'official' : 'text',
    iconText: item.iconText,
    iconImage: item.iconImage,
    iconData: item.iconType === 'image' ? item.iconImage : undefined,
    icon: item.iconType === 'favicon' ? item.iconImage : undefined,
    iconColor: item.iconColor,
    backgroundColor: originalBookmark?.backgroundColor,
    position: originalBookmark?.position,
    createdAt: originalBookmark?.createdAt || now,
    updatedAt: now,
  };
};

// 从设置中提取BookmarkStyleSettings
export const extractBookmarkStyleSettings = (settings: any): BookmarkStyleSettings => {
  return {
    styleType: settings.bookmarks?.display?.styleType || 'card',
    borderRadius: settings.bookmarks?.display?.borderRadius ?? 12,
    hoverScale: settings.bookmarks?.behavior?.hoverScale ?? 1.05,
  };
};
