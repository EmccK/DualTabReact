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

/**
 * 根据URL和分类名生成书签唯一标识
 */
export function getBookmarkKey(url: string, categoryName?: string): string {
  const cleanUrl = url.trim().toLowerCase();
  const cleanCategoryName = categoryName?.trim() || '';
  return `${cleanCategoryName}:${cleanUrl}`;
}

/**
 * 创建新书签
 */
export function createBookmark(
  title: string,
  url: string,
  options: {
    categoryName?: string;
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
    name: title.trim(),
    title: title.trim(),
    url: url.trim(),
    categoryName: options.categoryName,
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
  const requiredFields = ['name', 'title', 'url', 'createdAt', 'updatedAt'];
  for (const field of requiredFields) {
    if (!(field in bookmark)) {
      return false;
    }
  }

  // 类型检查
  if (typeof bookmark.name !== 'string' || bookmark.name.trim() === '') {
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
  updates: Partial<Omit<Bookmark, 'createdAt' | 'updatedAt'>>
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
 * 迁移书签数据到新格式（移除ID字段，确保数据完整性）
 */
export async function migrateBookmarksToUniqueIds(): Promise<OperationResult<Bookmark[]>> {
  try {
    const result = await loadBookmarks();
    if (!result.success) {
      return {
        success: false,
        error: result.error || '加载书签失败'
      };
    }

    const bookmarks = result.data || [];
    let hasChanges = false;

    // 清理和迁移书签数据
    const migratedBookmarks = bookmarks.map(bookmark => {
      const migrated = { ...bookmark };
      
      // 移除旧的ID字段（如果存在）
      if ('id' in migrated) {
        delete (migrated as any).id;
        hasChanges = true;
      }
      
      // 确保必需字段存在
      if (!migrated.name && migrated.title) {
        migrated.name = migrated.title;
        hasChanges = true;
      }
      
      // 迁移categoryId到categoryName（如果存在旧数据）
      if ('categoryId' in migrated && !migrated.categoryName) {
        // 这里可以添加从categoryId查找categoryName的逻辑
        delete (migrated as any).categoryId;
        hasChanges = true;
      }
      
      return migrated;
    });

    // 如果有变更，保存书签
    if (hasChanges) {
      const saveResult = await saveBookmarks(migratedBookmarks);
      if (!saveResult.success) {
        return {
          success: false,
          error: saveResult.error || '保存书签失败'
        };
      }
      return { success: true, data: migratedBookmarks };
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
 * 通过URL获取书签
 */
export async function getBookmarkByUrl(bookmarkUrl: string): Promise<OperationResult<Bookmark | null>> {
  try {
    const result = await loadBookmarks();
    if (!result.success) {
      return {
        success: false,
        error: result.error || '加载书签失败'
      };
    }

    const bookmarks = result.data || [];
    const bookmark = bookmarks.find(b => b.url === bookmarkUrl);
    
    return { success: true, data: bookmark || null };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : '获取书签失败'
    };
  }
}


/**
 * 获取带分类信息的书签
 */
export async function getBookmarksWithCategories(): Promise<OperationResult<(Bookmark & { categories: Array<{ name: string; color: string }> })[]>> {
  try {
    const [bookmarksResult, categoriesResult] = await Promise.all([
      loadBookmarks(),
      loadCategories()
    ]);

    if (!bookmarksResult.success) {
      return {
        success: false,
        error: bookmarksResult.error || '加载书签失败'
      };
    }

    if (!categoriesResult.success) {
      return {
        success: false,
        error: categoriesResult.error || '加载分类失败'
      };
    }

    const bookmarks = bookmarksResult.data || [];
    const categories = categoriesResult.data || [];

    // 为每个书签添加所属分类信息
    const enhancedBookmarks = bookmarks.map(bookmark => {
      // 查找书签所属的分类
      const bookmarkCategories = categories
        .filter(category => category.bookmarks.includes(bookmark.url))
        .map(cat => ({
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
export async function getBookmarksByCategory(categoryName: string): Promise<OperationResult<Bookmark[]>> {
  try {
    const [bookmarksResult, categoriesResult] = await Promise.all([
      loadBookmarks(),
      loadCategories()
    ]);

    if (!bookmarksResult.success) {
      return {
        success: false,
        error: bookmarksResult.error || '加载书签失败'
      };
    }

    if (!categoriesResult.success) {
      return {
        success: false,
        error: categoriesResult.error || '加载分类失败'
      };
    }

    const bookmarks = bookmarksResult.data || [];
    const categories = categoriesResult.data || [];

    // 找到指定分类
    const category = categories.find(cat => cat.name === categoryName);

    if (!category) {
      return {
        success: false,
        error: `找不到名称为 ${categoryName} 的分类`
      };
    }

    // 过滤出属于该分类的书签
    const categoryBookmarks = bookmarks.filter(bookmark =>
      category.bookmarks.includes(bookmark.url)
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
      return {
        success: false,
        error: bookmarksResult.error || '加载书签失败'
      };
    }

    if (!categoriesResult.success) {
      return {
        success: false,
        error: categoriesResult.error || '加载分类失败'
      };
    }

    const bookmarks = bookmarksResult.data || [];
    const categories = categoriesResult.data || [];

    // 收集所有已分类的书签URL
    const categorizedBookmarkUrls = new Set<string>();
    categories.forEach(category => {
      category.bookmarks.forEach(bookmarkUrl => {
        categorizedBookmarkUrls.add(bookmarkUrl);
      });
    });

    // 过滤出未分类的书签
    const uncategorizedBookmarks = bookmarks.filter(bookmark =>
      !categorizedBookmarkUrls.has(bookmark.url)
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
export async function addBookmarkToCategory(categoryName: string, bookmarkUrl: string): Promise<OperationResult<BookmarkCategory>> {
  try {
    const categoriesResult = await loadCategories();
    if (!categoriesResult.success) {
      return {
        success: false,
        error: categoriesResult.error || '加载分类失败'
      };
    }

    const categories = categoriesResult.data || [];
    const categoryIndex = categories.findIndex(cat => cat.name === categoryName);

    if (categoryIndex === -1) {
      return {
        success: false,
        error: `找不到名称为 ${categoryName} 的分类`
      };
    }

    // 检查书签是否已在分类中
    if (!categories[categoryIndex].bookmarks.includes(bookmarkUrl)) {
      categories[categoryIndex] = {
        ...categories[categoryIndex],
        bookmarks: [...categories[categoryIndex].bookmarks, bookmarkUrl],
        updatedAt: Date.now()
      };

      // 保存分类
      const saveResult = await saveCategories(categories);
      if (!saveResult.success) {
        return {
          success: false,
          error: saveResult.error || '保存分类失败'
        };
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
export async function removeBookmarkFromCategory(categoryName: string, bookmarkUrl: string): Promise<OperationResult<BookmarkCategory>> {
  try {
    const categoriesResult = await loadCategories();
    if (!categoriesResult.success) {
      return {
        success: false,
        error: categoriesResult.error || '加载分类失败'
      };
    }

    const categories = categoriesResult.data || [];
    const categoryIndex = categories.findIndex(cat => cat.name === categoryName);

    if (categoryIndex === -1) {
      return {
        success: false,
        error: `找不到名称为 ${categoryName} 的分类`
      };
    }

    // 移除书签
    categories[categoryIndex] = {
      ...categories[categoryIndex],
      bookmarks: categories[categoryIndex].bookmarks.filter(url => url !== bookmarkUrl),
      updatedAt: Date.now()
    };

    // 保存分类
    const saveResult = await saveCategories(categories);
    if (!saveResult.success) {
      return {
        success: false,
        error: saveResult.error || '保存分类失败'
      };
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
export async function getCategoriesByBookmarkUrl(bookmarkUrl: string): Promise<OperationResult<BookmarkCategory[]>> {
  try {
    const categoriesResult = await loadCategories();
    if (!categoriesResult.success) {
      return {
        success: false,
        error: categoriesResult.error || '加载分类失败'
      };
    }

    const categories = categoriesResult.data || [];
    const bookmarkCategories = categories.filter(category =>
      category.bookmarks.includes(bookmarkUrl)
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
export async function addBookmarks(newBookmarks: Omit<Bookmark, 'createdAt' | 'updatedAt'>[]): Promise<OperationResult<Bookmark[]>> {
  try {
    const result = await loadBookmarks();
    if (!result.success) {
      return {
        success: false,
        error: result.error || '加载书签失败'
      };
    }

    const existingBookmarks = result.data || [];
    const now = Date.now();

    // 创建新书签，添加时间戳
    const bookmarksToAdd: Bookmark[] = newBookmarks.map(bookmark => ({
      ...bookmark,
      createdAt: now,
      updatedAt: now
    }));

    // 检查是否有重复的URL，如果有则覆盖
    const existingUrls = new Set(existingBookmarks.map(b => b.url));
    const filteredExistingBookmarks = existingBookmarks.filter(bookmark => 
      !bookmarksToAdd.some(newBookmark => newBookmark.url === bookmark.url)
    );

    const updatedBookmarks = [...filteredExistingBookmarks, ...bookmarksToAdd];

    // 保存更新后的书签
    const saveResult = await saveBookmarks(updatedBookmarks);
    if (!saveResult.success) {
      return {
        success: false,
        error: saveResult.error || '保存书签失败'
      };
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
export async function deleteBookmarks(bookmarkUrls: string[]): Promise<OperationResult<void>> {
  try {
    const [bookmarksResult, categoriesResult] = await Promise.all([
      loadBookmarks(),
      loadCategories()
    ]);

    if (!bookmarksResult.success) {
      return {
        success: false,
        error: bookmarksResult.error || '加载书签失败'
      };
    }

    if (!categoriesResult.success) {
      return {
        success: false,
        error: categoriesResult.error || '加载分类失败'
      };
    }

    const bookmarks = bookmarksResult.data || [];
    const categories = categoriesResult.data || [];

    // 从书签列表中移除指定书签
    const bookmarkUrlsSet = new Set(bookmarkUrls);
    const updatedBookmarks = bookmarks.filter(bookmark => !bookmarkUrlsSet.has(bookmark.url));

    // 从所有分类中移除这些书签
    const updatedCategories = categories.map(category => ({
      ...category,
      bookmarks: category.bookmarks.filter(url => !bookmarkUrlsSet.has(url)),
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
      return {
        success: false,
        error: bookmarksResult.error || '加载书签失败'
      };
    }

    if (!categoriesResult.success) {
      return {
        success: false,
        error: categoriesResult.error || '加载分类失败'
      };
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
