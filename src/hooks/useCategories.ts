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
import { createBookmarkCategory } from '@/models/BookmarkCategory'
import { loadBookmarks, saveBookmarks } from '@/utils/storage'

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

      // 清除缓存，确保获取最新数据
      const { clearCache } = await import('@/utils/storage');
      clearCache();

      const result = await loadCategories()

      if (result.success) {
        let categoriesData = result.data || []

        // 如果没有分类，创建默认分类
        if (categoriesData.length === 0) {
          const defaultCategory = createBookmarkCategory('默认分类', '📁', '#3B82F6')
          const saveResult = await saveCategories([defaultCategory])
          if (saveResult.success) {
            categoriesData = [defaultCategory]
          }
        }

        setCategories(categoriesData)
      } else {
        setError(result.error || '加载分类失败')
        setCategories([])
      }
    } catch (err) {
      setError('加载分类数据失败')
      setCategories([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadCategoriesData()
  }, [loadCategoriesData])

  // 监听存储变化，自动重新加载分类
  useEffect(() => {

    const handleStorageChange = (changes: { [key: string]: chrome.storage.StorageChange }, areaName: string) => {
      if (areaName === 'local' && changes.categories) {
        loadCategoriesData();
      }
    };

    // 监听来自background script的存储变化消息
    const handleRuntimeMessage = (message: any, _sender: any, _sendResponse: any) => {
      if (message.action === 'storage_changed' && message.data?.changes) {
        const changes = message.data.changes;
        if (changes.includes('categories')) {
          loadCategoriesData();
        } else {
        }
      }
      return false; // 不需要异步响应
    };

    // 添加存储变化监听器
    chrome.storage.onChanged.addListener(handleStorageChange);

    // 添加runtime消息监听器
    chrome.runtime.onMessage.addListener(handleRuntimeMessage);

    // 清理函数
    return () => {
      chrome.storage.onChanged.removeListener(handleStorageChange);
      chrome.runtime.onMessage.removeListener(handleRuntimeMessage);
    };
  }, [loadCategoriesData]);

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
      return { success: false, error: '更新分类失败' }
    }
  }, [loadCategoriesData])

  // 删除分类
  const handleDeleteCategory = useCallback(async (id: string): Promise<OperationResult<void>> => {
    try {
      // 检查是否是最后一个分类
      if (categories.length <= 1) {
        return { success: false, error: '不能删除最后一个分类' }
      }
      
      // 先获取要删除的分类信息
      const categoryToDelete = categories.find(cat => cat.id === id)
      if (!categoryToDelete) {
        return { success: false, error: '分类不存在' }
      }
      
      // 删除分类中的所有书签
      if (categoryToDelete.bookmarks.length > 0) {
        const bookmarksResult = await loadBookmarks()
        if (bookmarksResult.success) {
          const allBookmarks = bookmarksResult.data || []
          const updatedBookmarks = allBookmarks.filter(bookmark => 
            !categoryToDelete.bookmarks.includes(bookmark.id)
          )
          await saveBookmarks(updatedBookmarks)
        }
      }
      
      // 删除分类
      const result = await deleteCategory(id)
      if (result.success) {
        await loadCategoriesData()
      }
      return result
    } catch (err) {
      return { success: false, error: '删除分类失败' }
    }
  }, [loadCategoriesData, categories])

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