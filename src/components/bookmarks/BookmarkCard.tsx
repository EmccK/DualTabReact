import React, { useState, useCallback } from 'react'
import type { Bookmark, NetworkMode } from '@/types'
import type { BookmarkSettings } from '@/types/settings'
import { safeOpenUrl } from '@/utils/url-utils'
import BookmarkIcon from './BookmarkIcon'

interface BookmarkCardProps {
  bookmark: Bookmark
  networkMode: NetworkMode
  bookmarkSettings: BookmarkSettings
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
  bookmarkSettings,
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
  const [isClicked, setIsClicked] = useState(false)
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
  const handleClick = useCallback(async (e: React.MouseEvent) => {
    e.preventDefault()
    
    // 点击动画效果 - 始终启用
    setIsClicked(true)
    setTimeout(() => setIsClicked(false), 200)
    
    if (onClick) {
      onClick(bookmark)
    } else {
      const url = getActiveUrl()
      if (url) {
        if (bookmarkSettings.behavior.openIn === 'new') {
          window.open(url, '_blank')
        } else {
          safeOpenUrl(url)
        }
      }
    }
  }, [bookmark, onClick, getActiveUrl, bookmarkSettings.behavior])

  // 处理右键菜单
  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    onContextMenu?.(bookmark, e)
  }, [bookmark, onContextMenu])

  // 拖拽事件处理 - 拖拽始终启用
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

  // 计算变换样式 - 悬停效果始终启用
  const getTransformStyle = () => {
    let scale = 1
    if (isClicked) { // 点击动画始终启用
      scale = 0.95
    } else if (isDragOver) {
      scale = 1.08
    } else if (isHovered) { // 悬停效果始终启用
      scale = bookmarkSettings.behavior.hoverScale
    }
    
    if (isDragging) {
      scale = 0.95
    }
    
    return {
      transform: `scale(${scale})`,
      transition: 'transform 0.2s ease, box-shadow 0.2s ease' // 始终启用过渡动画
    }
  }

  // 计算卡片样式
  const cardStyle = {
    padding: `${bookmarkSettings.display.cardPadding}px`,
    aspectRatio: bookmarkSettings.grid.aspectRatio,
    minWidth: `${bookmarkSettings.grid.minCardWidth}px`,
    maxWidth: `${bookmarkSettings.grid.maxCardWidth}px`,
    backgroundColor: bookmark.backgroundColor 
      ? `${bookmark.backgroundColor}20` 
      : undefined,
    ...getTransformStyle(),
  }

  // 计算图标样式
  const iconStyle = {
    width: `${bookmarkSettings.display.iconSize}px`,
    height: `${bookmarkSettings.display.iconSize}px`,
  }

  return (
    <div
      className={`
        group relative cursor-pointer select-none
        ${isDragging ? 'opacity-50 z-10' : 'opacity-100'}
      `}
      data-context-target="bookmark"
      draggable={true} // 拖拽始终启用
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
      {isDragOver && ( // 拖拽始终启用，移除条件判断
        <div className="absolute -left-1 top-0 bottom-0 w-1 bg-blue-400 rounded-full shadow-lg shadow-blue-400/50 animate-pulse" />
      )}
      
      {/* 书签卡片主体 */}
      <div
        className="relative rounded-xl text-center border border-white/20 shadow-lg bg-white/10 backdrop-blur-md"
        style={cardStyle}
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
        {bookmarkSettings.display.showFavicons && (
          <div className="flex justify-center mb-3">
            <BookmarkIcon 
              bookmark={bookmark} 
              networkMode={networkMode}
              size={bookmarkSettings.display.iconSize}
              style={iconStyle}
            />
          </div>
        )}

        {/* 书签标题 */}
        {bookmarkSettings.display.showTitle && (
          <div className="text-white text-sm font-medium truncate px-1">
            {bookmark.title}
          </div>
        )}

        {/* 书签描述 */}
        {bookmarkSettings.display.showDescriptions && bookmark.description && (
          <div className="text-white/70 text-xs mt-1 truncate px-1">
            {bookmark.description}
          </div>
        )}

        {/* URL显示（hover时显示） - 悬停效果始终启用 */}
        <div className="absolute inset-x-0 top-full mt-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10">
          <div className="text-xs text-white/80 px-2 py-1 rounded max-w-48 truncate mx-auto bg-black/60 backdrop-blur-sm">
            {getActiveUrl()}
          </div>
        </div>
      </div>
    </div>
  )
}

export default BookmarkCard
