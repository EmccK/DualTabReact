/**
 * 书签工具函数
 * 现代化TypeScript版本，包含完整的书签操作和分类管理
 */

import type { Bookmark, BookmarkCategory, NetworkMode, OperationResult } from '../types';
import { 
  loadBookmarks, 
  saveBookmarks, 
  loadCategories, 
  saveCategories 
} from './storage';
import { validateCategory } from '../models/BookmarkCategory';

/**
 * 生成书签唯一ID
 */
export function generateBookmarkId(): string {
  return `bm_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
}

/**
 * 创建新书签
 */
export function createBookmark(
  title: string,
  url: string,
  options: {
    internalUrl?: string;
    externalUrl?: string;
    description?: string;
    icon?: string;
    iconType?: 'official' | 'text' | 'upload';
    iconText?: string;
    iconData?: string;
    iconColor?: string;
    backgroundColor?: string;
    position?: number;
  } = {}
): Bookmark {
  const now = Date.now();
  
  return {
    id: generateBookmarkId(),
    name: title.trim(), // 添加name字段
    title: title.trim(),
    url: url.trim(),
    internalUrl: options.internalUrl?.trim() || '',
    externalUrl: options.externalUrl?.trim() || '',
    description: options.description?.trim() || '',
    icon: options.icon || '',
    iconType: options.iconType || 'official',
    iconText: options.iconText || '',
    iconData: options.iconData || '',
    iconColor: options.iconColor || '#3B82F6',
    backgroundColor: options.backgroundColor || '#FFFFFF',
    position: options.position,
    createdAt: now,
    updatedAt: now
  };
}

/**
 * 验证书签数据
 */
export function validateBookmark(bookmark: any): bookmark is Bookmark {
  if (!bookmark || typeof bookmark !== 'object') {
    return false;
  }

  // 检查必需字段
  const requiredFields = ['id', 'title', 'url', 'createdAt', 'updatedAt'];
  for (const field of requiredFields) {
    if (!(field in bookmark)) {
      return false;
    }
  }

  // 类型检查
  if (typeof bookmark.id !== 'string' || bookmark.id.trim() === '') {
    return false;
  }

  if (typeof bookmark.title !== 'string' || bookmark.title.trim() === '') {
    return false;
  }

  if (typeof bookmark.url !== 'string' || bookmark.url.trim() === '') {
    return false;
  }

  if (typeof bookmark.createdAt !== 'number' || bookmark.createdAt <= 0) {
    return false;
  }

  if (typeof bookmark.updatedAt !== 'number' || bookmark.updatedAt <= 0) {
    return false;
  }

  return true;
}

/**
 * 更新书签信息
 */
export function updateBookmark(
  bookmark: Bookmark,
  updates: Partial<Omit<Bookmark, 'id' | 'createdAt' | 'updatedAt'>>
): Bookmark {
  return {
    ...bookmark,
    ...updates,
    updatedAt: Date.now()
  };
}

/**
 * 获取书签的显示URL（根据网络模式）
 */
export function getBookmarkUrl(bookmark: Bookmark, networkMode: NetworkMode): string {
  if (networkMode === 'internal' && bookmark.internalUrl) {
    return bookmark.internalUrl;
  }
  
  if (networkMode === 'external' && bookmark.externalUrl) {
    return bookmark.externalUrl;
  }
  
  // 回退到默认URL
  return bookmark.url;
}

/**
 * 为现有书签数据迁移添加唯一ID
 */
export async function migrateBookmarksToUniqueIds(): Promise<OperationResult<Bookmark[]>> {
  try {
    const result = await loadBookmarks();
    if (!result.success) {
      return result;
    }

    const bookmarks = result.data || [];
    let hasChanges = false;

    // 检查并为每个书签添加唯一ID
    for (let i = 0; i < bookmarks.length; i++) {
      if (!bookmarks[i].id) {
        bookmarks[i].id = generateBookmarkId();
        hasChanges = true;
      }
    }

    // 如果有变更，保存书签
    if (hasChanges) {
      const saveResult = await saveBookmarks(bookmarks);
      if (!saveResult.success) {
        return saveResult;
      }
      console.log('书签迁移完成，已为所有书签添加唯一ID');
    }

    return { success: true, data: bookmarks };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : '书签迁移失败'
    };
  }
}

/**
 * 通过ID获取书签
 */
export async function getBookmarkById(bookmarkId: string): Promise<OperationResult<Bookmark | null>> {
  try {
    const result = await loadBookmarks();
    if (!result.success) {
      return result;
    }

    const bookmarks = result.data || [];
    const bookmark = bookmarks.find(b => b.id === bookmarkId);
    
    return { success: true, data: bookmark || null };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : '获取书签失败'
    };
  }
}

/**
 * 通过索引获取书签ID
 */
export async function getBookmarkIdByIndex(index: number): Promise<OperationResult<string | null>> {
  try {
    const result = await loadBookmarks();
    if (!result.success) {
      return result;
    }

    const bookmarks = result.data || [];
    if (index >= 0 && index < bookmarks.length) {
      return { success: true, data: bookmarks[index].id };
    }
    
    return { success: true, data: null };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : '获取书签ID失败'
    };
  }
}

/**
 * 通过ID获取书签索引
 */
export async function getBookmarkIndexById(bookmarkId: string): Promise<OperationResult<number>> {
  try {
    const result = await loadBookmarks();
    if (!result.success) {
      return { success: false, error: result.error };
    }

    const bookmarks = result.data || [];
    const index = bookmarks.findIndex(b => b.id === bookmarkId);
    
    return { success: true, data: index };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : '获取书签索引失败'
    };
  }
}

/**
 * 获取带分类信息的书签
 */
export async function getBookmarksWithCategories(): Promise<OperationResult<(Bookmark & { categories: Array<{ id: string; name: string; color: string }> })[]>> {
  try {
    const [bookmarksResult, categoriesResult] = await Promise.all([
      loadBookmarks(),
      loadCategories()
    ]);

    if (!bookmarksResult.success) {
      return bookmarksResult;
    }

    if (!categoriesResult.success) {
      return categoriesResult;
    }

    const bookmarks = bookmarksResult.data || [];
    const categories = categoriesResult.data || [];

    // 为每个书签添加所属分类信息
    const enhancedBookmarks = bookmarks.map(bookmark => {
      // 确保书签有ID
      if (!bookmark.id) {
        bookmark.id = generateBookmarkId();
      }

      // 查找书签所属的分类
      const bookmarkCategories = categories
        .filter(category => category.bookmarks.includes(bookmark.id))
        .map(cat => ({
          id: cat.id,
          name: cat.name,
          color: cat.color
        }));

      return {
        ...bookmark,
        categories: bookmarkCategories
      };
    });

    return { success: true, data: enhancedBookmarks };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : '获取书签分类信息失败'
    };
  }
}

/**
 * 按分类过滤书签
 */
export async function getBookmarksByCategory(categoryId: string): Promise<OperationResult<Bookmark[]>> {
  try {
    const [bookmarksResult, categoriesResult] = await Promise.all([
      loadBookmarks(),
      loadCategories()
    ]);

    if (!bookmarksResult.success) {
      return bookmarksResult;
    }

    if (!categoriesResult.success) {
      return categoriesResult;
    }

    const bookmarks = bookmarksResult.data || [];
    const categories = categoriesResult.data || [];

    // 找到指定分类
    const category = categories.find(cat => cat.id === categoryId);

    if (!category) {
      return {
        success: false,
        error: `找不到ID为 ${categoryId} 的分类`
      };
    }

    // 过滤出属于该分类的书签
    const categoryBookmarks = bookmarks.filter(bookmark =>
      bookmark.id && category.bookmarks.includes(bookmark.id)
    );

    return { success: true, data: categoryBookmarks };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : '按分类过滤书签失败'
    };
  }
}

/**
 * 获取未分类的书签
 */
export async function getUncategorizedBookmarks(): Promise<OperationResult<Bookmark[]>> {
  try {
    const [bookmarksResult, categoriesResult] = await Promise.all([
      loadBookmarks(),
      loadCategories()
    ]);

    if (!bookmarksResult.success) {
      return bookmarksResult;
    }

    if (!categoriesResult.success) {
      return categoriesResult;
    }

    const bookmarks = bookmarksResult.data || [];
    const categories = categoriesResult.data || [];

    // 收集所有已分类的书签ID
    const categorizedBookmarkIds = new Set<string>();
    categories.forEach(category => {
      category.bookmarks.forEach(bookmarkId => {
        categorizedBookmarkIds.add(bookmarkId);
      });
    });

    // 过滤出未分类的书签
    const uncategorizedBookmarks = bookmarks.filter(bookmark =>
      bookmark.id && !categorizedBookmarkIds.has(bookmark.id)
    );

    return { success: true, data: uncategorizedBookmarks };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : '获取未分类书签失败'
    };
  }
}

/**
 * 将书签添加到分类
 */
export async function addBookmarkToCategory(categoryId: string, bookmarkId: string): Promise<OperationResult<BookmarkCategory>> {
  try {
    const categoriesResult = await loadCategories();
    if (!categoriesResult.success) {
      return categoriesResult;
    }

    const categories = categoriesResult.data || [];
    const categoryIndex = categories.findIndex(cat => cat.id === categoryId);

    if (categoryIndex === -1) {
      return {
        success: false,
        error: `找不到ID为 ${categoryId} 的分类`
      };
    }

    // 检查书签是否已在分类中
    if (!categories[categoryIndex].bookmarks.includes(bookmarkId)) {
      categories[categoryIndex] = {
        ...categories[categoryIndex],
        bookmarks: [...categories[categoryIndex].bookmarks, bookmarkId],
        updatedAt: Date.now()
      };

      // 保存分类
      const saveResult = await saveCategories(categories);
      if (!saveResult.success) {
        return saveResult;
      }
    }

    return { success: true, data: categories[categoryIndex] };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : '添加书签到分类失败'
    };
  }
}

/**
 * 从分类中移除书签
 */
export async function removeBookmarkFromCategory(categoryId: string, bookmarkId: string): Promise<OperationResult<BookmarkCategory>> {
  try {
    const categoriesResult = await loadCategories();
    if (!categoriesResult.success) {
      return categoriesResult;
    }

    const categories = categoriesResult.data || [];
    const categoryIndex = categories.findIndex(cat => cat.id === categoryId);

    if (categoryIndex === -1) {
      return {
        success: false,
        error: `找不到ID为 ${categoryId} 的分类`
      };
    }

    // 移除书签
    categories[categoryIndex] = {
      ...categories[categoryIndex],
      bookmarks: categories[categoryIndex].bookmarks.filter(id => id !== bookmarkId),
      updatedAt: Date.now()
    };

    // 保存分类
    const saveResult = await saveCategories(categories);
    if (!saveResult.success) {
      return saveResult;
    }

    return { success: true, data: categories[categoryIndex] };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : '从分类中移除书签失败'
    };
  }
}

/**
 * 获取书签所属的所有分类
 */
export async function getCategoriesByBookmarkId(bookmarkId: string): Promise<OperationResult<BookmarkCategory[]>> {
  try {
    const categoriesResult = await loadCategories();
    if (!categoriesResult.success) {
      return categoriesResult;
    }

    const categories = categoriesResult.data || [];
    const bookmarkCategories = categories.filter(category =>
      category.bookmarks.includes(bookmarkId)
    );

    return { success: true, data: bookmarkCategories };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : '获取书签分类失败'
    };
  }
}

/**
 * 批量操作：添加多个书签
 */
export async function addBookmarks(newBookmarks: Omit<Bookmark, 'id' | 'createdAt' | 'updatedAt'>[]): Promise<OperationResult<Bookmark[]>> {
  try {
    const result = await loadBookmarks();
    if (!result.success) {
      return result;
    }

    const existingBookmarks = result.data || [];
    const now = Date.now();

    // 创建新书签，添加ID和时间戳
    const bookmarksToAdd: Bookmark[] = newBookmarks.map(bookmark => ({
      ...bookmark,
      id: generateBookmarkId(),
      createdAt: now,
      updatedAt: now
    }));

    const updatedBookmarks = [...existingBookmarks, ...bookmarksToAdd];

    // 保存更新后的书签
    const saveResult = await saveBookmarks(updatedBookmarks);
    if (!saveResult.success) {
      return saveResult;
    }

    return { success: true, data: bookmarksToAdd };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : '批量添加书签失败'
    };
  }
}

/**
 * 批量操作：删除多个书签
 */
export async function deleteBookmarks(bookmarkIds: string[]): Promise<OperationResult<void>> {
  try {
    const [bookmarksResult, categoriesResult] = await Promise.all([
      loadBookmarks(),
      loadCategories()
    ]);

    if (!bookmarksResult.success) {
      return bookmarksResult;
    }

    if (!categoriesResult.success) {
      return categoriesResult;
    }

    const bookmarks = bookmarksResult.data || [];
    const categories = categoriesResult.data || [];

    // 从书签列表中移除指定书签
    const bookmarkIdsSet = new Set(bookmarkIds);
    const updatedBookmarks = bookmarks.filter(bookmark => !bookmarkIdsSet.has(bookmark.id));

    // 从所有分类中移除这些书签
    const updatedCategories = categories.map(category => ({
      ...category,
      bookmarks: category.bookmarks.filter(id => !bookmarkIdsSet.has(id)),
      updatedAt: Date.now()
    }));

    // 保存更新后的数据
    const [saveBookmarksResult, saveCategoriesResult] = await Promise.all([
      saveBookmarks(updatedBookmarks),
      saveCategories(updatedCategories)
    ]);

    if (!saveBookmarksResult.success) {
      return saveBookmarksResult;
    }

    if (!saveCategoriesResult.success) {
      return saveCategoriesResult;
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : '批量删除书签失败'
    };
  }
}

/**
 * 搜索书签
 */
export async function searchBookmarks(query: string): Promise<OperationResult<Bookmark[]>> {
  try {
    const result = await loadBookmarks();
    if (!result.success) {
      return result;
    }

    const bookmarks = result.data || [];
    const searchTerm = query.toLowerCase().trim();

    if (!searchTerm) {
      return { success: true, data: bookmarks };
    }

    // 搜索书签标题和URL
    const filteredBookmarks = bookmarks.filter(bookmark =>
      bookmark.title.toLowerCase().includes(searchTerm) ||
      bookmark.url.toLowerCase().includes(searchTerm) ||
      (bookmark.internalUrl && bookmark.internalUrl.toLowerCase().includes(searchTerm)) ||
      (bookmark.externalUrl && bookmark.externalUrl.toLowerCase().includes(searchTerm))
    );

    return { success: true, data: filteredBookmarks };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : '搜索书签失败'
    };
  }
}

/**
 * 排序书签
 */
export function sortBookmarks(
  bookmarks: Bookmark[], 
  sortBy: 'title' | 'createdAt' | 'updatedAt' = 'title',
  order: 'asc' | 'desc' = 'asc'
): Bookmark[] {
  const sorted = [...bookmarks].sort((a, b) => {
    let comparison = 0;

    switch (sortBy) {
      case 'title':
        comparison = a.title.localeCompare(b.title, 'zh-CN');
        break;
      case 'createdAt':
        comparison = a.createdAt - b.createdAt;
        break;
      case 'updatedAt':
        comparison = a.updatedAt - b.updatedAt;
        break;
    }

    return order === 'desc' ? -comparison : comparison;
  });

  return sorted;
}

/**
 * 导出书签数据（用于备份）
 */
export async function exportBookmarksData(): Promise<OperationResult<{ bookmarks: Bookmark[]; categories: BookmarkCategory[] }>> {
  try {
    const [bookmarksResult, categoriesResult] = await Promise.all([
      loadBookmarks(),
      loadCategories()
    ]);

    if (!bookmarksResult.success) {
      return bookmarksResult;
    }

    if (!categoriesResult.success) {
      return categoriesResult;
    }

    return {
      success: true,
      data: {
        bookmarks: bookmarksResult.data || [],
        categories: categoriesResult.data || []
      }
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : '导出书签数据失败'
    };
  }
}
