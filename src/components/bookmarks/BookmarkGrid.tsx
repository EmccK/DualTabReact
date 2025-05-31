/**
 * 书签网格布局组件
 * 根据样式类型自动调整网格布局，支持拖拽重排序
 */

import React, { useState, useCallback } from 'react';
import BookmarkCard from './BookmarkCard';
import { BOOKMARK_STYLE_TYPES, CARD_STYLE_CONFIG } from '@/constants/bookmark-style.constants';
import type { BookmarkItem, BookmarkStyleSettings } from '@/types/bookmark-style.types';

interface BookmarkGridProps {
  bookmarks: BookmarkItem[];
  settings: BookmarkStyleSettings;
  showDescriptions?: boolean;
  onBookmarkClick?: (bookmark: BookmarkItem) => void;
  onBookmarkContextMenu?: (bookmark: BookmarkItem, event: React.MouseEvent) => void;
  onBookmarkReorder?: (reorderedBookmarks: BookmarkItem[]) => void;
  className?: string;
}

const BookmarkGrid: React.FC<BookmarkGridProps> = ({
  bookmarks,
  settings,
  showDescriptions = false,
  onBookmarkClick,
  onBookmarkContextMenu,
  onBookmarkReorder,
  className = '',
}) => {
  const [dragState, setDragState] = useState<{
    isDragging: boolean;
    draggedId: string | null;
    dragOverId: string | null;
  }>({
    isDragging: false,
    draggedId: null,
    dragOverId: null,
  });

  // 根据样式类型设置不同的网格样式
  const getGridStyle = (): React.CSSProperties => {
    if (settings.styleType === BOOKMARK_STYLE_TYPES.CARD) {
      // 计算统一的行高：基础高度 + 描述行高度（如果显示描述）
      const rowHeight = showDescriptions 
        ? CARD_STYLE_CONFIG.heightWithDescription 
        : CARD_STYLE_CONFIG.height;
      
      // 卡片样式：单列布局或较宽的双列布局
      return {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gridTemplateRows: `repeat(auto, ${rowHeight}px)`,
        gap: '12px',
        padding: '20px',
      };
    } else {
      // 图标样式：多列布局
      return {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))',
        gap: '20px',
        padding: '20px',
        justifyItems: 'center',
      };
    }
  };

  // 拖拽开始
  const handleDragStart = useCallback((bookmarkId: string, event: React.DragEvent) => {
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', bookmarkId);
    setDragState({
      isDragging: true,
      draggedId: bookmarkId,
      dragOverId: null,
    });
  }, []);

  // 拖拽结束
  const handleDragEnd = useCallback((bookmarkId: string, event: React.DragEvent) => {
    setDragState({
      isDragging: false,
      draggedId: null,
      dragOverId: null,
    });
  }, []);

  // 拖拽经过
  const handleDragOver = useCallback((bookmarkId: string, event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
    
    if (dragState.draggedId && dragState.draggedId !== bookmarkId) {
      setDragState(prev => ({
        ...prev,
        dragOverId: bookmarkId,
      }));
    }
  }, [dragState.draggedId]);

  // 拖拽进入
  const handleDragEnter = useCallback((bookmarkId: string, event: React.DragEvent) => {
    event.preventDefault();
  }, []);

  // 拖拽离开
  const handleDragLeave = useCallback((bookmarkId: string, event: React.DragEvent) => {
    event.preventDefault();
    // 只有真正离开目标元素时才清除dragOver状态
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    const x = event.clientX;
    const y = event.clientY;
    
    if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
      setDragState(prev => ({
        ...prev,
        dragOverId: prev.dragOverId === bookmarkId ? null : prev.dragOverId,
      }));
    }
  }, []);

  // 放置
  const handleDrop = useCallback((targetBookmarkId: string, event: React.DragEvent) => {
    event.preventDefault();
    
    const draggedId = event.dataTransfer.getData('text/plain');
    if (!draggedId || draggedId === targetBookmarkId || !onBookmarkReorder) {
      setDragState({
        isDragging: false,
        draggedId: null,
        dragOverId: null,
      });
      return;
    }

    // 重新排序逻辑
    const newBookmarks = [...bookmarks];
    const draggedIndex = newBookmarks.findIndex(b => b.id === draggedId);
    const targetIndex = newBookmarks.findIndex(b => b.id === targetBookmarkId);

    if (draggedIndex !== -1 && targetIndex !== -1) {
      // 移除拖拽的元素
      const [draggedItem] = newBookmarks.splice(draggedIndex, 1);
      // 插入到目标位置
      newBookmarks.splice(targetIndex, 0, draggedItem);
      
      onBookmarkReorder(newBookmarks);
    }

    setDragState({
      isDragging: false,
      draggedId: null,
      dragOverId: null,
    });
  }, [bookmarks, onBookmarkReorder]);

  if (bookmarks.length === 0) {
    return (
      <div className={`flex items-center justify-center h-48 ${className}`}>
        <div className="text-center text-gray-400">
          <div className="text-lg mb-2">📚</div>
          <div>暂无书签</div>
          <div className="text-sm mt-1">点击右上角添加按钮来添加书签</div>
        </div>
      </div>
    );
  }

  return (
    <div className={className} style={getGridStyle()}>
      {bookmarks.map((bookmark, index) => (
        <div
          key={bookmark.id}
          draggable
          onDragStart={(e) => handleDragStart(bookmark.id, e)}
          onDragEnd={(e) => handleDragEnd(bookmark.id, e)}
          onDragOver={(e) => handleDragOver(bookmark.id, e)}
          onDragEnter={(e) => handleDragEnter(bookmark.id, e)}
          onDragLeave={(e) => handleDragLeave(bookmark.id, e)}
          onDrop={(e) => handleDrop(bookmark.id, e)}
          className="relative"
          style={{
            opacity: dragState.draggedId === bookmark.id ? 0.5 : 1,
            transform: dragState.dragOverId === bookmark.id ? 'scale(1.02)' : 'scale(1)',
            transition: 'transform 0.2s ease, opacity 0.2s ease',
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
  );
};

export default BookmarkGrid;
