import React, { useState, useCallback, useRef } from 'react'
import { Plus } from 'lucide-react'
import type { BookmarkCategory } from '@/types'
import type { BookmarkSettings } from '@/types/settings'

interface CategorySidebarProps {
  categories: BookmarkCategory[]
  selectedCategoryName: string | null
  onCategorySelect: (categoryName: string | null) => void
  onAddCategory: () => void
  onEditCategory: (category: BookmarkCategory) => void
  onDeleteCategory: (categoryName: string) => void
  onReorderCategories: (reorderedCategories: BookmarkCategory[]) => void
  onCategoryContextMenu?: (category: BookmarkCategory, event: React.MouseEvent) => void
  loading?: boolean
  categorySettings?: BookmarkSettings['categories']
}

export function CategorySidebar({
  categories,
  selectedCategoryName,
  onCategorySelect,
  onAddCategory,
  onReorderCategories,
  onCategoryContextMenu,
  loading = false
}: CategorySidebarProps) {
  const [draggedCategoryName, setDraggedCategoryName] = useState<string | null>(null)
  const [dragOverCategoryName, setDragOverCategoryName] = useState<string | null>(null)
  const draggedIndexRef = useRef<number>(-1)
  const dropTargetIndexRef = useRef<number>(-1)

  const handleDragStart = useCallback((e: React.DragEvent, categoryName: string) => {
    // 分类排序始终启用
    setDraggedCategoryName(categoryName)
    draggedIndexRef.current = categories.findIndex(cat => cat.name === categoryName)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', categoryName)
  }, [categories])

  const handleDragEnd = useCallback(() => {
    setDraggedCategoryName(null)
    setDragOverCategoryName(null)
    draggedIndexRef.current = -1
    dropTargetIndexRef.current = -1
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent, categoryName: string) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    
    if (draggedCategoryName && draggedCategoryName !== categoryName) {
      setDragOverCategoryName(categoryName)
      dropTargetIndexRef.current = categories.findIndex(cat => cat.name === categoryName)
    }
  }, [draggedCategoryName, categories])

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault()
    
    if (draggedIndexRef.current === -1 || dropTargetIndexRef.current === -1) {
      return
    }

    if (draggedIndexRef.current === dropTargetIndexRef.current) {
      return
    }

    const newCategories = [...categories]
    const draggedCategory = newCategories[draggedIndexRef.current]
    
    newCategories.splice(draggedIndexRef.current, 1)
    
    const insertIndex = draggedIndexRef.current < dropTargetIndexRef.current 
      ? dropTargetIndexRef.current - 1 
      : dropTargetIndexRef.current
    newCategories.splice(insertIndex, 0, draggedCategory)

    try {
      await onReorderCategories(newCategories)
    } catch {
      // Ignore category reorder errors
    }
  }, [categories, onReorderCategories])

  const handleCategoryClick = useCallback((categoryName: string) => {
    onCategorySelect(categoryName)
  }, [onCategorySelect])



  const handleCategoryContextMenu = useCallback((e: React.MouseEvent, category: BookmarkCategory) => {
    e.preventDefault()
    e.stopPropagation()
    onCategoryContextMenu?.(category, e)
  }, [onCategoryContextMenu])

  if (loading) {
    return (
      <div className="w-full h-full bg-gradient-to-l from-black/30 to-black/10 backdrop-blur-md flex flex-col border-l border-white/10">
        <div className="flex-1 flex flex-col justify-center space-y-1 overflow-y-auto">
          <div className="h-12 bg-white/20 animate-pulse mx-3 rounded" />
          <div className="h-12 bg-white/20 animate-pulse mx-3 rounded" />
          <div className="h-12 bg-white/20 animate-pulse mx-3 rounded" />
        </div>
      </div>
    )
  }

  return (
    <div 
      className="w-full h-full bg-gradient-to-l from-black/30 to-black/10 backdrop-blur-md flex flex-col border-l border-white/10 relative z-10"
      data-category-sidebar="true"
    >
      {/* 分类列表 */}
      <div className="flex-1 flex flex-col justify-center space-y-1 overflow-y-auto relative z-10">
        {/* 分类项目 */}
        {categories.map((category) => {
          return (
            <div
              key={category.name}
              data-context-target="category"
              draggable={true} // 分类排序始终启用
              onDragStart={(e) => handleDragStart(e, category.name)}
              onDragEnd={handleDragEnd}
              onDragOver={(e) => handleDragOver(e, category.name)}
              onDrop={handleDrop}
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                handleCategoryClick(category.name)
              }}
              onContextMenu={(e) => handleCategoryContextMenu(e, category)}
              className={`relative z-10 group flex items-center space-x-2 px-3 py-2.5 cursor-pointer transition-all duration-200 ${
                selectedCategoryName === category.name
                  ? 'text-white shadow-lg'
                  : 'text-white/80 hover:text-white hover:bg-white/10'
              } ${
                draggedCategoryName === category.name ? 'opacity-50 scale-95' : ''
              } ${
                dragOverCategoryName === category.name ? 'bg-white/20 scale-105' : ''
              } hover:cursor-grab active:cursor-grabbing`}
              style={{
                backgroundColor: selectedCategoryName === category.name ? category.color : undefined,
                pointerEvents: 'auto'  // 确保可以接收鼠标事件
              }}
            >
              <span className="text-base">{category.icon}</span>
              <span className="text-sm font-medium truncate flex-1">{category.name}</span>
            </div>
          )
        })}
      </div>
      
      {/* 添加分类按钮 */}
      <div className="p-3 border-t border-white/10 relative z-10">
        <div
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            onAddCategory()
          }}
          className="group flex items-center justify-center space-x-2 px-3 py-2.5 cursor-pointer transition-all duration-200 text-white/80 hover:text-white hover:bg-white/10 rounded-lg relative z-10"
          style={{ pointerEvents: 'auto' }}
        >
          <Plus className="h-4 w-4" />
          <span className="text-sm font-medium">添加分类</span>
        </div>
      </div>
    </div>
  )
}