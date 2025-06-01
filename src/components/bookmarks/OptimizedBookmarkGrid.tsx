/**
 * 优化的书签网格组件
 * 解决分类切换和页面加载时的闪烁问题
 */

import React, { useState, useCallback, useMemo, useTransition } from 'react';
import BookmarkCard from './BookmarkCard';
import { BOOKMARK_STYLE_TYPES, CARD_STYLE_CONFIG } from '@/constants/bookmark-style.constants';
import type { BookmarkItem, BookmarkStyleSettings } from '@/types/bookmark-style.types';
import './BookmarkGrid.css';

interface BookmarkGridProps {
  bookmarks: BookmarkItem[];
  settings: BookmarkStyleSettings;
  showDescriptions?: boolean;
  onBookmarkClick?: (bookmark: BookmarkItem) => void;
  onBookmarkContextMenu?: (bookmark: BookmarkItem, event: React.MouseEvent) => void;
  onBookmarkReorder?: (reorderedBookmarks: BookmarkItem[]) => void;
  className?: string;
}

const OptimizedBookmarkGrid: React.FC<BookmarkGridProps> = ({
  bookmarks,
  settings,
  showDescriptions = false,
  onBookmarkClick,
  onBookmarkContextMenu,
  onBookmarkReorder,
  className = '',
}) => {
  const [isPending, startTransition] = useTransition();
  const [dragState, setDragState] = useState<{
    isDragging: boolean;
    draggedId: string | null;
    dragOverId: string | null;
  }>({
    isDragging: false,
    draggedId: null,
    dragOverId: null,
  });

  // 优化：使用useMemo缓存网格配置，避免每次渲染都重新计算
  const gridConfig = useMemo(() => {
    if (settings.styleType === BOOKMARK_STYLE_TYPES.CARD) {
      const rowHeight = showDescriptions 
        ? CARD_STYLE_CONFIG.heightWithDescription 
        : CARD_STYLE_CONFIG.height;
      
      return {
        className: 'bookmark-grid-card',
        style: {
          gridAutoRows: `${rowHeight}px`,
        }
      };
    } else {
      return {
        className: 'bookmark-grid-icon',
        style: {}
      };
    }
  }, [settings.styleType, showDescriptions]);

  // 优化：使用useMemo缓存书签列表，避免不必要的重新渲染
  const memoizedBookmarks = useMemo(() => {
    return bookmarks.map((bookmark, index) => ({
      ...bookmark,
      index // 添加索引用于优化渲染
    }));
  }, [bookmarks]);

  // 拖拽处理函数保持不变，但使用startTransition优化状态更新
  const handleDragStart = useCallback((bookmarkId: string, event: React.DragEvent) => {
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', bookmarkId);
    
    startTransition(() => {
      setDragState({
        isDragging: true,
        draggedId: bookmarkId,
        dragOverId: null,
      });
    });
  }, []);

  const handleDragEnd = useCallback((bookmarkId: string, event: React.DragEvent) => {
    startTransition(() => {
      setDragState({
        isDragging: false,
        draggedId: null,
        dragOverId: null,
      });
    });
  }, []);

  const handleDragOver = useCallback((bookmarkId: string, event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
    
    if (dragState.draggedId && dragState.draggedId !== bookmarkId) {
      startTransition(() => {
        setDragState(prev => ({
          ...prev,
          dragOverId: bookmarkId,
        }));
      });
    }
  }, [dragState.draggedId]);

  const handleDragEnter = useCallback((bookmarkId: string, event: React.DragEvent) => {
    event.preventDefault();
  }, []);

  const handleDragLeave = useCallback((bookmarkId: string, event: React.DragEvent) => {
    event.preventDefault();
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    const x = event.clientX;
    const y = event.clientY;
    
    if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
      startTransition(() => {
        setDragState(prev => ({
          ...prev,
          dragOverId: prev.dragOverId === bookmarkId ? null : prev.dragOverId,
        }));
      });
    }
  }, []);

  const handleDrop = useCallback((targetBookmarkId: string, event: React.DragEvent) => {
    event.preventDefault();
    
    const draggedId = event.dataTransfer.getData('text/plain');
    if (!draggedId || draggedId === targetBookmarkId || !onBookmarkReorder) {
      startTransition(() => {
        setDragState({
          isDragging: false,
          draggedId: null,
          dragOverId: null,
        });
      });
      return;
    }

    // 重新排序逻辑
    const newBookmarks = [...bookmarks];
    const draggedIndex = newBookmarks.findIndex(b => b.id === draggedId);
    const targetIndex = newBookmarks.findIndex(b => b.id === targetBookmarkId);

    if (draggedIndex !== -1 && targetIndex !== -1) {
      const [draggedItem] = newBookmarks.splice(draggedIndex, 1);
      newBookmarks.splice(targetIndex, 0, draggedItem);
      
      onBookmarkReorder(newBookmarks);
    }

    startTransition(() => {
      setDragState({
        isDragging: false,
        draggedId: null,
        dragOverId: null,
      });
    });
  }, [bookmarks, onBookmarkReorder]);

  // 如果没有书签，返回null而不是空div，减少DOM节点
  if (memoizedBookmarks.length === 0) {
    return null;
  }

  return (
    <div className={`bookmark-grid-container ${className}`}>
      {/* 添加加载状态指示器，但使用opacity而不是display */}
      <div 
        className={gridConfig.className}
        style={{
          ...gridConfig.style,
          opacity: isPending ? 0.7 : 1,
          transition: 'opacity 0.15s ease-in-out'
        }}
      >
        {memoizedBookmarks.map((bookmark) => (
          <div
            key={bookmark.id}
            draggable
            onDragStart={(e) => handleDragStart(bookmark.id, e)}
            onDragEnd={(e) => handleDragEnd(bookmark.id, e)}
            onDragOver={(e) => handleDragOver(bookmark.id, e)}
            onDragEnter={(e) => handleDragEnter(bookmark.id, e)}
            onDragLeave={(e) => handleDragLeave(bookmark.id, e)}
            onDrop={(e) => handleDrop(bookmark.id, e)}
            className="relative bookmark-grid-item"
            style={{
              opacity: dragState.draggedId === bookmark.id ? 0.5 : 1,
              transform: dragState.dragOverId === bookmark.id ? 'scale(1.02)' : 'scale(1)',
              transition: isPending ? 'none' : 'transform 0.2s ease, opacity 0.2s ease',
              cursor: dragState.isDragging ? 'grabbing' : 'grab',
            }}
          >
            {/* 拖拽指示线 */}
            {dragState.dragOverId === bookmark.id && dragState.draggedId !== bookmark.id && (
              <div className="absolute -left-1 top-0 bottom-0 w-1 bg-blue-500 rounded-full shadow-lg shadow-blue-500/50 animate-pulse z-10" />
            )}
            
            <BookmarkCard
              bookmark={bookmark}
              settings={settings}
              showDescriptions={showDescriptions}
              onClick={onBookmarkClick}
              onContextMenu={onBookmarkContextMenu}
              className={dragState.draggedId === bookmark.id ? 'pointer-events-none' : ''}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default OptimizedBookmarkGrid;
