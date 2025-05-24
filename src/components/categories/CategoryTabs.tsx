import React, { useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Plus, Filter, X } from 'lucide-react'
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
      onCategorySelect(null)
    } else {
      onCategorySelect(categoryId)
    }
  }, [selectedCategoryId, onCategorySelect])

  if (loading) {
    return (
      <div className={`${isGlassEffect ? 'bg-white/10 backdrop-blur-md' : 'bg-black/20'} rounded-lg p-4 border border-white/20`}>
        <div className="flex items-center space-x-2">
          <div className="h-8 w-16 bg-white/20 rounded animate-pulse" />
        </div>
      </div>
    )
  }  return (
    <div className={`${isGlassEffect ? 'bg-white/10 backdrop-blur-md' : 'bg-black/20'} rounded-lg p-4 border border-white/20`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <Filter className="h-4 w-4 text-white/80" />
          <span className="text-sm font-medium text-white/90">分类筛选</span>
        </div>
        
        <Button
          onClick={onAddCategory}
          size="sm"
          variant="ghost"
          className="text-white/80 hover:text-white hover:bg-white/20 h-8 px-2"
        >
          <Plus className="h-3 w-3 mr-1" />
          <span className="text-xs">添加分类</span>
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {/* 全部分类按钮 */}
        <Button
          onClick={() => onCategorySelect(null)}
          size="sm"
          variant={selectedCategoryId === null ? "default" : "ghost"}
          className={`h-8 px-3 text-xs ${
            selectedCategoryId === null
              ? 'bg-blue-500 text-white hover:bg-blue-600'
              : 'text-white/80 hover:text-white hover:bg-white/20'
          }`}
        >
          全部
          <Badge variant="secondary" className="ml-1 h-4 px-1 text-xs bg-white/20 text-white">
            {categories.reduce((total, cat) => total + cat.bookmarks.length, 0)}
          </Badge>
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
            <Badge variant="secondary" className="ml-1 h-4 px-1 text-xs bg-white/20 text-white">
              {category.bookmarks.length}
            </Badge>
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