/**
 * 书签分类数据模型
 * 现代化TypeScript版本，包含验证和工具方法
 */

import type { BookmarkCategory } from '../types';

/**
 * 创建新的书签分类
 */
export function createBookmarkCategory(
  name: string,
  icon: string = 'folder',
  color: string = '#3B82F6'
): BookmarkCategory {
  const now = Date.now();
  
  return {
    name: name.trim(),
    icon: icon.trim(),
    color: color.trim(),
    bookmarks: [],
    createdAt: now,
    updatedAt: now
  };
}

/**
 * 默认分类名称
 */
export const DEFAULT_CATEGORY_NAME = '默认分类';

/**
 * 创建默认分类
 */
export function createDefaultCategory(): BookmarkCategory {
  const now = Date.now();
  
  return {
    name: DEFAULT_CATEGORY_NAME,
    icon: '📁',
    color: '#3B82F6',
    bookmarks: [],
    createdAt: now,
    updatedAt: now
  };
}

/**
 * 验证分类数据是否有效
 */
export function validateCategory(category: any): category is BookmarkCategory {
  if (!category || typeof category !== 'object') {
    return false;
  }

  // 检查必需字段
  const requiredFields = ['name', 'icon', 'color', 'bookmarks', 'createdAt', 'updatedAt'];
  for (const field of requiredFields) {
    if (!(field in category)) {
      return false;
    }
  }

  // 类型检查

  if (typeof category.name !== 'string' || category.name.trim() === '') {
    return false;
  }

  if (typeof category.icon !== 'string') {
    return false;
  }

  if (typeof category.color !== 'string') {
    return false;
  }

  if (!Array.isArray(category.bookmarks)) {
    return false;
  }

  // 检查bookmarks数组中的每个元素是否为字符串
  if (!category.bookmarks.every((url: any) => typeof url === 'string')) {
    return false;
  }

  if (typeof category.createdAt !== 'number' || category.createdAt <= 0) {
    return false;
  }

  if (typeof category.updatedAt !== 'number' || category.updatedAt <= 0) {
    return false;
  }

  return true;
}

/**
 * 更新分类信息
 */
export function updateCategory(
  category: BookmarkCategory,
  updates: Partial<Pick<BookmarkCategory, 'name' | 'icon' | 'color'>>
): BookmarkCategory {
  return {
    ...category,
    ...updates,
    updatedAt: Date.now()
  };
}

/**
 * 添加书签到分类
 */
export function addBookmarkToCategory(
  category: BookmarkCategory,
  bookmarkUrl: string
): BookmarkCategory {
  // 检查书签是否已存在
  if (category.bookmarks.includes(bookmarkUrl)) {
    return category;
  }

  return {
    ...category,
    bookmarks: [...category.bookmarks, bookmarkUrl],
    updatedAt: Date.now()
  };
}

/**
 * 从分类中移除书签
 */
export function removeBookmarkFromCategory(
  category: BookmarkCategory,
  bookmarkUrl: string
): BookmarkCategory {
  return {
    ...category,
    bookmarks: category.bookmarks.filter(url => url !== bookmarkUrl),
    updatedAt: Date.now()
  };
}

/**
 * 检查分类是否包含指定书签
 */
export function categoryContainsBookmark(
  category: BookmarkCategory,
  bookmarkUrl: string
): boolean {
  return category.bookmarks.includes(bookmarkUrl);
}

/**
 * 获取分类中的书签数量
 */
export function getCategoryBookmarkCount(category: BookmarkCategory): number {
  return category.bookmarks.length;
}

/**
 * 清空分类中的所有书签
 */
export function clearCategoryBookmarks(category: BookmarkCategory): BookmarkCategory {
  return {
    ...category,
    bookmarks: [],
    updatedAt: Date.now()
  };
}

/**
 * 批量添加书签到分类
 */
export function addBookmarksToCategory(
  category: BookmarkCategory,
  bookmarkUrls: string[]
): BookmarkCategory {
  // 过滤掉已存在的书签URL
  const newBookmarkUrls = bookmarkUrls.filter(url => !category.bookmarks.includes(url));
  
  if (newBookmarkUrls.length === 0) {
    return category;
  }

  return {
    ...category,
    bookmarks: [...category.bookmarks, ...newBookmarkUrls],
    updatedAt: Date.now()
  };
}

/**
 * 批量移除分类中的书签
 */
export function removeBookmarksFromCategory(
  category: BookmarkCategory,
  bookmarkUrls: string[]
): BookmarkCategory {
  const bookmarkUrlsSet = new Set(bookmarkUrls);
  
  return {
    ...category,
    bookmarks: category.bookmarks.filter(url => !bookmarkUrlsSet.has(url)),
    updatedAt: Date.now()
  };
}

/**
 * 复制分类（创建副本）
 */
export function cloneCategory(
  category: BookmarkCategory,
  newName?: string
): BookmarkCategory {
  const now = Date.now();
  
  return {
    ...category,
    name: newName || `${category.name} (副本)`,
    bookmarks: [...category.bookmarks], // 浅拷贝书签数组
    createdAt: now,
    updatedAt: now
  };
}

/**
 * 分类排序比较函数
 */
export function compareCategoriesByName(a: BookmarkCategory, b: BookmarkCategory): number {
  return a.name.localeCompare(b.name, 'zh-CN');
}

export function compareCategoriesByCreatedAt(a: BookmarkCategory, b: BookmarkCategory): number {
  return a.createdAt - b.createdAt;
}

export function compareCategoriesByUpdatedAt(a: BookmarkCategory, b: BookmarkCategory): number {
  return b.updatedAt - a.updatedAt; // 最近更新的在前
}

export function compareCategoriesByBookmarkCount(a: BookmarkCategory, b: BookmarkCategory): number {
  return b.bookmarks.length - a.bookmarks.length; // 书签多的在前
}

/**
 * 默认分类常量
 */
export const DEFAULT_CATEGORIES = {
  WORK: {
    name: '工作',
    icon: 'briefcase',
    color: '#3B82F6'
  },
  PERSONAL: {
    name: '个人',
    icon: 'user',
    color: '#10B981'
  },
  STUDY: {
    name: '学习',
    icon: 'book',
    color: '#8B5CF6'
  },
  ENTERTAINMENT: {
    name: '娱乐',
    icon: 'play',
    color: '#F59E0B'
  },
  TOOLS: {
    name: '工具',
    icon: 'wrench',
    color: '#EF4444'
  }
} as const;

/**
 * 检查是否为默认分类
 */
export function isDefaultCategory(category: BookmarkCategory | { name: string }): boolean {
  return category.name && category.name.trim() === DEFAULT_CATEGORY_NAME;
}

/**
 * 根据分类名获取唯一标识
 */
export function getCategoryKey(categoryName: string): string {
  return categoryName.trim();
}

/**
 * 创建默认分类集合
 */
export function createDefaultCategories(): BookmarkCategory[] {
  return Object.values(DEFAULT_CATEGORIES).map(template => 
    createBookmarkCategory(template.name, template.icon, template.color)
  );
}
