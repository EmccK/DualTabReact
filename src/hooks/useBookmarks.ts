import { useState, useEffect, useCallback } from 'react';
import type { Bookmark, OperationResult } from '../types';
import { 
  loadBookmarks, 
  saveBookmarks, 
  loadCategories,
  saveCategories
} from '../utils/storage';
import {
  migrateBookmarksToUniqueIds,
  addBookmarkToCategory,
  createBookmark
} from '../utils/bookmark-utils';

export function useBookmarks() {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const loadBookmarkList = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
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

  // 添加书签 - 新的API接口
  const addBookmark = useCallback(async (
    bookmarkData: Omit<Bookmark, 'id' | 'createdAt' | 'updatedAt' | 'position'>
  ) => {
    setSaving(true);
    setError(null);
    
    try {
      const newBookmark = createBookmark(
        bookmarkData.name || bookmarkData.title,
        bookmarkData.url,
        {
          categoryId: bookmarkData.categoryId,
          internalUrl: bookmarkData.internalUrl,
          externalUrl: bookmarkData.externalUrl,
          description: bookmarkData.description,
          iconType: bookmarkData.iconType,
          iconText: bookmarkData.iconText,
          iconData: bookmarkData.iconData,
          backgroundColor: bookmarkData.backgroundColor
        }
      );
      
      const updatedBookmarks = [...bookmarks, newBookmark];
      
      const result = await saveBookmarks(updatedBookmarks);
      if (result.success) {
        setBookmarks(updatedBookmarks);
        
        // 如果有categoryId，将书签添加到对应分类
        if (bookmarkData.categoryId) {
          try {
            await addBookmarkToCategory(bookmarkData.categoryId, newBookmark.id);
            console.log(`书签已添加到分类 ${bookmarkData.categoryId}`);
          } catch (categoryError) {
            console.warn('添加书签到分类时出错:', categoryError);
          }
        }
        
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
      const updatedBookmarks = bookmarks.filter(bookmark => bookmark.id !== bookmarkId);
      
      const result = await saveBookmarks(updatedBookmarks);
      if (result.success) {
        setBookmarks(updatedBookmarks);
        
        // 同时从所有分类中移除该书签
        try {
          const categoriesResult = await loadCategories();
          if (categoriesResult.success) {
            const categories = categoriesResult.data || [];
            const updatedCategories = categories.map(category => ({
              ...category,
              bookmarks: category.bookmarks.filter(id => id !== bookmarkId),
              updatedAt: Date.now()
            }));
            await saveCategories(updatedCategories);
          }
        } catch (categoryError) {
          console.warn('从分类中移除书签时出错:', categoryError);
        }
        
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
  }, [bookmarks]);

  // 重排序书签（拖拽功能）
  const reorderBookmarks = useCallback(async (newBookmarkOrder: Bookmark[]) => {
    setSaving(true);
    setError(null);
    
    try {
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
    reorderBookmarks,
    reload: loadBookmarkList
  };
}
