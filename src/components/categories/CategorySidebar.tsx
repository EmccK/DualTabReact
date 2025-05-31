import React, { useState, useCallback, useRef } from 'react'
import { Plus } from 'lucide-react'
import type { BookmarkCategory } from '@/types'
import type { BookmarkSettings } from '@/types/settings'

interface CategorySidebarProps {
  categories: BookmarkCategory[]
  selectedCategoryId: string | null
  onCategorySelect: (categoryId: string | null) => void
  onAddCategory: () => void
  onEditCategory: (category: BookmarkCategory) => void
  onDeleteCategory: (categoryId: string) => void
  onReorderCategories: (reorderedCategories: BookmarkCategory[]) => void
  onCategoryContextMenu?: (category: BookmarkCategory, event: React.MouseEvent) => void
  loading?: boolean
  categorySettings?: BookmarkSettings['categories']
}

export function CategorySidebar({
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
}: CategorySidebarProps) {
  const [draggedCategoryId, setDraggedCategoryId] = useState<string | null>(null)
  const [dragOverCategoryId, setDragOverCategoryId] = useState<string | null>(null)
  const draggedIndexRef = useRef<number>(-1)
  const dropTargetIndexRef = useRef<number>(-1)

  const handleDragStart = useCallback((e: React.DragEvent, categoryId: string) => {
    // 分类排序始终启用
    setDraggedCategoryId(categoryId)
    draggedIndexRef.current = categories.findIndex(cat => cat.id === categoryId)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', categoryId)
  }, [categories])

  const handleDragEnd = useCallback(() => {
    setDraggedCategoryId(null)
    setDragOverCategoryId(null)
    draggedIndexRef.current = -1
    dropTargetIndexRef.current = -1
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent, categoryId: string) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    
    if (draggedCategoryId && draggedCategoryId !== categoryId) {
      setDragOverCategoryId(categoryId)
      dropTargetIndexRef.current = categories.findIndex(cat => cat.id === categoryId)
    }
  }, [draggedCategoryId, categories])

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
    } catch (error) {
      console.error('分类重排序失败:', error)
    }
  }, [categories, onReorderCategories])

  const handleCategoryClick = useCallback((categoryId: string) => {
    console.log('分类点击测试:', categoryId)
    onCategorySelect(categoryId)
  }, [onCategorySelect])

  const handleEditClick = useCallback((e: React.MouseEvent, category: BookmarkCategory) => {
    e.stopPropagation()
    onEditCategory(category)
  }, [onEditCategory])

  const handleDeleteClick = useCallback((e: React.MouseEvent, categoryId: string) => {
    e.stopPropagation()
    
    // 只有一个分类时不可删除
    if (categories.length <= 1) {
      return
    }
    
    const category = categories.find(cat => cat.id === categoryId)
    const bookmarkCount = category?.bookmarks.length || 0
    
    let confirmMessage = '确定要删除这个分类吗？'
    if (bookmarkCount > 0) {
      confirmMessage = `确定要删除这个分类吗？分类中的 ${bookmarkCount} 个书签也会被删除。`
    }
    
    if (confirm(confirmMessage)) {
      onDeleteCategory(categoryId)
    }
  }, [onDeleteCategory, categories])

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
              key={category.id}
              data-context-target="category"
              draggable={true} // 分类排序始终启用
              onDragStart={(e) => handleDragStart(e, category.id)}
              onDragEnd={handleDragEnd}
              onDragOver={(e) => handleDragOver(e, category.id)}
              onDrop={handleDrop}
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                handleCategoryClick(category.id)
              }}
              onContextMenu={(e) => handleCategoryContextMenu(e, category)}
              className={`relative z-10 group flex items-center space-x-2 px-3 py-2.5 cursor-pointer transition-all duration-200 ${
                selectedCategoryId === category.id
                  ? 'text-white shadow-lg'
                  : 'text-white/80 hover:text-white hover:bg-white/10'
              } ${
                draggedCategoryId === category.id ? 'opacity-50 scale-95' : ''
              } ${
                dragOverCategoryId === category.id ? 'bg-white/20 scale-105' : ''
              } hover:cursor-grab active:cursor-grabbing`}
              style={{
                backgroundColor: selectedCategoryId === category.id ? category.color : undefined,
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