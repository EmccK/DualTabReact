import React, { useState, useCallback, useRef, useEffect } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { CategorySidebar } from './CategorySidebar'
import type { BookmarkCategory } from '@/types'
import type { BookmarkSettings } from '@/types/settings'

interface ResizableCategorySidebarProps {
  categories: BookmarkCategory[]
  selectedCategoryId: string | null
  onCategorySelect: (categoryId: string | null) => void
  onAddCategory: () => void
  onEditCategory: (category: BookmarkCategory) => void
  onDeleteCategory: (categoryId: string) => void
  onReorderCategories: (reorderedCategories: BookmarkCategory[]) => void
  onCategoryContextMenu?: (category: BookmarkCategory, event: React.MouseEvent) => void
  isGlassEffect?: boolean
  loading?: boolean
  categorySettings: BookmarkSettings['categories']
  onWidthChange: (width: number) => void
}

export function ResizableCategorySidebar({
  categories,
  selectedCategoryId,
  onCategorySelect,
  onAddCategory,
  onEditCategory,
  onDeleteCategory,
  onReorderCategories,
  onCategoryContextMenu,
  isGlassEffect = true,
  loading = false,
  categorySettings,
  onWidthChange
}: ResizableCategorySidebarProps) {
  const [isResizing, setIsResizing] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const [isVisible, setIsVisible] = useState(true)
  const sidebarRef = useRef<HTMLDivElement>(null)
  const resizeHandleRef = useRef<HTMLDivElement>(null)
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // 当前实际宽度（考虑自动隐藏时的状态）
  const actualWidth = categorySettings.sidebarVisible === 'auto' && !isVisible 
    ? 0 
    : categorySettings.sidebarWidth

  // 处理拖拽调整宽度
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    setIsResizing(true)
    
    const startX = e.clientX
    const startWidth = categorySettings.sidebarWidth

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = startX - moveEvent.clientX // 注意方向，向左拖拽增加宽度
      const newWidth = Math.min(Math.max(startWidth + deltaX, 200), 400)
      onWidthChange(newWidth)
    }

    const handleMouseUp = () => {
      setIsResizing(false)
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
      document.body.style.cursor = 'default'
      document.body.style.userSelect = 'auto'
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
    document.body.style.cursor = 'ew-resize'
    document.body.style.userSelect = 'none'
  }, [categorySettings.sidebarWidth, onWidthChange])

  // 处理自动隐藏模式的鼠标事件
  const handleMouseEnter = useCallback(() => {
    if (categorySettings.sidebarVisible === 'auto') {
      // 清除隐藏定时器
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current)
        hoverTimeoutRef.current = null
      }
      
      setIsHovered(true)
      // 延迟显示，避免意外触发
      hoverTimeoutRef.current = setTimeout(() => {
        setIsVisible(true)
      }, 100)
    }
  }, [categorySettings.sidebarVisible])

  const handleMouseLeave = useCallback(() => {
    if (categorySettings.sidebarVisible === 'auto') {
      setIsHovered(false)
      
      // 清除显示定时器
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current)
        hoverTimeoutRef.current = null
      }
      
      // 延迟隐藏
      hoverTimeoutRef.current = setTimeout(() => {
        if (!isResizing) {
          setIsVisible(false)
        }
      }, 300)
    }
  }, [categorySettings.sidebarVisible, isResizing])

  // 监听设置变化，更新可见性状态
  useEffect(() => {
    if (categorySettings.sidebarVisible === 'always') {
      setIsVisible(true)
      // 清除定时器
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current)
        hoverTimeoutRef.current = null
      }
    } else if (categorySettings.sidebarVisible === 'auto' && !isHovered) {
      setIsVisible(false)
    }
  }, [categorySettings.sidebarVisible, isHovered])

  // 清理定时器
  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current)
      }
    }
  }, [])

  return (
    <>
      {/* 触发区域（自动隐藏模式时使用） */}
      {categorySettings.sidebarVisible === 'auto' && !isVisible && (
        <div
          className="fixed right-0 top-0 w-4 h-full z-40 bg-transparent"
          onMouseEnter={handleMouseEnter}
        />
      )}

      {/* 主边栏容器 */}
      <div
        ref={sidebarRef}
        className={`
          fixed right-0 top-0 h-full z-30 flex transition-all duration-300 ease-in-out
          ${categorySettings.sidebarVisible === 'auto' && !isVisible ? 'translate-x-full' : 'translate-x-0'}
        `}
        style={{ width: `${categorySettings.sidebarWidth}px` }}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {/* 拖拽调整手柄 */}
        <div
          ref={resizeHandleRef}
          onMouseDown={handleMouseDown}
          className={`
            w-1 h-full cursor-ew-resize group relative
            ${isGlassEffect ? 'bg-white/10 hover:bg-white/20' : 'bg-black/20 hover:bg-black/30'}
            transition-all duration-200
            ${isResizing ? 'bg-blue-500/50' : ''}
          `}
          title="拖拽调整边栏宽度"
        >
          {/* 拖拽指示器 */}
          <div className={`
            absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2
            w-6 h-8 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100
            transition-opacity duration-200 pointer-events-none
            ${isGlassEffect ? 'bg-white/20 backdrop-blur-sm' : 'bg-black/40'}
          `}>
            <div className="flex space-x-0.5">
              <div className="w-0.5 h-4 bg-white/60 rounded-full"></div>
              <div className="w-0.5 h-4 bg-white/60 rounded-full"></div>
            </div>
          </div>

          {/* 宽度数值显示（调整时） */}
          {isResizing && (
            <div className={`
              absolute top-4 left-8 px-2 py-1 rounded text-xs text-white font-medium
              ${isGlassEffect ? 'bg-blue-500/80 backdrop-blur-sm' : 'bg-blue-600'}
              border border-blue-400/30
            `}>
              {categorySettings.sidebarWidth}px
            </div>
          )}
        </div>

        {/* 分类边栏内容 */}
        <div className="flex-1">
          <CategorySidebar
            categories={categories}
            selectedCategoryId={selectedCategoryId}
            onCategorySelect={onCategorySelect}
            onAddCategory={onAddCategory}
            onEditCategory={onEditCategory}
            onDeleteCategory={onDeleteCategory}
            onReorderCategories={onReorderCategories}
            onCategoryContextMenu={onCategoryContextMenu}
            isGlassEffect={isGlassEffect}
            loading={loading}
            categorySettings={categorySettings}
          />
        </div>
      </div>

      {/* 自动隐藏模式的显示/隐藏指示器 */}
      {categorySettings.sidebarVisible === 'auto' && (
        <div
          className={`
            fixed right-2 top-1/2 transform -translate-y-1/2 z-40
            w-8 h-8 rounded-full flex items-center justify-center cursor-pointer
            transition-all duration-300
            ${isGlassEffect ? 'bg-white/10 backdrop-blur-md hover:bg-white/20' : 'bg-black/20 hover:bg-black/30'}
            border border-white/20 text-white/70 hover:text-white
            ${isVisible ? 'opacity-0 pointer-events-none' : 'opacity-100'}
          `}
          onClick={() => setIsVisible(true)}
          title="显示分类边栏"
        >
          <ChevronLeft className="w-4 h-4" />
        </div>
      )}

      {/* 遮罩层（自动隐藏模式且边栏显示时） */}
      {categorySettings.sidebarVisible === 'auto' && isVisible && (
        <div
          className="fixed inset-0 bg-black/20 z-20"
          onClick={() => setIsVisible(false)}
        />
      )}
    </>
  )
}
