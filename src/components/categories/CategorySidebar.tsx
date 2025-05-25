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
  isGlassEffect?: boolean
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
  isGlassEffect = true,
  loading = false,
  categorySettings
}: CategorySidebarProps) {
  const [draggedCategoryId, setDraggedCategoryId] = useState<string | null>(null)
  const [dragOverCategoryId, setDragOverCategoryId] = useState<string | null>(null)
  const draggedIndexRef = useRef<number>(-1)
  const dropTargetIndexRef = useRef<number>(-1)

  const handleDragStart = useCallback((e: React.DragEvent, categoryId: string) => {
    // 检查是否启用拖拽排序
    if (!categorySettings?.enableSort) {
      e.preventDefault()
      return
    }
    
    setDraggedCategoryId(categoryId)
    draggedIndexRef.current = categories.findIndex(cat => cat.id === categoryId)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', categoryId)
  }, [categories, categorySettings?.enableSort])

  const handleDragEnd = useCallback(() => {
    setDraggedCategoryId(null)
    setDragOverCategoryId(null)
    draggedIndexRef.current = -1
    dropTargetIndexRef.current = -1
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent, categoryId: string) => {
    if (!categorySettings?.enableSort) return
    
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    
    if (draggedCategoryId && draggedCategoryId !== categoryId) {
      setDragOverCategoryId(categoryId)
      dropTargetIndexRef.current = categories.findIndex(cat => cat.id === categoryId)
    }
  }, [draggedCategoryId, categories, categorySettings?.enableSort])

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
      <div className={`w-full h-full ${isGlassEffect ? 'bg-white/10 backdrop-blur-md' : 'bg-black/20'}`}>
        <div className="space-y-1">
          <div className="h-12 bg-white/20 animate-pulse" />
          <div className="h-12 bg-white/20 animate-pulse" />
          <div className="h-12 bg-white/20 animate-pulse" />
        </div>
      </div>
    )
  }  return (
    <div className={`w-full h-full ${isGlassEffect ? 'bg-white/10 backdrop-blur-md' : 'bg-black/20'} flex flex-col`}>
      {/* 分类列表 */}
      <div className="flex-1 flex flex-col justify-center space-y-1 overflow-y-auto">
        {/* 分类项目 */}
        {categories.map((category) => {
          // 根据样式设置决定显示方式
          const isBadgeStyle = categorySettings?.style === 'badge'
          const bookmarkCount = category.bookmarks?.length || 0
          
          return (
            <div
              key={category.id}
              data-context-target="category"
              draggable={categorySettings?.enableSort !== false}
              onDragStart={(e) => handleDragStart(e, category.id)}
              onDragEnd={handleDragEnd}
              onDragOver={(e) => handleDragOver(e, category.id)}
              onDrop={handleDrop}
              onClick={() => handleCategoryClick(category.id)}
              onContextMenu={(e) => handleCategoryContextMenu(e, category)}
              className={`group flex items-center space-x-3 px-4 py-3 cursor-pointer transition-all duration-200 ${
                selectedCategoryId === category.id
                  ? 'text-white shadow-lg'
                  : 'text-white/80 hover:text-white hover:bg-white/10'
              } ${
                draggedCategoryId === category.id ? 'opacity-50 scale-95' : ''
              } ${
                dragOverCategoryId === category.id ? 'bg-white/20 scale-105' : ''
              } ${
                !categorySettings?.enableSort ? '' : 'hover:cursor-grab active:cursor-grabbing'
              }`}
              style={{
                backgroundColor: selectedCategoryId === category.id ? category.color : undefined
              }}
            >
              <span className="text-lg">{category.icon}</span>
              <span className="text-sm font-medium truncate flex-1">{category.name}</span>
              
              {/* 徽章样式：显示书签数量 */}
              {isBadgeStyle && bookmarkCount > 0 && (
                <span className={`
                  px-2 py-0.5 text-xs rounded-full font-medium
                  ${selectedCategoryId === category.id 
                    ? 'bg-white/20 text-white' 
                    : 'bg-white/10 text-white/80'
                  }
                `}>
                  {bookmarkCount}
                </span>
              )}
            </div>
          )
        })}
      </div>
      
      {/* 添加分类按钮 */}
      <div className="p-4 border-t border-white/10">
        <div
          onClick={onAddCategory}
          className="group flex items-center justify-center space-x-3 px-4 py-3 cursor-pointer transition-all duration-200 text-white/80 hover:text-white hover:bg-white/10 rounded-lg"
        >
          <Plus className="h-4 w-4" />
          <span className="text-sm font-medium">添加分类</span>
        </div>
      </div>
    </div>
  )
}