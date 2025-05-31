/**
 * 书签网格组件V3
 * 使用新的书签样式系统，支持拖拽重排序
 */

import React, { useMemo } from 'react';
import { BookmarkGrid } from '@/components/bookmarks';
import { adaptBookmarkToItem, extractBookmarkStyleSettings } from '@/utils/bookmark-adapter';
import type { Bookmark, NetworkMode } from '@/types';
import type { BookmarkSettings } from '@/types/settings';

interface BookmarkGridV3Props {
  bookmarks: Bookmark[];
  networkMode: NetworkMode;
  bookmarkSettings: BookmarkSettings;
  onBookmarkClick?: (bookmark: Bookmark) => void;
  onBookmarkContextMenu?: (bookmark: Bookmark, event: React.MouseEvent) => void;
  onBookmarkReorder?: (reorderedBookmarks: Bookmark[]) => void;
  className?: string;
}

const BookmarkGridV3: React.FC<BookmarkGridV3Props> = ({
  bookmarks,
  networkMode,
  bookmarkSettings,
  onBookmarkClick,
  onBookmarkContextMenu,
  onBookmarkReorder,
  className = '',
}) => {
  // 将旧的书签数据转换为新格式
  const adaptedBookmarks = useMemo(() => {
    return bookmarks.map(adaptBookmarkToItem);
  }, [bookmarks]);

  // 提取样式设置
  const styleSettings = useMemo(() => {
    return extractBookmarkStyleSettings({ bookmarks: bookmarkSettings });
  }, [bookmarkSettings]);

  // 处理书签点击 - 将新格式转换回旧格式
  const handleBookmarkClick = (item: ReturnType<typeof adaptBookmarkToItem>) => {
    const originalBookmark = bookmarks.find(b => b.id === item.id);
    if (originalBookmark && onBookmarkClick) {
      onBookmarkClick(originalBookmark);
    }
  };

  // 处理书签右键菜单
  const handleBookmarkContextMenu = (item: ReturnType<typeof adaptBookmarkToItem>, event: React.MouseEvent) => {
    const originalBookmark = bookmarks.find(b => b.id === item.id);
    if (originalBookmark && onBookmarkContextMenu) {
      onBookmarkContextMenu(originalBookmark, event);
    }
  };

  // 处理书签重排序
  const handleBookmarkReorder = (reorderedItems: ReturnType<typeof adaptBookmarkToItem>[]) => {
    if (!onBookmarkReorder) return;
    
    // 将重排序后的items转换回原始书签格式
    const reorderedBookmarks = reorderedItems.map(item => {
      const originalBookmark = bookmarks.find(b => b.id === item.id);
      return originalBookmark!;
    }).filter(Boolean);
    
    onBookmarkReorder(reorderedBookmarks);
  };

  return (
    <BookmarkGrid
      bookmarks={adaptedBookmarks}
      settings={styleSettings}
      onBookmarkClick={handleBookmarkClick}
      onBookmarkContextMenu={handleBookmarkContextMenu}
      onBookmarkReorder={handleBookmarkReorder}
      className={className}
    />
  );
};

export default BookmarkGridV3;
