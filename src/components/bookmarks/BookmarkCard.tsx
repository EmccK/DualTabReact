import React, { useState, useCallback } from 'react'
import type { Bookmark, NetworkMode } from '@/types'
import { safeOpenUrl } from '@/utils/url-utils'
import BookmarkIcon from './BookmarkIcon'

interface BookmarkCardProps {
  bookmark: Bookmark
  networkMode: NetworkMode
  isGlassEffect: boolean
  isDragging?: boolean
  isDragOver?: boolean
  onDragStart?: (bookmarkId: string, event: React.DragEvent) => void
  onDragEnd?: (bookmarkId: string, event: React.DragEvent) => void
  onDragOver?: (bookmarkId: string, event: React.DragEvent) => void
  onDrop?: (bookmarkId: string, event: React.DragEvent) => void
  onDragEnter?: (bookmarkId: string, event: React.DragEvent) => void
  onDragLeave?: (bookmarkId: string, event: React.DragEvent) => void
  onClick?: (bookmark: Bookmark) => void
  onContextMenu?: (bookmark: Bookmark, event: React.MouseEvent) => void
}

const BookmarkCard: React.FC<BookmarkCardProps> = ({
  bookmark,
  networkMode,
  isGlassEffect,
  isDragging = false,
  isDragOver = false,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDrop,
  onDragEnter,
  onDragLeave,
  onClick,
  onContextMenu,
}) => {
  const [isHovered, setIsHovered] = useState(false)
  const [dragCounter, setDragCounter] = useState(0)
  
  // 获取当前模式下的URL
  const getActiveUrl = useCallback(() => {
    if (networkMode === 'internal' && bookmark.internalUrl) {
      return bookmark.internalUrl
    }
    if (networkMode === 'external' && bookmark.externalUrl) {
      return bookmark.externalUrl
    }
    return bookmark.url
  }, [bookmark, networkMode])

  // 处理书签点击
  const handleClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    if (onClick) {
      onClick(bookmark)
    } else {
      const url = getActiveUrl()
      if (url) {
        safeOpenUrl(url)
      }
    }
  }, [bookmark, onClick, getActiveUrl])

  // 处理右键菜单
  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    onContextMenu?.(bookmark, e)
  }, [bookmark, onContextMenu])

  // 拖拽事件处理
  const handleDragStart = useCallback((e: React.DragEvent) => {
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', bookmark.id)
    onDragStart?.(bookmark.id, e)
  }, [bookmark.id, onDragStart])

  const handleDragEnd = useCallback((e: React.DragEvent) => {
    onDragEnd?.(bookmark.id, e)
  }, [bookmark.id, onDragEnd])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    onDragOver?.(bookmark.id, e)
  }, [bookmark.id, onDragOver])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragCounter(0)
    onDrop?.(bookmark.id, e)
  }, [bookmark.id, onDrop])

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragCounter(prev => prev + 1)
    onDragEnter?.(bookmark.id, e)
  }, [bookmark.id, onDragEnter])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragCounter(prev => {
      const newCount = prev - 1
      if (newCount <= 0) {
        onDragLeave?.(bookmark.id, e)
        return 0
      }
      return newCount
    })
  }, [bookmark.id, onDragLeave])

  return (
    <div
      className={`
        group relative cursor-pointer select-none transition-all duration-200
        ${isDragging ? 'opacity-50 scale-95 z-10' : 'opacity-100 scale-100'}
        ${isDragOver ? 'transform scale-105' : ''}
        ${isHovered ? 'transform scale-105' : ''}
      `}
      data-context-target="bookmark"
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onClick={handleClick}
      onContextMenu={handleContextMenu}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* 拖拽时的插入指示线 */}
      {isDragOver && (
        <div className="absolute -left-1 top-0 bottom-0 w-1 bg-blue-400 rounded-full shadow-lg shadow-blue-400/50 animate-pulse" />
      )}
      
      {/* 书签卡片主体 */}
      <div
        className={`
          relative p-4 rounded-xl text-center transition-all duration-200
          border border-white/20 shadow-lg
          ${isGlassEffect ? 'bg-white/10 backdrop-blur-md' : 'bg-black/30'}
          ${isHovered ? 'bg-white/20 border-white/40 shadow-xl' : ''}
          ${isDragOver ? 'bg-blue-500/20 border-blue-400/60' : ''}
        `}
        style={{
          backgroundColor: bookmark.backgroundColor && !isGlassEffect 
            ? `${bookmark.backgroundColor}20` 
            : undefined
        }}
      >
        {/* 网络模式指示器 */}
        {(bookmark.internalUrl || bookmark.externalUrl) && (
          <div className="absolute top-2 right-2 opacity-60">
            <div className={`w-2 h-2 rounded-full ${
              networkMode === 'internal' ? 'bg-yellow-400' : 'bg-green-400'
            }`} />
          </div>
        )}

        {/* 书签图标 */}
        <div className="flex justify-center mb-3">
          <BookmarkIcon 
            bookmark={bookmark} 
            networkMode={networkMode}
            size={32}
            className="w-8 h-8"
          />
        </div>

        {/* 书签标题 */}
        <div className="text-white text-sm font-medium truncate px-1">
          {bookmark.title}
        </div>

        {/* URL显示（hover时显示） */}
        <div className="absolute inset-x-0 top-full mt-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
          <div className={`
            text-xs text-white/80 px-2 py-1 rounded max-w-48 truncate mx-auto
            ${isGlassEffect ? 'bg-black/60 backdrop-blur-sm' : 'bg-black/80'}
          `}>
            {getActiveUrl()}
          </div>
        </div>
      </div>
    </div>
  )
}

export default BookmarkCard
