/**
 * 详细样式书签卡片组件
 * 显示图标、标题和描述信息
 */

import React, { useCallback } from 'react';
import BookmarkIconV2 from '../BookmarkIconV2';
import { useBookmarkDisplay } from '@/hooks/bookmarks';
import type { Bookmark, NetworkMode } from '@/types';
import type { BookmarkSettings } from '@/types/settings';

interface BookmarkCardDetailedProps {
  bookmark: Bookmark;
  networkMode: NetworkMode;
  bookmarkSettings: BookmarkSettings;
  borderRadius?: number;
  onClick?: (bookmark: Bookmark) => void;
  onContextMenu?: (bookmark: Bookmark, event: React.MouseEvent) => void;
  onDragStart?: (bookmarkId: string, event: React.DragEvent) => void;
  onDragEnd?: (bookmarkId: string, event: React.DragEvent) => void;
  onDragOver?: (bookmarkId: string, event: React.DragEvent) => void;
  onDrop?: (bookmarkId: string, event: React.DragEvent) => void;
  onDragEnter?: (bookmarkId: string, event: React.DragEvent) => void;
  onDragLeave?: (bookmarkId: string, event: React.DragEvent) => void;
  isDragging?: boolean;
  isDragOver?: boolean;
}

const BookmarkCardDetailed: React.FC<BookmarkCardDetailedProps> = ({
  bookmark,
  networkMode,
  bookmarkSettings,
  borderRadius = 8,
  onClick,
  onContextMenu,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDrop,
  onDragEnter,
  onDragLeave,
  isDragging = false,
  isDragOver = false,
}) => {
  const {
    displayConfig,
    cardState,
    getCardStyles,
    setHovered,
    setClicked,
    setDragging,
    setDragOver,
  } = useBookmarkDisplay({
    displayStyle: 'detailed',
    bookmarkSettings,
    borderRadius,
  });

  // 获取当前模式下的URL
  const getActiveUrl = useCallback(() => {
    if (networkMode === 'internal' && bookmark.internalUrl) {
      return bookmark.internalUrl;
    }
    if (networkMode === 'external' && bookmark.externalUrl) {
      return bookmark.externalUrl;
    }
    return bookmark.url;
  }, [bookmark, networkMode]);

  // 事件处理
  const handleClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setClicked(true);
    setTimeout(() => setClicked(false), 200);
    onClick?.(bookmark);
  }, [bookmark, onClick, setClicked]);

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    onContextMenu?.(bookmark, e);
  }, [bookmark, onContextMenu]);

  // 拖拽事件
  const handleDragStart = useCallback((e: React.DragEvent) => {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', bookmark.id);
    setDragging(true);
    onDragStart?.(bookmark.id, e);
  }, [bookmark.id, onDragStart, setDragging]);

  const handleDragEnd = useCallback((e: React.DragEvent) => {
    setDragging(false);
    onDragEnd?.(bookmark.id, e);
  }, [bookmark.id, onDragEnd, setDragging]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    onDragOver?.(bookmark.id, e);
  }, [bookmark.id, onDragOver]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    onDrop?.(bookmark.id, e);
  }, [bookmark.id, onDrop, setDragOver]);

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
    onDragEnter?.(bookmark.id, e);
  }, [bookmark.id, onDragEnter, setDragOver]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    onDragLeave?.(bookmark.id, e);
  }, [bookmark.id, onDragLeave, setDragOver]);

  // 计算样式
  const styles = getCardStyles(
    cardState.isHovered || false,
    cardState.isClicked || false,
    isDragging,
    isDragOver
  );

  return (
    <div
      className="group relative cursor-pointer select-none"
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onClick={handleClick}
      onContextMenu={handleContextMenu}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        opacity: isDragging ? 0.5 : 1,
        zIndex: isDragging ? 10 : 1,
      }}
    >
      {/* 拖拽指示线 */}
      {isDragOver && (
        <div className="absolute -left-1 top-0 bottom-0 w-1 bg-blue-400 rounded-full shadow-lg shadow-blue-400/50 animate-pulse" />
      )}

      {/* 卡片主体 */}
      <div
        className="relative flex flex-col items-center text-center border border-white/20 shadow-lg bg-white/10 backdrop-blur-md"
        style={{
          ...styles.container,
          ...styles.background,
        }}
      >
        {/* 网络模式指示器 */}
        {(bookmark.internalUrl || bookmark.externalUrl) && (
          <div className="absolute top-2 right-2 opacity-60">
            <div
              className={`w-2 h-2 rounded-full ${
                networkMode === 'internal' ? 'bg-yellow-400' : 'bg-green-400'
              }`}
            />
          </div>
        )}

        {/* 书签图标 */}
        {displayConfig.showIcon && (
          <div className="flex justify-center" style={{ marginBottom: styles.icon.marginBottom }}>
            <BookmarkIconV2
              bookmark={bookmark}
              networkMode={networkMode}
              size={displayConfig.cardSize.iconSize}
              borderRadius={borderRadius}
              style={styles.icon}
            />
          </div>
        )}

        {/* 书签标题 */}
        {displayConfig.showTitle && (
          <div
            className="text-white font-medium truncate px-1 w-full"
            style={styles.title}
            title={bookmark.title}
          >
            {bookmark.title}
          </div>
        )}

        {/* 书签描述 */}
        {displayConfig.showDescription && bookmark.description && (
          <div
            className="text-white/70 truncate px-1 w-full mt-1"
            style={styles.description}
            title={bookmark.description}
          >
            {bookmark.description}
          </div>
        )}

        {/* URL悬停提示 */}
        <div className="absolute inset-x-0 top-full mt-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10">
          <div className="text-xs text-white/80 px-2 py-1 rounded max-w-48 truncate mx-auto bg-black/60 backdrop-blur-sm">
            {getActiveUrl()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookmarkCardDetailed;
