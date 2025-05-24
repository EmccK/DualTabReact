import { useMemo } from 'react';
import type { Bookmark, BookmarkCategory } from '../types';

/**
 * 处理书签和分类关联的Hook
 */
export function useBookmarkCategories(bookmarks: Bookmark[], categories: BookmarkCategory[]) {
  // 获取指定分类的书签
  const getBookmarksByCategory = useMemo(() => {
    return (categoryId: string | null) => {
      if (!categoryId) {
        return bookmarks;
      }
      
      const category = categories.find(cat => cat.id === categoryId);
      if (!category) {
        return [];
      }
      
      // 根据分类的bookmarks数组筛选书签
      return bookmarks.filter(bookmark => 
        category.bookmarks.includes(bookmark.id)
      );
    };
  }, [bookmarks, categories]);

  // 获取未分类的书签
  const getUncategorizedBookmarks = useMemo(() => {
    const categorizedBookmarkIds = new Set<string>();
    categories.forEach(category => {
      category.bookmarks.forEach(bookmarkId => {
        categorizedBookmarkIds.add(bookmarkId);
      });
    });
    
    return bookmarks.filter(bookmark => 
      !categorizedBookmarkIds.has(bookmark.id)
    );
  }, [bookmarks, categories]);

  // 获取书签所属的分类
  const getBookmarkCategories = useMemo(() => {
    return (bookmarkId: string) => {
      return categories.filter(category => 
        category.bookmarks.includes(bookmarkId)
      );
    };
  }, [categories]);

  // 检查书签是否属于某个分类
  const isBookmarkInCategory = useMemo(() => {
    return (bookmarkId: string, categoryId: string) => {
      const category = categories.find(cat => cat.id === categoryId);
      return category ? category.bookmarks.includes(bookmarkId) : false;
    };
  }, [categories]);

  return {
    getBookmarksByCategory,
    getUncategorizedBookmarks,
    getBookmarkCategories,
    isBookmarkInCategory
  };
}
