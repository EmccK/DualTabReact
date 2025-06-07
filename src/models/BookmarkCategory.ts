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
    id: generateCategoryId(),
    name: name.trim(),
    icon: icon.trim(),
    color: color.trim(),
    bookmarks: [],
    createdAt: now,
    updatedAt: now
  };
}

/**
 * 默认分类固定ID
 */
export const DEFAULT_CATEGORY_ID = 'default_category';

/**
 * 生成分类唯一ID
 */
export function generateCategoryId(): string {
  return `cat_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
}

/**
 * 创建默认分类
 */
export function createDefaultCategory(): BookmarkCategory {
  const now = Date.now();
  
  return {
    id: DEFAULT_CATEGORY_ID,
    name: '默认分类',
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
  const requiredFields = ['id', 'name', 'icon', 'color', 'bookmarks', 'createdAt', 'updatedAt'];
  for (const field of requiredFields) {
    if (!(field in category)) {
      return false;
    }
  }

  // 类型检查
  if (typeof category.id !== 'string' || category.id.trim() === '') {
    return false;
  }

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
  if (!category.bookmarks.every((id: any) => typeof id === 'string')) {
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
  bookmarkId: string
): BookmarkCategory {
  // 检查书签是否已存在
  if (category.bookmarks.includes(bookmarkId)) {
    return category;
  }

  return {
    ...category,
    bookmarks: [...category.bookmarks, bookmarkId],
    updatedAt: Date.now()
  };
}

/**
 * 从分类中移除书签
 */
export function removeBookmarkFromCategory(
  category: BookmarkCategory,
  bookmarkId: string
): BookmarkCategory {
  return {
    ...category,
    bookmarks: category.bookmarks.filter(id => id !== bookmarkId),
    updatedAt: Date.now()
  };
}

/**
 * 检查分类是否包含指定书签
 */
export function categoryContainsBookmark(
  category: BookmarkCategory,
  bookmarkId: string
): boolean {
  return category.bookmarks.includes(bookmarkId);
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
  bookmarkIds: string[]
): BookmarkCategory {
  // 过滤掉已存在的书签ID
  const newBookmarkIds = bookmarkIds.filter(id => !category.bookmarks.includes(id));
  
  if (newBookmarkIds.length === 0) {
    return category;
  }

  return {
    ...category,
    bookmarks: [...category.bookmarks, ...newBookmarkIds],
    updatedAt: Date.now()
  };
}

/**
 * 批量移除分类中的书签
 */
export function removeBookmarksFromCategory(
  category: BookmarkCategory,
  bookmarkIds: string[]
): BookmarkCategory {
  const bookmarkIdsSet = new Set(bookmarkIds);
  
  return {
    ...category,
    bookmarks: category.bookmarks.filter(id => !bookmarkIdsSet.has(id)),
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
    id: generateCategoryId(),
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
export function isDefaultCategory(category: BookmarkCategory | { id: string; name: string }): boolean {
  return category.id === DEFAULT_CATEGORY_ID || 
         (category.name && category.name.trim() === '默认分类');
}

/**
 * 迁移旧的默认分类到新的固定ID
 */
export function migrateDefaultCategory(categories: BookmarkCategory[]): {
  categories: BookmarkCategory[];
  migrated: boolean;
} {
  let migrated = false;
  const result = categories.slice();
  
  // 查找现有的默认分类
  const defaultCategoryIndex = result.findIndex(cat => 
    cat.name && cat.name.trim() === '默认分类' && cat.id !== DEFAULT_CATEGORY_ID
  );
  
  if (defaultCategoryIndex !== -1) {
    // 找到旧的默认分类，更新其ID
    const oldDefaultCategory = result[defaultCategoryIndex];
    result[defaultCategoryIndex] = {
      ...oldDefaultCategory,
      id: DEFAULT_CATEGORY_ID,
      updatedAt: Date.now()
    };
    migrated = true;
  }
  
  return { categories: result, migrated };
}

/**
 * 创建默认分类集合
 */
export function createDefaultCategories(): BookmarkCategory[] {
  return Object.values(DEFAULT_CATEGORIES).map(template => 
    createBookmarkCategory(template.name, template.icon, template.color)
  );
}
