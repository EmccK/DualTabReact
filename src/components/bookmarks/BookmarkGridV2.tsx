/**
 * 书签网格V2组件
 * 支持新的显示样式和增强功能
 */

import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import BookmarkCardV2 from './BookmarkCardV2';
import { useBookmarkDisplay } from '@/hooks/bookmarks';
import { calculateGridLayout, generateGridStyles } from '@/utils/style-calculator.utils';
import { filterAndSortBookmarks } from '@/utils/bookmark-display.utils';
import { BOOKMARK_DISPLAY_STYLES } from '@/constants';
import type { Bookmark, NetworkMode } from '@/types';
import type { BookmarkSettings } from '@/types/settings';
import type { BookmarkDisplayStyle } from '@/types/bookmark-display.types';

interface BookmarkGridV2Props {
  bookmarks: Bookmark[];
  networkMode: NetworkMode;
  bookmarkSettings: BookmarkSettings;
  displayStyle?: BookmarkDisplayStyle;
  borderRadius?: number;
  categoryId?: string;
  searchQuery?: string;
  onBookmarkClick?: (bookmark: Bookmark) => void;
  onBookmarkContextMenu?: (bookmark: Bookmark, event: React.MouseEvent) => void;
  onBookmarkDragStart?: (bookmarkId: string, event: React.DragEvent) => void;
  onBookmarkDragEnd?: (bookmarkId: string, event: React.DragEvent) => void;
  onBookmarkDrop?: (sourceId: string, targetId: string) => void;
  onBookmarkReorder?: (bookmarks: Bookmark[]) => void;
  className?: string;
}

const BookmarkGridV2: React.FC<BookmarkGridV2Props> = ({
  bookmarks,
  networkMode,
  bookmarkSettings,
  displayStyle = BOOKMARK_DISPLAY_STYLES.DETAILED,
  borderRadius = 8,
  categoryId,
  searchQuery,
  onBookmarkClick,
  onBookmarkContextMenu,
  onBookmarkDragStart,
  onBookmarkDragEnd,
  onBookmarkDrop,
  onBookmarkReorder,
  className = '',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const [dragState, setDragState] = useState<{
    draggedId: string | null;
    dragOverId: string | null;
  }>({
    draggedId: null,
    dragOverId: null,
  });

  // 监听容器尺寸变化
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        setContainerSize({ width, height });
      }
    });

    resizeObserver.observe(container);

    // 初始尺寸
    const { width, height } = container.getBoundingClientRect();
    setContainerSize({ width, height });

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  // 过滤和排序书签
  const filteredBookmarks = useMemo(() => {
    return filterAndSortBookmarks(bookmarks, {
      search: searchQuery,
      categoryId,
    });
  }, [bookmarks, searchQuery, categoryId]);

  // 计算网格布局
  const gridConfig = useMemo(() => {
    if (containerSize.width === 0) return null;
    
    return calculateGridLayout(
      containerSize.width,
      displayStyle,
      bookmarkSettings
    );
  }, [containerSize.width, displayStyle, bookmarkSettings]);

  // 生成网格样式
  const gridStyles = useMemo(() => {
    if (!gridConfig) return {};
    return generateGridStyles(gridConfig);
  }, [gridConfig]);

  // 拖拽事件处理
  const handleDragStart = useCallback((bookmarkId: string, event: React.DragEvent) => {
    setDragState(prev => ({ ...prev, draggedId: bookmarkId }));
    onBookmarkDragStart?.(bookmarkId, event);
  }, [onBookmarkDragStart]);

  const handleDragEnd = useCallback((bookmarkId: string, event: React.DragEvent) => {
    setDragState({ draggedId: null, dragOverId: null });
    onBookmarkDragEnd?.(bookmarkId, event);
  }, [onBookmarkDragEnd]);

  const handleDragOver = useCallback((bookmarkId: string, event: React.DragEvent) => {
    event.preventDefault();
    setDragState(prev => ({ ...prev, dragOverId: bookmarkId }));
  }, []);

  const handleDragLeave = useCallback((bookmarkId: string, event: React.DragEvent) => {
    // 只有当离开的是当前dragOver的元素时才清除
    if (dragState.dragOverId === bookmarkId) {
      setDragState(prev => ({ ...prev, dragOverId: null }));
    }
  }, [dragState.dragOverId]);

  const handleDrop = useCallback((targetId: string, event: React.DragEvent) => {
    event.preventDefault();
    
    const sourceId = dragState.draggedId;
    if (sourceId && sourceId !== targetId) {
      onBookmarkDrop?.(sourceId, targetId);
      
      // 重新排序书签
      if (onBookmarkReorder) {
        const sourceIndex = filteredBookmarks.findIndex(b => b.id === sourceId);
        const targetIndex = filteredBookmarks.findIndex(b => b.id === targetId);
        
        if (sourceIndex !== -1 && targetIndex !== -1) {
          const newBookmarks = [...filteredBookmarks];
          const [removed] = newBookmarks.splice(sourceIndex, 1);
          newBookmarks.splice(targetIndex, 0, removed);
          onBookmarkReorder(newBookmarks);
        }
      }
    }
    
    setDragState({ draggedId: null, dragOverId: null });
  }, [dragState.draggedId, filteredBookmarks, onBookmarkDrop, onBookmarkReorder]);

  // 如果没有书签
  if (filteredBookmarks.length === 0) {
    return (
      <div className={`flex flex-col items-center justify-center py-12 ${className}`}>
        <div className="text-gray-400 text-center">
          <div className="text-4xl mb-4">📚</div>
          <div className="text-lg font-medium mb-2">暂无书签</div>
          <div className="text-sm">
            {searchQuery ? '没有找到匹配的书签' : '点击添加你的第一个书签'}
          </div>
        </div>
      </div>
    );
  }

  // 如果容器尺寸还未测量完成
  if (!gridConfig) {
    return (
      <div ref={containerRef} className={`w-full h-full ${className}`}>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`bookmark-grid-v2 w-full ${className}`}
      style={gridStyles}
    >
      {filteredBookmarks.map((bookmark) => (
        <BookmarkCardV2
          key={bookmark.id}
          bookmark={bookmark}
          networkMode={networkMode}
          bookmarkSettings={bookmarkSettings}
          displayStyle={displayStyle}
          borderRadius={borderRadius}
          isDragging={dragState.draggedId === bookmark.id}
          isDragOver={dragState.dragOverId === bookmark.id}
          onClick={onBookmarkClick}
          onContextMenu={onBookmarkContextMenu}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        />
      ))}
    </div>
  );
};

export default BookmarkGridV2;
