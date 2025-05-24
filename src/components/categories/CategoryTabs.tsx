import React, { useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Plus, X } from 'lucide-react'
import type { BookmarkCategory } from '@/types'

interface CategoryTabsProps {
  categories: BookmarkCategory[]
  selectedCategoryId: string | null
  onCategorySelect: (categoryId: string | null) => void
  onAddCategory: () => void
  isGlassEffect?: boolean
  loading?: boolean
}

export function CategoryTabs({
  categories,
  selectedCategoryId,
  onCategorySelect,
  onAddCategory,
  isGlassEffect = true,
  loading = false
}: CategoryTabsProps) {
  const [showAllCategories, setShowAllCategories] = useState(false)
  
  const maxVisibleCategories = 6
  const visibleCategories = showAllCategories 
    ? categories 
    : categories.slice(0, maxVisibleCategories)
  const hasMoreCategories = categories.length > maxVisibleCategories

  const handleCategoryClick = useCallback((categoryId: string) => {
    if (selectedCategoryId === categoryId) {
      // 如果有多个分类，可以取消选择（显示第一个分类）
      // 否则保持当前选择
      if (categories.length > 1) {
        const firstCategory = categories.find(cat => cat.id !== categoryId)
        onCategorySelect(firstCategory?.id || categoryId)
      }
    } else {
      onCategorySelect(categoryId)
    }
  }, [selectedCategoryId, onCategorySelect, categories])

  if (loading) {
    return (
      <div className={`${isGlassEffect ? 'bg-white/10 backdrop-blur-md' : 'bg-black/20'} p-4`}>
        <div className="flex items-center space-x-2">
          <div className="h-8 w-16 bg-white/20 animate-pulse" />
        </div>
      </div>
    )
  }  return (
    <div className={`${isGlassEffect ? 'bg-white/10 backdrop-blur-md' : 'bg-black/20'} p-4`}>
      <div className="flex flex-wrap items-center gap-2">
        {/* 添加分类按钮 */}
        <Button
          onClick={onAddCategory}
          size="sm"
          variant="ghost"
          className="h-8 px-3 text-xs text-white/80 hover:text-white hover:bg-white/20"
        >
          <Plus className="h-3 w-3 mr-1" />
          添加分类
        </Button>

        {/* 分类标签 */}
        {visibleCategories.map((category) => (
          <Button
            key={category.id}
            onClick={() => handleCategoryClick(category.id)}
            size="sm"
            variant={selectedCategoryId === category.id ? "default" : "ghost"}
            className={`h-8 px-3 text-xs ${
              selectedCategoryId === category.id
                ? 'bg-blue-500 text-white hover:bg-blue-600'
                : 'text-white/80 hover:text-white hover:bg-white/20'
            }`}
            style={{
              backgroundColor: selectedCategoryId === category.id ? category.color : undefined
            }}
          >
            <span className="mr-1">{category.icon}</span>
            {category.name}
          </Button>
        ))}

        {/* 展开/收起按钮 */}
        {hasMoreCategories && (
          <Button
            onClick={() => setShowAllCategories(!showAllCategories)}
            size="sm"
            variant="ghost"
            className="text-white/60 hover:text-white hover:bg-white/20 h-8 px-2"
          >
            {showAllCategories ? (
              <>
                <X className="h-3 w-3 mr-1" />
                <span className="text-xs">收起</span>
              </>
            ) : (
              <>
                <Plus className="h-3 w-3 mr-1" />
                <span className="text-xs">更多 ({categories.length - maxVisibleCategories})</span>
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  )
}