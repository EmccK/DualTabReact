import React, { useState, useCallback, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Plus, GripVertical, Edit, Trash2, Home } from 'lucide-react'
import type { BookmarkCategory } from '@/types'

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
  loading = false
}: CategorySidebarProps) {
  const [draggedCategoryId, setDraggedCategoryId] = useState<string | null>(null)
  const [dragOverCategoryId, setDragOverCategoryId] = useState<string | null>(null)
  const draggedIndexRef = useRef<number>(-1)
  const dropTargetIndexRef = useRef<number>(-1)

  const handleDragStart = useCallback((e: React.DragEvent, categoryId: string) => {
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

  const handleCategoryClick = useCallback((categoryId: string | null) => {
    onCategorySelect(categoryId)
  }, [onCategorySelect])

  const handleEditClick = useCallback((e: React.MouseEvent, category: BookmarkCategory) => {
    e.stopPropagation()
    onEditCategory(category)
  }, [onEditCategory])

  const handleDeleteClick = useCallback((e: React.MouseEvent, categoryId: string) => {
    e.stopPropagation()
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
      <div className={`w-64 h-full ${isGlassEffect ? 'bg-white/10 backdrop-blur-md' : 'bg-black/20'} rounded-lg p-4 border border-white/20`}>
        <div className="space-y-3">
          <div className="h-8 bg-white/20 rounded animate-pulse" />
          <div className="h-8 bg-white/20 rounded animate-pulse" />
          <div className="h-8 bg-white/20 rounded animate-pulse" />
        </div>
      </div>
    )
  }  return (
    <div className={`w-64 h-full ${isGlassEffect ? 'bg-white/10 backdrop-blur-md' : 'bg-black/20'} rounded-lg border border-white/20 flex flex-col`}>
      {/* 头部 */}
      <div className="p-4 border-b border-white/20">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-white/90">分类管理</h3>
          <Button
            onClick={onAddCategory}
            size="sm"
            variant="ghost"
            className="text-white/80 hover:text-white hover:bg-white/20 h-8 px-2"
          >
            <Plus className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* 分类列表 */}
      <div className="flex-1 p-4 space-y-2 overflow-y-auto">
        {/* 全部分类 */}
        <div
          onClick={() => handleCategoryClick(null)}
          className={`group flex items-center justify-between p-3 rounded-lg cursor-pointer transition-all duration-200 ${
            selectedCategoryId === null
              ? 'bg-blue-500/80 text-white shadow-lg'
              : 'text-white/80 hover:text-white hover:bg-white/10'
          }`}
        >
          <div className="flex items-center space-x-3">
            <Home className="h-4 w-4" />
            <span className="text-sm font-medium">全部</span>
          </div>
          <Badge variant="secondary" className="h-5 px-2 text-xs bg-white/20 text-white">
            {categories.reduce((total, cat) => total + cat.bookmarks.length, 0)}
          </Badge>
        </div>

        {/* 分类项目 */}
        {categories.map((category) => (
          <div
            key={category.id}
            data-context-target="category"
            draggable
            onDragStart={(e) => handleDragStart(e, category.id)}
            onDragEnd={handleDragEnd}
            onDragOver={(e) => handleDragOver(e, category.id)}
            onDrop={handleDrop}
            onClick={() => handleCategoryClick(category.id)}
            onContextMenu={(e) => handleCategoryContextMenu(e, category)}
            className={`group flex items-center justify-between p-3 rounded-lg cursor-pointer transition-all duration-200 ${
              selectedCategoryId === category.id
                ? 'text-white shadow-lg'
                : 'text-white/80 hover:text-white hover:bg-white/10'
            } ${
              draggedCategoryId === category.id ? 'opacity-50 scale-95' : ''
            } ${
              dragOverCategoryId === category.id ? 'bg-white/20 scale-105' : ''
            }`}
            style={{
              backgroundColor: selectedCategoryId === category.id ? category.color : undefined
            }}
          >
            <div className="flex items-center space-x-3 flex-1">
              <GripVertical className="h-4 w-4 text-white/40 group-hover:text-white/60" />
              <span className="text-lg">{category.icon}</span>
              <span className="text-sm font-medium truncate">{category.name}</span>
            </div>
            
            <div className="flex items-center space-x-1">
              <Badge variant="secondary" className="h-5 px-2 text-xs bg-white/20 text-white">
                {category.bookmarks.length}
              </Badge>
              
              <Button
                onClick={(e) => handleEditClick(e, category)}
                size="sm"
                variant="ghost"
                className="opacity-0 group-hover:opacity-100 text-white/60 hover:text-white hover:bg-white/20 h-6 w-6 p-0"
              >
                <Edit className="h-3 w-3" />
              </Button>
              
              <Button
                onClick={(e) => handleDeleteClick(e, category.id)}
                size="sm"
                variant="ghost"
                className="opacity-0 group-hover:opacity-100 text-white/60 hover:text-red-400 hover:bg-white/20 h-6 w-6 p-0"
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}