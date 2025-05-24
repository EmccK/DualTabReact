import { useState, useEffect, useCallback } from 'react'
import type { BookmarkCategory, OperationResult } from '@/types'
import { 
  loadCategories, 
  saveCategories, 
  addCategory, 
  updateCategory, 
  deleteCategory,
  reorderCategories 
} from '@/utils/storage'

interface UseCategoriesReturn {
  categories: BookmarkCategory[]
  loading: boolean
  error: string | null
  addCategory: (category: Omit<BookmarkCategory, 'id' | 'createdAt' | 'updatedAt'>) => Promise<OperationResult<BookmarkCategory>>
  updateCategory: (id: string, updates: Partial<BookmarkCategory>) => Promise<OperationResult<BookmarkCategory>>
  deleteCategory: (id: string) => Promise<OperationResult<void>>
  reorderCategories: (reorderedCategories: BookmarkCategory[]) => Promise<OperationResult<void>>
  reload: () => Promise<void>
}

export function useCategories(): UseCategoriesReturn {
  const [categories, setCategories] = useState<BookmarkCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadCategoriesData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      const result = await loadCategories()
      if (result.success) {
        setCategories(result.data || [])
      } else {
        setError(result.error || '加载分类失败')
        setCategories([])
      }
    } catch (err) {
      console.error('加载分类数据失败:', err)
      setError('加载分类数据失败')
      setCategories([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadCategoriesData()
  }, [loadCategoriesData])

  // 添加分类
  const handleAddCategory = useCallback(async (
    categoryData: Omit<BookmarkCategory, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<OperationResult<BookmarkCategory>> => {
    try {
      const result = await addCategory(categoryData)
      if (result.success) {
        await loadCategoriesData()
      }
      return result
    } catch (err) {
      console.error('添加分类失败:', err)
      return { success: false, error: '添加分类失败' }
    }
  }, [loadCategoriesData])

  // 更新分类
  const handleUpdateCategory = useCallback(async (
    id: string, 
    updates: Partial<BookmarkCategory>
  ): Promise<OperationResult<BookmarkCategory>> => {
    try {
      const result = await updateCategory(id, updates)
      if (result.success) {
        await loadCategoriesData()
      }
      return result
    } catch (err) {
      console.error('更新分类失败:', err)
      return { success: false, error: '更新分类失败' }
    }
  }, [loadCategoriesData])

  // 删除分类
  const handleDeleteCategory = useCallback(async (id: string): Promise<OperationResult<void>> => {
    try {
      const result = await deleteCategory(id)
      if (result.success) {
        await loadCategoriesData()
      }
      return result
    } catch (err) {
      console.error('删除分类失败:', err)
      return { success: false, error: '删除分类失败' }
    }
  }, [loadCategoriesData])

  // 重排序分类
  const handleReorderCategories = useCallback(async (
    reorderedCategories: BookmarkCategory[]
  ): Promise<OperationResult<void>> => {
    try {
      setCategories(reorderedCategories)
      const result = await reorderCategories(reorderedCategories)
      if (!result.success) {
        await loadCategoriesData()
      }
      return result
    } catch (err) {
      console.error('重排序分类失败:', err)
      await loadCategoriesData()
      return { success: false, error: '重排序分类失败' }
    }
  }, [loadCategoriesData])

  return {
    categories,
    loading,
    error,
    addCategory: handleAddCategory,
    updateCategory: handleUpdateCategory,
    deleteCategory: handleDeleteCategory,
    reorderCategories: handleReorderCategories,
    reload: loadCategoriesData
  }
}