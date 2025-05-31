import React, { useState, useCallback, useRef, useEffect } from 'react'
import { ChevronLeft } from 'lucide-react'
import { CategorySidebar } from './CategorySidebar'
import type { BookmarkCategory } from '@/types'
import type { BookmarkSettings } from '@/types/settings'

interface SimpleCategorySidebarProps {
  categories: BookmarkCategory[]
  selectedCategoryId: string | null
  onCategorySelect: (categoryId: string | null) => void
  onAddCategory: () => void
  onEditCategory: (category: BookmarkCategory) => void
  onDeleteCategory: (categoryId: string) => void
  onReorderCategories: (reorderedCategories: BookmarkCategory[]) => void
  onCategoryContextMenu?: (category: BookmarkCategory, event: React.MouseEvent) => void
  loading?: boolean
  categorySettings: BookmarkSettings['categories']
}

const SIDEBAR_WIDTH = 160 // 固定边栏宽度

export function SimpleCategorySidebar({
  categories,
  selectedCategoryId,
  onCategorySelect,
  onAddCategory,
  onEditCategory,
  onDeleteCategory,
  onReorderCategories,
  onCategoryContextMenu,
  loading = false,
  categorySettings
}: SimpleCategorySidebarProps) {
  const [isVisible, setIsVisible] = useState(categorySettings.sidebarVisible === 'always')
  const [isPinned, setIsPinned] = useState(false)
  const hideTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // 清除定时器
  const clearHideTimeout = useCallback(() => {
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current)
      hideTimeoutRef.current = null
    }
  }, [])

  // 检查鼠标是否在边栏区域内
  const isMouseInSidebarArea = useCallback((clientX: number) => {
    const windowWidth = window.innerWidth
    return clientX >= windowWidth - SIDEBAR_WIDTH - 12 // 12px触发区域
  }, [])

  // 显示边栏
  const showSidebar = useCallback(() => {
    if (categorySettings.sidebarVisible === 'auto') {
      console.log('显示边栏')
      clearHideTimeout()
      setIsVisible(true)
    }
  }, [categorySettings.sidebarVisible, clearHideTimeout])

  // 隐藏边栏
  const hideSidebar = useCallback(() => {
    if (categorySettings.sidebarVisible === 'auto' && !isPinned) {
      console.log('隐藏边栏 (500ms后)')
      clearHideTimeout()
      hideTimeoutRef.current = setTimeout(() => {
        console.log('边栏已隐藏')
        setIsVisible(false)
      }, 500)
    }
  }, [categorySettings.sidebarVisible, isPinned, clearHideTimeout])

  // 全局鼠标监听
  useEffect(() => {
    if (categorySettings.sidebarVisible !== 'auto') return

    const handleMouseMove = (e: MouseEvent) => {
      const inArea = isMouseInSidebarArea(e.clientX)
      console.log('鼠标位置:', e.clientX, '窗口宽度:', window.innerWidth, '在边栏区域:', inArea)
      
      if (inArea) {
        showSidebar()
      } else {
        hideSidebar()
      }
    }

    document.addEventListener('mousemove', handleMouseMove, { passive: true })
    return () => document.removeEventListener('mousemove', handleMouseMove)
  }, [categorySettings.sidebarVisible, isMouseInSidebarArea, showSidebar, hideSidebar])

  // 处理临时固定
  const handlePin = useCallback(() => {
    if (categorySettings.sidebarVisible === 'auto') {
      setIsPinned(true)
      clearHideTimeout()
      
      // 3秒后取消固定
      hideTimeoutRef.current = setTimeout(() => {
        setIsPinned(false)
        hideSidebar()
      }, 3000)
    }
  }, [categorySettings.sidebarVisible, clearHideTimeout, hideSidebar])

  // 处理设置变化
  useEffect(() => {
    if (categorySettings.sidebarVisible === 'always') {
      setIsVisible(true)
      setIsPinned(false)
      clearHideTimeout()
    }
  }, [categorySettings.sidebarVisible, clearHideTimeout])

  // 键盘快捷键
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (categorySettings.sidebarVisible !== 'auto') return
      
      if (e.key === 'Escape' && isVisible) {
        setIsPinned(false)
        setIsVisible(false)
        clearHideTimeout()
      }
      
      if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
        e.preventDefault()
        if (isVisible) {
          setIsPinned(false)
          setIsVisible(false)
          clearHideTimeout()
        } else {
          handlePin()
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [categorySettings.sidebarVisible, isVisible, handlePin, clearHideTimeout])

  // 清理定时器
  useEffect(() => {
    return () => clearHideTimeout()
  }, [clearHideTimeout])

  return (
    <>
      {/* 边栏容器 */}
      <div
        className={`
          fixed right-0 top-0 h-full z-30
          transition-transform duration-300 ease-in-out
          ${categorySettings.sidebarVisible === 'auto' && !isVisible ? 'translate-x-full' : 'translate-x-0'}
          ${isPinned ? 'shadow-2xl' : ''}
        `}
        style={{ width: `${SIDEBAR_WIDTH}px` }}
      >
        {/* CategorySidebar - 完全独立，不受任何事件干扰 */}
        <CategorySidebar
          categories={categories}
          selectedCategoryId={selectedCategoryId}
          onCategorySelect={onCategorySelect}
          onAddCategory={onAddCategory}
          onEditCategory={onEditCategory}
          onDeleteCategory={onDeleteCategory}
          onReorderCategories={onReorderCategories}
          onCategoryContextMenu={onCategoryContextMenu}
          loading={loading}
          categorySettings={categorySettings}
        />

        {/* 固定状态指示器 */}
        {categorySettings.sidebarVisible === 'auto' && isPinned && (
          <div className="absolute top-4 left-4 px-2 py-1 bg-blue-500/80 text-white text-xs rounded-full backdrop-blur-sm border border-blue-400/30 z-10">
            已固定
          </div>
        )}
      </div>

      {/* 显示指示器 */}
      {categorySettings.sidebarVisible === 'auto' && !isVisible && (
        <div
          className="fixed right-2 top-1/2 transform -translate-y-1/2 z-40 w-10 h-10 rounded-full flex items-center justify-center cursor-pointer transition-all duration-300 bg-white/15 backdrop-blur-md hover:bg-white/25 border border-white/30 text-white/80 hover:text-white hover:scale-110"
          onClick={handlePin}
          title="点击显示分类边栏"
        >
          <ChevronLeft className="w-5 h-5" />
        </div>
      )}

      {/* 遮罩层 */}
      {categorySettings.sidebarVisible === 'auto' && isVisible && (
        <div
          className="fixed inset-0 bg-black/10 z-20 transition-opacity duration-300"
          style={{ right: `${SIDEBAR_WIDTH}px` }}
          onClick={() => {
            setIsPinned(false)
            setIsVisible(false)
            clearHideTimeout()
          }}
        />
      )}
    </>
  )
}
