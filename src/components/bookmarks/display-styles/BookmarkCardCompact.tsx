/**
 * 紧凑样式书签卡片组件
 * 只显示图标和底部标题
 */

import React, { useCallback } from 'react';
import BookmarkIconV2 from '../BookmarkIconV2';
import { useBookmarkDisplay } from '@/hooks/bookmarks';
import type { Bookmark, NetworkMode } from '@/types';
import type { BookmarkSettings } from '@/types/settings';

interface BookmarkCardCompactProps {
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

const BookmarkCardCompact: React.FC<BookmarkCardCompactProps> = ({
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
    displayStyle: 'compact',
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
          <div className="absolute top-1 right-1 opacity-60">
            <div
              className={`w-1.5 h-1.5 rounded-full ${
                networkMode === 'internal' ? 'bg-yellow-400' : 'bg-green-400'
              }`}
            />
          </div>
        )}

        {/* 主要内容区域 - 上部分图标，下部分标题 */}
        <div className="flex-1 flex flex-col justify-between items-center w-full">
          {/* 图标区域 */}
          {displayConfig.showIcon && (
            <div className="flex-1 flex items-center justify-center">
              <BookmarkIconV2
                bookmark={bookmark}
                networkMode={networkMode}
                size={displayConfig.cardSize.iconSize}
                borderRadius={borderRadius}
                style={styles.icon}
              />
            </div>
          )}

          {/* 标题区域 - 固定在底部 */}
          {displayConfig.showTitle && (
            <div className="w-full mt-auto">
              <div
                className="text-white font-medium truncate px-1 w-full text-center"
                style={styles.title}
                title={bookmark.title}
              >
                {bookmark.title}
              </div>
            </div>
          )}
        </div>

        {/* URL悬停提示 */}
        <div className="absolute inset-x-0 top-full mt-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10">
          <div className="text-xs text-white/80 px-2 py-1 rounded max-w-32 truncate mx-auto bg-black/60 backdrop-blur-sm">
            {getActiveUrl()}
          </div>
        </div>

        {/* 描述信息悬停提示 */}
        {bookmark.description && (
          <div className="absolute inset-x-0 top-full mt-8 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10">
            <div className="text-xs text-white/70 px-2 py-1 rounded max-w-32 truncate mx-auto bg-black/50 backdrop-blur-sm">
              {bookmark.description}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BookmarkCardCompact;
