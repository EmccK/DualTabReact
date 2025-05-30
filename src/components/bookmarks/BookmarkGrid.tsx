import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react'
import type { Bookmark, NetworkMode, BookmarkCategory } from '@/types'
import type { BookmarkSettings } from '@/types/settings'
import BookmarkCard from './BookmarkCard'
import { Plus } from 'lucide-react'
import { useBookmarkCategories, useBookmarkStyles } from '@/hooks'

interface BookmarkGridProps {
  bookmarks: Bookmark[]
  categories: BookmarkCategory[]
  networkMode: NetworkMode
  bookmarkSettings: BookmarkSettings
  loading?: boolean
  error?: string | null
  selectedCategoryId?: string | null
  onBookmarkClick?: (bookmark: Bookmark) => void
  onBookmarkContextMenu?: (bookmark: Bookmark, event: React.MouseEvent) => void
  onAddBookmarkClick?: () => void
  onBookmarksReorder?: (bookmarks: Bookmark[]) => Promise<void>
}

const BookmarkGrid: React.FC<BookmarkGridProps> = ({
  bookmarks,
  categories,
  networkMode,
  bookmarkSettings,
  loading = false,
  error = null,
  selectedCategoryId = null,
  onBookmarkClick,
  onBookmarkContextMenu,
  onAddBookmarkClick,
  onBookmarksReorder,
}) => {
  const [draggedBookmarkId, setDraggedBookmarkId] = useState<string | null>(null)
  const [dragOverBookmarkId, setDragOverBookmarkId] = useState<string | null>(null)
  const [isReordering, setIsReordering] = useState(false)
  const draggedIndexRef = useRef<number>(-1)
  const dropTargetIndexRef = useRef<number>(-1)
  const dragLeaveTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // 使用新的分类关联Hook
  const { getBookmarksByCategory } = useBookmarkCategories(bookmarks, categories)

  // 使用书签样式Hook
  const {
    gridStyles,
    cardStyles,
    iconStyles,
    gridClasses,
    cardClasses,
    showTitle,
    showFavicons,
    showDescriptions,
    openIn,
    hoverScale,
  } = useBookmarkStyles(bookmarkSettings)

  // 按分类筛选并排序书签
  const sortedBookmarks = useMemo(() => {
    // 根据选中的分类筛选书签
    const filteredBookmarks = getBookmarksByCategory(selectedCategoryId)
    
    // 按position排序书签，没有position的书签放在最后
    return [...filteredBookmarks].sort((a, b) => {
      const posA = a.position ?? Number.MAX_SAFE_INTEGER
      const posB = b.position ?? Number.MAX_SAFE_INTEGER
      if (posA === posB) {
        // 如果position相同，按创建时间排序
        return a.createdAt - b.createdAt
      }
      return posA - posB
    })
  }, [getBookmarksByCategory, selectedCategoryId])

  // 处理书签点击
  const handleBookmarkClick = useCallback((bookmark: Bookmark) => {
    if (onBookmarkClick) {
      onBookmarkClick(bookmark)
    } else {
      // 根据设置决定打开方式
      const url = networkMode === 'internal' && bookmark.internalUrl ? bookmark.internalUrl : bookmark.url
      if (openIn === 'new') {
        window.open(url, '_blank')
      } else {
        window.location.href = url
      }
    }
  }, [onBookmarkClick, networkMode, openIn])

  // 拖拽开始 - 拖拽始终启用
  const handleDragStart = useCallback((bookmarkId: string, event: React.DragEvent) => {
    try {
      setDraggedBookmarkId(bookmarkId)
      draggedIndexRef.current = sortedBookmarks.findIndex(b => b.id === bookmarkId)
      
      // 设置拖拽数据
      event.dataTransfer.effectAllowed = 'move'
      event.dataTransfer.setData('text/plain', bookmarkId)
      
      // 添加拖拽样式
      const target = event.currentTarget as HTMLElement
      if (target) {
        target.style.opacity = '0.5'
      }
    } catch (error) {
      console.error('拖拽开始失败:', error)
      // 重置状态
      setDraggedBookmarkId(null)
      draggedIndexRef.current = -1
    }
  }, [sortedBookmarks])

  // 拖拽结束
  const handleDragEnd = useCallback(async (bookmarkId: string, event: React.DragEvent) => {
    try {
      // 移除拖拽样式
      const target = event.currentTarget as HTMLElement
      if (target) {
        target.style.opacity = '1'
      }

      // 如果有有效的拖拽移动，执行重排序
      if (
        draggedIndexRef.current !== -1 && 
        dropTargetIndexRef.current !== -1 && 
        draggedIndexRef.current !== dropTargetIndexRef.current &&
        onBookmarksReorder
      ) {
        setIsReordering(true)
        
        try {
          // 创建新的书签数组
          const newBookmarks = [...sortedBookmarks]
          const [draggedBookmark] = newBookmarks.splice(draggedIndexRef.current, 1)
          newBookmarks.splice(dropTargetIndexRef.current, 0, draggedBookmark)
          
          // 更新所有书签的position
          const updatedBookmarks = newBookmarks.map((bookmark, index) => ({
            ...bookmark,
            position: index,
            updatedAt: Date.now()
          }))
          
          await onBookmarksReorder(updatedBookmarks)
        } catch (error) {
          console.error('重排序书签失败:', error)
        } finally {
          setIsReordering(false)
        }
      }
    } catch (error) {
      console.error('拖拽结束处理失败:', error)
    } finally {
      // 重置拖拽状态
      setDraggedBookmarkId(null)
      setDragOverBookmarkId(null)
      draggedIndexRef.current = -1
      dropTargetIndexRef.current = -1
    }
  }, [sortedBookmarks, onBookmarksReorder])

  // 拖拽悬停
  const handleDragOver = useCallback((bookmarkId: string, event: React.DragEvent) => {
    event.preventDefault()
    event.dataTransfer.dropEffect = 'move'
    
    // 更新目标索引
    const targetIndex = sortedBookmarks.findIndex(b => b.id === bookmarkId)
    if (targetIndex !== -1) {
      dropTargetIndexRef.current = targetIndex
    }
  }, [sortedBookmarks])

  // 拖拽进入
  const handleDragEnter = useCallback((bookmarkId: string, event: React.DragEvent) => {
    event.preventDefault()
    if (bookmarkId !== draggedBookmarkId) {
      setDragOverBookmarkId(bookmarkId)
    }
  }, [draggedBookmarkId])

  // 拖拽离开
  const handleDragLeave = useCallback((bookmarkId: string, event: React.DragEvent) => {
    event.preventDefault()
    
    // 清除之前的延时
    if (dragLeaveTimeoutRef.current) {
      clearTimeout(dragLeaveTimeoutRef.current)
    }
    
    // 使用更简单的逻辑：延迟清除悬停状态，让dragEnter有机会设置新的状态
    dragLeaveTimeoutRef.current = setTimeout(() => {
      setDragOverBookmarkId(prev => prev === bookmarkId ? null : prev)
    }, 50)
  }, [])

  // 放置
  const handleDrop = useCallback((bookmarkId: string, event: React.DragEvent) => {
    event.preventDefault()
    const draggedId = event.dataTransfer.getData('text/plain')
    
    if (draggedId && draggedId !== bookmarkId) {
      // 拖拽逻辑将在dragEnd中处理
      setDragOverBookmarkId(null)
    }
  }, [])

  // 处理键盘导航（可选功能）
  const handleKeyDown = useCallback((event: React.KeyboardEvent, bookmarkId: string) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      const bookmark = bookmarks.find(b => b.id === bookmarkId)
      if (bookmark) {
        handleBookmarkClick(bookmark)
      }
    }
  }, [bookmarks, handleBookmarkClick])

  // 清理定时器
  useEffect(() => {
    return () => {
      if (dragLeaveTimeoutRef.current) {
        clearTimeout(dragLeaveTimeoutRef.current)
      }
    }
  }, [])

  // 如果正在加载
  if (loading) {
    // 根据设置生成加载占位符
    const placeholderCount = typeof bookmarkSettings.display.itemsPerRow === 'number' 
      ? bookmarkSettings.display.itemsPerRow * 2 
      : 8
      
    return (
      <div className="w-full max-w-6xl">
        <div className={gridClasses} style={gridStyles}>
          {Array.from({ length: placeholderCount }).map((_, index) => (
            <div
              key={index}
              className="rounded-xl text-center animate-pulse bg-white/10 backdrop-blur-md border border-white/20"
              style={cardStyles}
            >
              <div 
                className="mx-auto mb-3 bg-white/20 rounded-lg" 
                style={iconStyles}
              ></div>
              {showTitle && (
                <div className="h-4 bg-white/20 rounded mx-2"></div>
              )}
            </div>
          ))}
        </div>
      </div>
    )
  }

  // 如果有错误
  if (error) {
    return (
      <div className="w-full max-w-6xl">
        <div className="p-8 rounded-xl text-center border border-red-400/30 bg-red-500/10 backdrop-blur-md">
          <div className="text-red-300 text-lg mb-2">加载书签时出错</div>
          <div className="text-red-200 text-sm">{error}</div>
        </div>
      </div>
    )
  }

  // 如果没有书签
  if (sortedBookmarks.length === 0) {
    return (
      <div className="w-full max-w-6xl">
        <div className="text-center">
          <div className="p-8 rounded-xl text-white border border-white/20 bg-white/10 backdrop-blur-md">
            <div className="mb-4">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-white/10 flex items-center justify-center">
                <Plus className="w-8 h-8 text-white/60" />
              </div>
              <p className="text-lg mb-2">
                {selectedCategoryId ? '此分类还没有书签' : '还没有书签'}
              </p>
              <p className="text-sm opacity-80 mb-6">点击右下角的 + 按钮开始添加书签</p>
            </div>
            {onAddBookmarkClick && (
              <button
                onClick={onAddBookmarkClick}
                className="px-6 py-2 rounded-lg text-white font-medium transition-all duration-200 bg-white/20 hover:bg-white/30 border border-white/20 hover:border-white/40"
              >
                {selectedCategoryId ? '为此分类添加书签' : '添加第一个书签'}
              </button>
            )}
          </div>
        </div>
      </div>
    )
  }

  // 渲染书签网格
  return (
    <div className="w-full max-w-6xl">
      {/* 重排序提示 */}
      {isReordering && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50">
          <div className="px-4 py-2 rounded-lg text-white text-sm font-medium bg-blue-500/80 backdrop-blur-md border border-blue-400/30 shadow-lg">
            正在保存书签顺序...
          </div>
        </div>
      )}

      {/* 书签网格 */}
      <div className={gridClasses} style={gridStyles}>
        {sortedBookmarks.map((bookmark) => (
          <BookmarkCard
            key={bookmark.id}
            bookmark={bookmark}
            networkMode={networkMode}
            bookmarkSettings={bookmarkSettings}
            isDragging={draggedBookmarkId === bookmark.id}
            isDragOver={dragOverBookmarkId === bookmark.id}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onDragOver={handleDragOver}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={handleBookmarkClick}
            onContextMenu={onBookmarkContextMenu}
          />
        ))}
      </div>

    </div>
  )
}

export default BookmarkGrid
