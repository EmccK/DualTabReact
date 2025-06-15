/**
 * 优化的书签网格组件V3
 * 解决分类切换闪烁和页面加载闪烁问题
 */

import React, { useMemo, useTransition, useEffect, useState } from 'react';
import OptimizedBookmarkGrid from './OptimizedBookmarkGrid';
import { adaptBookmarkToItem, extractBookmarkStyleSettings } from '@/utils/bookmark-adapter';
import type { Bookmark } from '@/types';
import type { BookmarkSettings } from '@/types/settings';

interface OptimizedBookmarkGridV3Props {
  bookmarks: Bookmark[];
  bookmarkSettings: BookmarkSettings;
  selectedCategoryName?: string | null;
  onBookmarkClick?: (bookmark: Bookmark) => void;
  onBookmarkContextMenu?: (bookmark: Bookmark, event: React.MouseEvent) => void;
  onBookmarkReorder?: (reorderedBookmarks: Bookmark[]) => void;
  className?: string;
}

const OptimizedBookmarkGridV3: React.FC<OptimizedBookmarkGridV3Props> = ({
  bookmarks,
  bookmarkSettings,
  selectedCategoryName,
  onBookmarkClick,
  onBookmarkContextMenu,
  onBookmarkReorder,
  className = '',
}) => {
  const [isPending, startTransition] = useTransition();
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  // 优化：使用useMemo缓存过滤后的书签，避免每次都重新过滤
  const filteredBookmarks = useMemo(() => {
    return bookmarks.filter(bookmark => 
      !selectedCategoryName || bookmark.categoryName === selectedCategoryName
    );
  }, [bookmarks, selectedCategoryName]);

  // 优化：使用useMemo缓存适配后的书签数据
  const adaptedBookmarks = useMemo(() => {
    return filteredBookmarks.map(adaptBookmarkToItem);
  }, [filteredBookmarks]);

  // 优化：使用useMemo缓存样式设置
  const styleSettings = useMemo(() => {
    return extractBookmarkStyleSettings(bookmarkSettings);
  }, [bookmarkSettings]);

  // 初始加载完成后设置标志
  useEffect(() => {
    if (isInitialLoad) {
      // 使用较短的延迟来避免初始闪烁，不管是否有书签都要结束初始加载状态
      const timer = setTimeout(() => {
        setIsInitialLoad(false);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [bookmarks.length, isInitialLoad]);

  // 优化的事件处理函数，使用useCallback避免不必要的重新渲染
  const handleBookmarkClick = React.useCallback((item: ReturnType<typeof adaptBookmarkToItem>) => {
    const originalBookmark = bookmarks.find(b => b.url === item.url);
    if (originalBookmark && onBookmarkClick) {
      onBookmarkClick(originalBookmark);
    }
  }, [bookmarks, onBookmarkClick]);

  const handleBookmarkContextMenu = React.useCallback((
    item: ReturnType<typeof adaptBookmarkToItem>, 
    event: React.MouseEvent
  ) => {
    const originalBookmark = bookmarks.find(b => b.url === item.url);
    if (originalBookmark && onBookmarkContextMenu) {
      onBookmarkContextMenu(originalBookmark, event);
    }
  }, [bookmarks, onBookmarkContextMenu]);

  const handleBookmarkReorder = React.useCallback((
    reorderedItems: ReturnType<typeof adaptBookmarkToItem>[]
  ) => {
    if (!onBookmarkReorder) return;
    
    startTransition(() => {
      // 获取重排序后的当前分类书签，并更新其position
      const reorderedCurrentCategoryBookmarks = reorderedItems.map((item, index) => {
        const originalBookmark = bookmarks.find(b => b.url === item.url);
        return {
          ...originalBookmark!,
          position: index
        };
      }).filter(Boolean);
      
      // 获取其他分类的书签（不在当前分类中的书签）
      const otherCategoryBookmarks = bookmarks.filter(bookmark => 
        selectedCategoryName ? bookmark.categoryName !== selectedCategoryName : false
      );
      
      // 合并所有书签：其他分类书签 + 重排序后的当前分类书签
      const allBookmarks = [
        ...otherCategoryBookmarks,
        ...reorderedCurrentCategoryBookmarks
      ];
      
      onBookmarkReorder(allBookmarks);
    });
  }, [bookmarks, onBookmarkReorder, selectedCategoryName]);

  // 如果是初始加载，显示加载状态而不是空内容
  if (isInitialLoad && bookmarks.length === 0) {
    return (
      <div className={`${className} flex items-center justify-center py-8`}>
        <div className="text-white/50 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white/50 mx-auto mb-2"></div>
          <div className="text-sm">加载书签中...</div>
        </div>
      </div>
    );
  }

  // 如果没有书签且不是初始加载，返回null
  if (adaptedBookmarks.length === 0 && !isInitialLoad) {
    return null;
  }

  return (
    <div 
      className={className}
      style={{
        opacity: isPending ? 0.8 : 1,
        transition: 'opacity 0.2s ease-in-out'
      }}
    >
      <OptimizedBookmarkGrid
        bookmarks={adaptedBookmarks}
        settings={styleSettings}
        showDescriptions={bookmarkSettings.display.showDescriptions}
        onBookmarkClick={handleBookmarkClick}
        onBookmarkContextMenu={handleBookmarkContextMenu}
        onBookmarkReorder={handleBookmarkReorder}
        className="w-full"
      />
    </div>
  );
};

export default OptimizedBookmarkGridV3;
