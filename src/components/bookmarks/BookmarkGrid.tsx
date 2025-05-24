import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react'
import type { Bookmark, NetworkMode, BookmarkCategory } from '@/types'
import BookmarkCard from './BookmarkCard'
import { Plus } from 'lucide-react'
import { useBookmarkCategories } from '@/hooks'

interface BookmarkGridProps {
  bookmarks: Bookmark[]
  categories: BookmarkCategory[]
  networkMode: NetworkMode
  isGlassEffect: boolean
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
  isGlassEffect,
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

  // 拖拽开始
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
        target.classList.add('dragging')
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
        target.classList.remove('dragging')
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
        onBookmarkClick?.(bookmark)
      }
    }
  }, [bookmarks, onBookmarkClick])

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
    return (
      <div className="w-full max-w-6xl">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4">
          {Array.from({ length: 8 }).map((_, index) => (
            <div
              key={index}
              className={`
                p-4 rounded-xl text-center animate-pulse
                ${isGlassEffect ? 'bg-white/10 backdrop-blur-md' : 'bg-black/30'}
                border border-white/20
              `}
            >
              <div className="w-8 h-8 mx-auto mb-3 bg-white/20 rounded-lg"></div>
              <div className="h-4 bg-white/20 rounded mx-2"></div>
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
        <div className={`
          p-8 rounded-xl text-center border border-red-400/30
          ${isGlassEffect ? 'bg-red-500/10 backdrop-blur-md' : 'bg-red-500/20'}
        `}>
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
          <div className={`
            p-8 rounded-xl text-white border border-white/20 
            ${isGlassEffect ? 'bg-white/10 backdrop-blur-md' : 'bg-black/20'}
          `}>
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
                className={`
                  px-6 py-2 rounded-lg text-white font-medium transition-all duration-200
                  ${isGlassEffect ? 'bg-white/20 hover:bg-white/30' : 'bg-blue-600 hover:bg-blue-700'}
                  border border-white/20 hover:border-white/40
                `}
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
          <div className={`
            px-4 py-2 rounded-lg text-white text-sm font-medium
            ${isGlassEffect ? 'bg-blue-500/80 backdrop-blur-md' : 'bg-blue-600'}
            border border-blue-400/30 shadow-lg
          `}>
            正在保存书签顺序...
          </div>
        </div>
      )}

      {/* 书签网格 */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4">
        {sortedBookmarks.map((bookmark) => (
          <BookmarkCard
            key={bookmark.id}
            bookmark={bookmark}
            networkMode={networkMode}
            isGlassEffect={isGlassEffect}
            isDragging={draggedBookmarkId === bookmark.id}
            isDragOver={dragOverBookmarkId === bookmark.id}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onDragOver={handleDragOver}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={onBookmarkClick}
            onContextMenu={onBookmarkContextMenu}
          />
        ))}
      </div>

      {/* 书签统计信息 */}
      <div className="mt-6 text-center">
        <div className="text-white/60 text-sm">
          共 {sortedBookmarks.length} 个书签
          {selectedCategoryId && categories.find(cat => cat.id === selectedCategoryId) && 
           ` (${categories.find(cat => cat.id === selectedCategoryId)?.name})`}
          {networkMode === 'internal' && ' - 内网模式'}
          {networkMode === 'external' && ' - 外网模式'}
        </div>
      </div>
    </div>
  )
}

export default BookmarkGrid
