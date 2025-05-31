/**
 * 书签管理器Hook
 * 整合书签的CRUD操作和显示逻辑
 */

import { useState, useCallback, useMemo, useEffect } from 'react';
import { useBookmarks } from '@/hooks';
import { useBookmarkDisplay } from '@/hooks/bookmarks';
import type { Bookmark, NetworkMode } from '@/types';
import type { BookmarkSettings } from '@/types/settings';
import type { BookmarkDisplayStyle } from '@/types/bookmark-display.types';
import { BOOKMARK_DISPLAY_STYLES } from '@/constants';
import { filterAndSortBookmarks, generateBookmarkStats } from '@/utils/bookmark-display.utils';

interface UseBookmarkManagerProps {
  networkMode: NetworkMode;
  bookmarkSettings: BookmarkSettings;
  displayStyle?: BookmarkDisplayStyle;
  borderRadius?: number;
  categoryId?: string;
  searchQuery?: string;
}

interface UseBookmarkManagerReturn {
  // 书签数据
  bookmarks: Bookmark[];
  filteredBookmarks: Bookmark[];
  isLoading: boolean;
  error: string | null;
  
  // 统计信息
  stats: ReturnType<typeof generateBookmarkStats>;
  
  // 显示配置
  displayConfig: ReturnType<typeof useBookmarkDisplay>['displayConfig'];
  
