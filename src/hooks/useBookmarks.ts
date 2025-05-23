/**
 * 书签管理相关的React Hook
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import type { Bookmark, BookmarkCategory, NetworkMode, OperationResult } from '../types';
import { 
  loadBookmarks, 
  saveBookmarks, 
  loadCategories,
  saveCategories
} from '../utils/storage';
import {
  migrateBookmarksToUniqueIds,
  getBookmarkById,
  getBookmarksWithCategories,
  getBookmarksByCategory,
  getUncategorizedBookmarks,
  addBookmarkToCategory,
  removeBookmarkFromCategory,
  getCategoriesByBookmarkId,
  addBookmarks,
  deleteBookmarks,
  searchBookmarks as searchBookmarksUtil,
  sortBookmarks,
  createBookmark
} from '../utils/bookmark-utils';

/**
 * 书签管理Hook
 */
export function useBookmarks() {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // 加载书签
  const loadBookmarkList = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      // 先进行迁移，确保所有书签都有ID
      const migrateResult = await migrateBookmarksToUniqueIds();
      if (migrateResult.success && migrateResult.data) {
        setBookmarks(migrateResult.data);
      } else {
        setError(migrateResult.error || '加载书签失败');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '未知错误');
    } finally {
      setLoading(false);
    }
  }, []);

  // 添加书签
  const addBookmark = useCallback(async (
    title: string,
    url: string,
    options?: {
      internalUrl?: string;
      externalUrl?: string;
      icon?: string;
      iconType?: 'official' | 'text' | 'upload';
      iconText?: string;
      iconColor?: string;
      backgroundColor?: string;
    }
  ) => {
    setSaving(true);
    setError(null);
    
    try {
      const newBookmark = createBookmark(title, url, options);
      const updatedBookmarks = [...bookmarks, newBookmark];
      
      const result = await saveBookmarks(updatedBookmarks);
      if (result.success) {
        setBookmarks(updatedBookmarks);
        return { success: true, data: newBookmark };
      } else {
        setError(result.error || '添加书签失败');
        return { success: false, error: result.error };
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : '未知错误';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setSaving(false);
    }
  }, [bookmarks]);

  // 更新书签
  const updateBookmark = useCallback(async (
    bookmarkId: string,
    updates: Partial<Omit<Bookmark, 'id' | 'createdAt' | 'updatedAt'>>
  ) => {
    setSaving(true);
    setError(null);
    
    try {
      const updatedBookmarks = bookmarks.map(bookmark => 
        bookmark.id === bookmarkId 
          ? { ...bookmark, ...updates, updatedAt: Date.now() }
          : bookmark
      );
      
      const result = await saveBookmarks(updatedBookmarks);
      if (result.success) {
        setBookmarks(updatedBookmarks);
        const updatedBookmark = updatedBookmarks.find(b => b.id === bookmarkId);
        return { success: true, data: updatedBookmark };
      } else {
        setError(result.error || '更新书签失败');
        return { success: false, error: result.error };
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : '未知错误';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setSaving(false);
    }
  }, [bookmarks]);

  // 删除书签
  const deleteBookmark = useCallback(async (bookmarkId: string) => {
    setSaving(true);
    setError(null);
    
    try {
      const result = await deleteBookmarks([bookmarkId]);
      if (result.success) {
        setBookmarks(prev => prev.filter(b => b.id !== bookmarkId));
        return { success: true };
      } else {
        setError(result.error || '删除书签失败');
        return { success: false, error: result.error };
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : '未知错误';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setSaving(false);
    }
  }, []);

  // 批量删除书签
  const deleteMultipleBookmarks = useCallback(async (bookmarkIds: string[]) => {
    setSaving(true);
    setError(null);
    
    try {
      const result = await deleteBookmarks(bookmarkIds);
      if (result.success) {
        setBookmarks(prev => prev.filter(b => !bookmarkIds.includes(b.id)));
        return { success: true };
      } else {
        setError(result.error || '批量删除书签失败');
        return { success: false, error: result.error };
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : '未知错误';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setSaving(false);
    }
  }, []);

  // 批量更新书签（用于拖拽重排序）
  const updateMultipleBookmarks = useCallback(async (updatedBookmarks: Bookmark[]) => {
    setSaving(true);
    setError(null);
    
    try {
      const result = await saveBookmarks(updatedBookmarks);
      if (result.success) {
        setBookmarks(updatedBookmarks);
        return { success: true, data: updatedBookmarks };
      } else {
        setError(result.error || '批量更新书签失败');
        return { success: false, error: result.error };
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : '未知错误';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setSaving(false);
    }
  }, []);

  // 重排序书签（拖拽功能）
  const reorderBookmarks = useCallback(async (newBookmarkOrder: Bookmark[]) => {
    setSaving(true);
    setError(null);
    
    try {
      // 确保所有书签都有正确的position和updatedAt
      const reorderedBookmarks = newBookmarkOrder.map((bookmark, index) => ({
        ...bookmark,
        position: index,
        updatedAt: Date.now()
      }));
      
      const result = await saveBookmarks(reorderedBookmarks);
      if (result.success) {
        setBookmarks(reorderedBookmarks);
        return { success: true, data: reorderedBookmarks };
      } else {
        setError(result.error || '重排序书签失败');
        return { success: false, error: result.error };
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : '未知错误';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setSaving(false);
    }
  }, []);

  // 获取单个书签
  const getBookmark = useCallback(async (bookmarkId: string) => {
    const result = await getBookmarkById(bookmarkId);
    if (!result.success) {
      setError(result.error || '获取书签失败');
    }
    return result;
  }, []);

  useEffect(() => {
    loadBookmarkList();
  }, [loadBookmarkList]);

  return {
    bookmarks,
    loading,
    error,
    saving,
    addBookmark,
    updateBookmark,
    deleteBookmark,
    deleteMultipleBookmarks,
    updateMultipleBookmarks,
    reorderBookmarks,
    getBookmark,
    reload: loadBookmarkList
  };
}

/**
 * 书签搜索Hook
 */
export function useBookmarkSearch(bookmarks: Bookmark[]) {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'title' | 'createdAt' | 'updatedAt'>('title');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // 搜索和排序后的书签
  const filteredBookmarks = useMemo(() => {
    let result = bookmarks;

    // 搜索过滤
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      result = result.filter(bookmark =>
        bookmark.title.toLowerCase().includes(query) ||
        bookmark.url.toLowerCase().includes(query) ||
        (bookmark.internalUrl && bookmark.internalUrl.toLowerCase().includes(query)) ||
        (bookmark.externalUrl && bookmark.externalUrl.toLowerCase().includes(query))
      );
    }

    // 排序
    result = sortBookmarks(result, sortBy, sortOrder);

    return result;
  }, [bookmarks, searchQuery, sortBy, sortOrder]);

  return {
    searchQuery,
    setSearchQuery,
    sortBy,
    setSortBy,
    sortOrder,
    setSortOrder,
    filteredBookmarks,
    resultsCount: filteredBookmarks.length
  };
}

/**
 * 书签分类关联Hook
 */
export function useBookmarkCategories() {
  const [categories, setCategories] = useState<BookmarkCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 加载分类
  const loadCategoryList = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await loadCategories();
      if (result.success && result.data) {
        setCategories(result.data);
      } else {
        setError(result.error || '加载分类失败');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '未知错误');
    } finally {
      setLoading(false);
    }
  }, []);

  // 获取分类中的书签
  const getBookmarksInCategory = useCallback(async (categoryId: string) => {
    const result = await getBookmarksByCategory(categoryId);
    if (!result.success) {
      setError(result.error || '获取分类书签失败');
    }
    return result;
  }, []);

  // 获取未分类的书签
  const getUncategorizedBookmarkList = useCallback(async () => {
    const result = await getUncategorizedBookmarks();
    if (!result.success) {
      setError(result.error || '获取未分类书签失败');
    }
    return result;
  }, []);

  // 添加书签到分类
  const addBookmarkToCategoryAction = useCallback(async (categoryId: string, bookmarkId: string) => {
    setError(null);
    
    try {
      const result = await addBookmarkToCategory(categoryId, bookmarkId);
      if (result.success) {
        // 更新本地分类状态
        setCategories(prev => 
          prev.map(cat => 
            cat.id === categoryId ? result.data! : cat
          )
        );
        return { success: true };
      } else {
        setError(result.error || '添加书签到分类失败');
        return { success: false, error: result.error };
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : '未知错误';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    }
  }, []);

  // 从分类中移除书签
  const removeBookmarkFromCategoryAction = useCallback(async (categoryId: string, bookmarkId: string) => {
    setError(null);
    
    try {
      const result = await removeBookmarkFromCategory(categoryId, bookmarkId);
      if (result.success) {
        // 更新本地分类状态
        setCategories(prev => 
          prev.map(cat => 
            cat.id === categoryId ? result.data! : cat
          )
        );
        return { success: true };
      } else {
        setError(result.error || '从分类中移除书签失败');
        return { success: false, error: result.error };
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : '未知错误';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    }
  }, []);

  // 获取书签所属分类
  const getBookmarkCategories = useCallback(async (bookmarkId: string) => {
    const result = await getCategoriesByBookmarkId(bookmarkId);
    if (!result.success) {
      setError(result.error || '获取书签分类失败');
    }
    return result;
  }, []);

  useEffect(() => {
    loadCategoryList();
  }, [loadCategoryList]);

  return {
    categories,
    loading,
    error,
    getBookmarksInCategory,
    getUncategorizedBookmarkList,
    addBookmarkToCategory: addBookmarkToCategoryAction,
    removeBookmarkFromCategory: removeBookmarkFromCategoryAction,
    getBookmarkCategories,
    reload: loadCategoryList
  };
}
