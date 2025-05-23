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
  }, [])  // 添加书签 - 新的API接口
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
  }, [bookmarks]);  // 重排序书签（拖拽功能）
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
    reorderBookmarks,
    reload: loadBookmarkList
  };
}