  // 操作方法
  addBookmark: (bookmark: Omit<Bookmark, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateBookmark: (id: string, updates: Partial<Bookmark>) => Promise<void>;
  deleteBookmark: (id: string) => Promise<void>;
  reorderBookmarks: (newOrder: Bookmark[]) => Promise<void>;
  
  // 批量操作
  deleteSelectedBookmarks: (ids: string[]) => Promise<void>;
  exportBookmarks: (bookmarks?: Bookmark[]) => string;
  importBookmarks: (data: string) => Promise<void>;
  
  // 搜索和过滤
  updateSearchQuery: (query: string) => void;
  updateCategoryFilter: (categoryId: string | undefined) => void;
  clearFilters: () => void;
  
  // 选择状态
  selectedBookmarkIds: string[];
  selectBookmark: (id: string) => void;
  deselectBookmark: (id: string) => void;
  selectAllBookmarks: () => void;
  clearSelection: () => void;
  toggleBookmarkSelection: (id: string) => void;
}

export const useBookmarkManager = ({
  networkMode,
  bookmarkSettings,
  displayStyle = BOOKMARK_DISPLAY_STYLES.DETAILED,
  borderRadius = 8,
  categoryId,
  searchQuery: initialSearchQuery = '',
}: UseBookmarkManagerProps): UseBookmarkManagerReturn => {
  // 基础数据和操作
  const {
    bookmarks,
    isLoading,
    error,
    addBookmark: addBookmarkBase,
    updateBookmark: updateBookmarkBase,
    deleteBookmark: deleteBookmarkBase,
    reorderBookmarks: reorderBookmarksBase,
  } = useBookmarks();

  // 显示相关
  const { displayConfig } = useBookmarkDisplay({
    displayStyle,
    bookmarkSettings,
    borderRadius,
  });

  // 本地状态
  const [searchQuery, setSearchQuery] = useState(initialSearchQuery);
  const [categoryFilter, setCategoryFilter] = useState<string | undefined>(categoryId);
  const [selectedBookmarkIds, setSelectedBookmarkIds] = useState<string[]>([]);

  // 过滤后的书签
  const filteredBookmarks = useMemo(() => {
    return filterAndSortBookmarks(bookmarks, {
      search: searchQuery,
      categoryId: categoryFilter,
    });
  }, [bookmarks, searchQuery, categoryFilter]);

  // 统计信息
  const stats = useMemo(() => {
    return generateBookmarkStats(filteredBookmarks);
  }, [filteredBookmarks]);

  // 同步外部传入的过滤条件
  useEffect(() => {
    if (categoryId !== categoryFilter) {
      setCategoryFilter(categoryId);
    }
  }, [categoryId, categoryFilter]);

  // 书签操作方法
  const addBookmark = useCallback(async (bookmark: Omit<Bookmark, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      await addBookmarkBase({
        ...bookmark,
        id: `bookmark_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    } catch (error) {
      console.error('添加书签失败:', error);
      throw error;
    }
  }, [addBookmarkBase]);

  const updateBookmark = useCallback(async (id: string, updates: Partial<Bookmark>) => {
    try {
      await updateBookmarkBase(id, {
        ...updates,
        updatedAt: Date.now(),
      });
    } catch (error) {
      console.error('更新书签失败:', error);
      throw error;
    }
  }, [updateBookmarkBase]);

  const deleteBookmark = useCallback(async (id: string) => {
    try {
      await deleteBookmarkBase(id);
      // 从选择列表中移除
      setSelectedBookmarkIds(prev => prev.filter(selectedId => selectedId !== id));
    } catch (error) {
      console.error('删除书签失败:', error);
      throw error;
    }
  }, [deleteBookmarkBase]);

  const reorderBookmarks = useCallback(async (newOrder: Bookmark[]) => {
    try {
      // 更新位置信息
      const updatedBookmarks = newOrder.map((bookmark, index) => ({
        ...bookmark,
        position: index,
        updatedAt: Date.now(),
      }));
      
      await reorderBookmarksBase(updatedBookmarks);
    } catch (error) {
      console.error('重新排序失败:', error);
      throw error;
    }
  }, [reorderBookmarksBase]);

  // 批量操作
  const deleteSelectedBookmarks = useCallback(async (ids: string[]) => {
    try {
      await Promise.all(ids.map(id => deleteBookmarkBase(id)));
      setSelectedBookmarkIds([]);
    } catch (error) {
      console.error('批量删除失败:', error);
      throw error;
    }
  }, [deleteBookmarkBase]);

  const exportBookmarks = useCallback((bookmarksToExport?: Bookmark[]): string => {
    const dataToExport = bookmarksToExport || filteredBookmarks;
    return JSON.stringify({
      bookmarks: dataToExport,
      exportDate: new Date().toISOString(),
      version: '2.0',
    }, null, 2);
  }, [filteredBookmarks]);

  const importBookmarks = useCallback(async (data: string) => {
    try {
      const parsed = JSON.parse(data);
      const bookmarksToImport = parsed.bookmarks || [];
      
      for (const bookmark of bookmarksToImport) {
        await addBookmark({
          ...bookmark,
          // 重新生成ID避免冲突
          id: undefined,
        });
      }
    } catch (error) {
      console.error('导入书签失败:', error);
      throw new Error('导入数据格式无效');
    }
  }, [addBookmark]);

  // 搜索和过滤
  const updateSearchQuery = useCallback((query: string) => {
    setSearchQuery(query);
  }, []);

  const updateCategoryFilter = useCallback((categoryId: string | undefined) => {
    setCategoryFilter(categoryId);
  }, []);

  const clearFilters = useCallback(() => {
    setSearchQuery('');
    setCategoryFilter(undefined);
  }, []);

  // 选择操作
  const selectBookmark = useCallback((id: string) => {
    setSelectedBookmarkIds(prev => prev.includes(id) ? prev : [...prev, id]);
  }, []);

  const deselectBookmark = useCallback((id: string) => {
    setSelectedBookmarkIds(prev => prev.filter(selectedId => selectedId !== id));
  }, []);

  const selectAllBookmarks = useCallback(() => {
    setSelectedBookmarkIds(filteredBookmarks.map(bookmark => bookmark.id));
  }, [filteredBookmarks]);

  const clearSelection = useCallback(() => {
    setSelectedBookmarkIds([]);
  }, []);

  const toggleBookmarkSelection = useCallback((id: string) => {
    setSelectedBookmarkIds(prev => 
      prev.includes(id) 
        ? prev.filter(selectedId => selectedId !== id)
        : [...prev, id]
    );
  }, []);

  return {
    // 书签数据
    bookmarks,
    filteredBookmarks,
    isLoading,
    error,
    
    // 统计信息
    stats,
    
    // 显示配置
    displayConfig,
    
    // 操作方法
    addBookmark,
    updateBookmark,
    deleteBookmark,
    reorderBookmarks,
    
    // 批量操作
    deleteSelectedBookmarks,
    exportBookmarks,
    importBookmarks,
    
    // 搜索和过滤
    updateSearchQuery,
    updateCategoryFilter,
    clearFilters,
    
    // 选择状态
    selectedBookmarkIds,
    selectBookmark,
    deselectBookmark,
    selectAllBookmarks,
    clearSelection,
    toggleBookmarkSelection,
  };
};

export default useBookmarkManager;
