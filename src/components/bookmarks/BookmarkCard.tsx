import React, { useState, useCallback, useRef } from 'react'
import type { Bookmark, NetworkMode } from '@/types'
import { Globe, Type, Image, ExternalLink } from 'lucide-react'

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
        window.open(url, '_blank', 'noopener,noreferrer')
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

  // 渲染书签图标
  const renderIcon = useCallback(() => {
    const iconSize = 'w-8 h-8'
    const iconStyle = bookmark.iconColor ? { color: bookmark.iconColor } : {}

    switch (bookmark.iconType) {
      case 'text':
        return (
          <div
            className={`${iconSize} rounded-lg flex items-center justify-center text-lg font-bold border-2 border-white/20`}
            style={{
              backgroundColor: bookmark.backgroundColor || '#3b82f6',
              color: bookmark.iconColor || '#ffffff'
            }}
          >
            {bookmark.iconText?.charAt(0)?.toUpperCase() || bookmark.title?.charAt(0)?.toUpperCase() || '?'}
          </div>
        )
      
      case 'upload':
        return bookmark.icon ? (
          <img
            src={bookmark.icon}
            alt={bookmark.title}
            className={`${iconSize} rounded-lg object-cover border-2 border-white/20`}
            onError={(e) => {
              // 图片加载失败时显示默认图标
              const target = e.target as HTMLImageElement
              target.style.display = 'none'
              target.nextElementSibling?.classList.remove('hidden')
            }}
          />
        ) : (
          <div className={`${iconSize} rounded-lg bg-blue-500 flex items-center justify-center border-2 border-white/20`}>
            <Image className="w-4 h-4 text-white" />
          </div>
        )
      
      case 'official':
      default:
        // 尝试获取网站favicon
        const domain = new URL(getActiveUrl() || bookmark.url).hostname
        return (
          <div className="relative">
            <img
              src={`https://www.google.com/s2/favicons?domain=${domain}&sz=32`}
              alt={bookmark.title}
              className={`${iconSize} rounded-lg object-cover border-2 border-white/20`}
              onError={(e) => {
                // favicon加载失败时显示默认图标
                const target = e.target as HTMLImageElement
                target.style.display = 'none'
                target.nextElementSibling?.classList.remove('hidden')
              }}
            />
            <div className={`${iconSize} rounded-lg bg-blue-500 flex items-center justify-center border-2 border-white/20 hidden`}>
              <Globe className="w-4 h-4 text-white" />
            </div>
          </div>
        )
    }
  }, [bookmark, getActiveUrl])

  return (
    <div
      className={`
        group relative cursor-pointer select-none transition-all duration-200
        ${isDragging ? 'opacity-50 scale-95 z-10' : 'opacity-100 scale-100'}
        ${isDragOver ? 'transform scale-105' : ''}
        ${isHovered ? 'transform scale-105' : ''}
      `}
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
          {renderIcon()}
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

        {/* 外部链接指示器 */}
        <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-60 transition-opacity duration-200">
          <ExternalLink className="w-3 h-3 text-white" />
        </div>
      </div>
    </div>
  )
}

export default BookmarkCard