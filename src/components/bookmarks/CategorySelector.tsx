import React, { useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Plus, Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { theme } from '@/styles/theme'
import type { BookmarkCategory } from '@/types'

interface CategorySelectorProps {
  selectedCategories: string[]
  onCategoriesChange: (categories: string[]) => void
  availableCategories?: BookmarkCategory[]
  className?: string
}

export function CategorySelector({
  selectedCategories,
  onCategoriesChange,
  availableCategories,
  className
}: CategorySelectorProps) {
  const [showAddCategory, setShowAddCategory] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState('')

  const handleCategoryToggle = useCallback((categoryName: string) => {
    const isSelected = selectedCategories.includes(categoryName)
    if (isSelected) {
      onCategoriesChange(selectedCategories.filter(cat => cat !== categoryName))
    } else {
      onCategoriesChange([...selectedCategories, categoryName])
    }
  }, [selectedCategories, onCategoriesChange])

  const handleAddCategoryClick = useCallback(() => {
    setShowAddCategory(!showAddCategory)
    setNewCategoryName('')
  }, [showAddCategory])

  const handleNewCategoryChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setNewCategoryName(e.target.value)
  }, [])

  const handleAddCategoryConfirm = useCallback(() => {
    const trimmedName = newCategoryName.trim()
    if (trimmedName && !selectedCategories.includes(trimmedName)) {
      onCategoriesChange([...selectedCategories, trimmedName])
    }
    setShowAddCategory(false)
    setNewCategoryName('')
  }, [newCategoryName, selectedCategories, onCategoriesChange])

  const handleAddCategoryCancel = useCallback(() => {
    setShowAddCategory(false)
    setNewCategoryName('')
  }, [])

  return (
    <div className={cn("space-y-2", className)}>
      {/* 真实分类 - 紧凑的网格布局 */}
      {availableCategories && availableCategories.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {availableCategories.map((category) => {
            const isSelected = selectedCategories.includes(category.name)
            return (
              <button
                key={category.name}
                type="button"
                onClick={() => handleCategoryToggle(category.name)}
                className={cn(
                  "h-10 flex items-center justify-center space-x-1 relative overflow-hidden rounded-md border-2 transition-all duration-200 hover:scale-105",
                  isSelected 
                    ? "border-[#4F46E5] bg-[#4F46E5]/10 text-[#4F46E5]"
                    : "border-[#E5E7EB] hover:border-[#4F46E5]/50 hover:bg-[#FAFBFC]/50"
                )}
                title={category.name}
                style={{
                  borderColor: isSelected ? category.color : undefined,
                  backgroundColor: isSelected ? `${category.color}20` : undefined,
                  color: isSelected ? category.color : undefined
                }}
              >
                <span className="text-sm">{category.icon}</span>
                <span className="text-xs font-medium">{category.name}</span>
                {isSelected && (
                  <div 
                    className="absolute top-0 right-0 w-3 h-3 rounded-bl-md flex items-center justify-center"
                    style={{ backgroundColor: category.color }}
                  >
                    <Check className="w-2 h-2 text-white" />
                  </div>
                )}
              </button>
            )
          })}
        </div>
      )}

      {/* 预设分类（当没有真实分类时显示） - 紧凑的网格布局 */}
      {(!availableCategories || availableCategories.length === 0) && (
        <div className="grid grid-cols-3 gap-2">
          {theme.categoryColors.map((category) => {
            const isSelected = selectedCategories.includes(category.name)
            return (
              <button
                key={category.name}
                type="button"
                onClick={() => handleCategoryToggle(category.name)}
                className={cn(
                  "h-10 flex items-center justify-center space-x-1 relative overflow-hidden rounded-md border-2 transition-all duration-200 hover:scale-105",
                  isSelected 
                    ? "border-[#4F46E5] bg-[#4F46E5]/10 text-[#4F46E5]"
                    : "border-[#E5E7EB] hover:border-[#4F46E5]/50 hover:bg-[#FAFBFC]/50"
                )}
                title={category.name}
              >
                <span className="text-sm">{category.icon}</span>
                <span className="text-xs font-medium">{category.name}</span>
                {isSelected && (
                  <div className="absolute top-0 right-0 w-3 h-3 bg-[#4F46E5] rounded-bl-md flex items-center justify-center">
                    <Check className="w-2 h-2 text-white" />
                  </div>
                )}
              </button>
            )
          })}
        </div>
      )}

      {/* 添加新分类 */}
      {!showAddCategory && (
        <button
          type="button"
          onClick={handleAddCategoryClick}
          className="w-full h-8 rounded-md border-2 border-dashed border-[#E5E7EB] hover:border-[#4F46E5]/50 transition-all duration-200 flex items-center justify-center space-x-1 text-[#4F46E5] hover:bg-[#FAFBFC]"
        >
          <Plus className="w-3 h-3" />
          <span className="text-xs font-medium">添加分类</span>
        </button>
      )}

      {/* 添加新分类输入 */}
      {showAddCategory && (
        <div className="flex items-center space-x-2 p-2 bg-[#FAFBFC] border border-[#E5E7EB] rounded-lg">
          <Input
            value={newCategoryName}
            onChange={handleNewCategoryChange}
            placeholder="分类名称"
            className="flex-1 h-8 text-xs border-[#E5E7EB] rounded"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleAddCategoryConfirm()
              } else if (e.key === 'Escape') {
                handleAddCategoryCancel()
              }
            }}
          />
          <Button
            type="button"
            onClick={handleAddCategoryConfirm}
            disabled={!newCategoryName.trim()}
            className="px-3 py-1 h-8 text-xs bg-[#4F46E5] hover:bg-indigo-700 text-white"
          >
            添加
          </Button>
          <button
            type="button"
            onClick={handleAddCategoryCancel}
            className="px-2 py-1 h-8 text-xs text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>
      )}

      {/* 已选择的分类 - 紧凑显示 */}
      {selectedCategories.length > 0 && (
        <div className="flex flex-wrap gap-1 pt-1">
          {selectedCategories.map((categoryName) => {
            // 先从真实分类中查找
            const realCategory = availableCategories?.find(c => c.name === categoryName)
            if (realCategory) {
              return (
                <div
                  key={categoryName}
                  className="inline-flex items-center space-x-1 border px-2 py-1 rounded-full text-xs font-medium"
                  style={{
                    backgroundColor: `${realCategory.color}20`,
                    borderColor: `${realCategory.color}40`,
                    color: realCategory.color
                  }}
                >
                  <span className="text-xs">{realCategory.icon}</span>
                  <span>{realCategory.name}</span>
                  <button
                    type="button"
                    onClick={() => handleCategoryToggle(categoryName)}
                    className="ml-1 hover:text-red-500 text-xs"
                    style={{ color: realCategory.color }}
                  >
                    ×
                  </button>
                </div>
              )
            }
            
            // 如果不是真实分类，可能是预设分类名称
            const categoryConfig = theme.categoryColors.find(c => c.name === categoryName)
            return (
              <div
                key={categoryName}
                className="inline-flex items-center space-x-1 bg-[#4F46E5]/10 text-[#4F46E5] border border-[#4F46E5]/20 px-2 py-1 rounded-full text-xs font-medium"
              >
                <span className="text-xs">{categoryConfig?.icon || '📌'}</span>
                <span>{categoryName}</span>
                <button
                  type="button"
                  onClick={() => handleCategoryToggle(categoryName)}
                  className="ml-1 text-[#4F46E5] hover:text-red-500 text-xs"
                >
                  ×
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}