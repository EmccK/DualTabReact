/**
 * 书签显示相关工具函数
 */

import type { Bookmark, NetworkMode } from '@/types';
import type { BookmarkDisplayStyle } from '@/types/bookmark-display.types';
import type { BookmarkSettings } from '@/types/settings';
import { BOOKMARK_DISPLAY_STYLES, DISPLAY_STYLE_LABELS } from '@/constants';

/**
 * 获取书签在当前网络模式下的URL
 */
export const getBookmarkActiveUrl = (bookmark: Bookmark, networkMode: NetworkMode): string => {
  if (networkMode === 'internal' && bookmark.internalUrl) {
    return bookmark.internalUrl;
  }
  if (networkMode === 'external' && bookmark.externalUrl) {
    return bookmark.externalUrl;
  }
  return bookmark.url || '';
};

/**
 * 检查书签是否有多个URL
 */
export const hasMultipleUrls = (bookmark: Bookmark): boolean => {
  const urls = [bookmark.url, bookmark.internalUrl, bookmark.externalUrl].filter(Boolean);
  return urls.length > 1;
};

/**
 * 获取书签的显示标题
 */
export const getBookmarkDisplayTitle = (bookmark: Bookmark, maxLength?: number): string => {
  const title = bookmark.title || bookmark.name || '未命名书签';
  
  if (maxLength && title.length > maxLength) {
    return `${title.substring(0, maxLength - 3)}...`;
  }
  
  return title;
};

/**
 * 获取书签的显示描述
 */
export const getBookmarkDisplayDescription = (bookmark: Bookmark, maxLength?: number): string => {
  const description = bookmark.description || '';
  
  if (maxLength && description.length > maxLength) {
    return `${description.substring(0, maxLength - 3)}...`;
  }
  
  return description;
};

/**
 * 检查显示样式是否有效
 */
export const isValidDisplayStyle = (style: string): style is BookmarkDisplayStyle => {
  return Object.values(BOOKMARK_DISPLAY_STYLES).includes(style as BookmarkDisplayStyle);
};

/**
 * 获取显示样式的标签
 */
export const getDisplayStyleLabel = (style: BookmarkDisplayStyle): string => {
  return DISPLAY_STYLE_LABELS[style] || style;
};

/**
 * 根据容器宽度推荐显示样式
 */
export const getRecommendedDisplayStyle = (containerWidth: number): BookmarkDisplayStyle => {
  // 小屏幕推荐紧凑样式
  if (containerWidth < 768) {
    return BOOKMARK_DISPLAY_STYLES.COMPACT;
  }
  
  // 大屏幕推荐详细样式
  return BOOKMARK_DISPLAY_STYLES.DETAILED;
};

/**
 * 检查书签是否应该显示网络模式指示器
 */
export const shouldShowNetworkIndicator = (bookmark: Bookmark): boolean => {
  return Boolean(bookmark.internalUrl || bookmark.externalUrl);
};

/**
 * 获取网络模式指示器的颜色类
 */
export const getNetworkIndicatorColor = (networkMode: NetworkMode): string => {
  return networkMode === 'internal' ? 'bg-yellow-400' : 'bg-green-400';
};

/**
 * 计算书签网格的最优布局
 */
export const calculateOptimalLayout = (
  bookmarkCount: number,
  containerWidth: number,
  containerHeight: number,
  displayStyle: BookmarkDisplayStyle
): {
  columns: number;
  rows: number;
  itemsPerPage: number;
  needsScroll: boolean;
} => {
  const minCardWidth = displayStyle === BOOKMARK_DISPLAY_STYLES.COMPACT ? 80 : 160;
  const minGap = 16;
  
  // 计算最大列数
  const maxColumns = Math.floor((containerWidth - minGap * 2) / (minCardWidth + minGap));
  const actualColumns = Math.max(1, Math.min(maxColumns, 12));
  
  // 计算行数
  const totalRows = Math.ceil(bookmarkCount / actualColumns);
  const cardHeight = displayStyle === BOOKMARK_DISPLAY_STYLES.COMPACT ? 96 : 120;
  const maxVisibleRows = Math.floor((containerHeight - minGap * 2) / (cardHeight + minGap));
  
  return {
    columns: actualColumns,
    rows: totalRows,
    itemsPerPage: actualColumns * Math.max(1, maxVisibleRows),
    needsScroll: totalRows > maxVisibleRows,
  };
};

/**
 * 过滤和排序书签
 */
export const filterAndSortBookmarks = (
  bookmarks: Bookmark[],
  filters: {
    search?: string;
    categoryId?: string;
    hasDescription?: boolean;
    hasMultipleUrls?: boolean;
  },
  sortBy: 'name' | 'createdAt' | 'updatedAt' | 'position' = 'position'
): Bookmark[] => {
  let filtered = [...bookmarks];
  
  // 搜索过滤
  if (filters.search) {
    const searchLower = filters.search.toLowerCase();
    filtered = filtered.filter(bookmark =>
      bookmark.title.toLowerCase().includes(searchLower) ||
      bookmark.description?.toLowerCase().includes(searchLower) ||
      bookmark.url.toLowerCase().includes(searchLower)
    );
  }
  
  // 分类过滤
  if (filters.categoryId) {
    filtered = filtered.filter(bookmark => bookmark.categoryId === filters.categoryId);
  }
  
  // 描述过滤
  if (filters.hasDescription !== undefined) {
    filtered = filtered.filter(bookmark => 
      filters.hasDescription ? Boolean(bookmark.description) : !bookmark.description
    );
  }
  
  // 多URL过滤
  if (filters.hasMultipleUrls !== undefined) {
    filtered = filtered.filter(bookmark => 
      filters.hasMultipleUrls ? hasMultipleUrls(bookmark) : !hasMultipleUrls(bookmark)
    );
  }
  
  // 排序
  filtered.sort((a, b) => {
    switch (sortBy) {
      case 'name':
        return a.title.localeCompare(b.title);
      case 'createdAt':
        return b.createdAt - a.createdAt; // 新的在前
      case 'updatedAt':
        return b.updatedAt - a.updatedAt; // 新的在前
      case 'position':
      default:
        return (a.position || 0) - (b.position || 0);
    }
  });
  
  return filtered;
};

/**
 * 生成书签统计信息
 */
export const generateBookmarkStats = (bookmarks: Bookmark[]): {
  total: number;
  withDescription: number;
  withMultipleUrls: number;
  byIconType: Record<string, number>;
  byCategory: Record<string, number>;
} => {
  const stats = {
    total: bookmarks.length,
    withDescription: 0,
    withMultipleUrls: 0,
    byIconType: {} as Record<string, number>,
    byCategory: {} as Record<string, number>,
  };
  
  bookmarks.forEach(bookmark => {
    // 描述统计
    if (bookmark.description) {
      stats.withDescription++;
    }
    
    // 多URL统计
    if (hasMultipleUrls(bookmark)) {
      stats.withMultipleUrls++;
    }
    
    // 图标类型统计
    const iconType = bookmark.iconType || 'official';
    stats.byIconType[iconType] = (stats.byIconType[iconType] || 0) + 1;
    
    // 分类统计
    const categoryId = bookmark.categoryId || 'uncategorized';
    stats.byCategory[categoryId] = (stats.byCategory[categoryId] || 0) + 1;
  });
  
  return stats;
};

/**
 * 验证书签数据完整性
 */
export const validateBookmarkData = (bookmark: Partial<Bookmark>): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
} => {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // 必需字段检查
  if (!bookmark.title?.trim()) {
    errors.push('书签标题不能为空');
  }
  
  if (!bookmark.url?.trim()) {
    errors.push('书签URL不能为空');
  }
  
  // URL格式检查
  if (bookmark.url) {
    try {
      new URL(bookmark.url);
    } catch {
      errors.push('主URL格式无效');
    }
  }
  
  if (bookmark.internalUrl) {
    try {
      new URL(bookmark.internalUrl);
    } catch {
      warnings.push('内网URL格式可能无效');
    }
  }
  
  if (bookmark.externalUrl) {
    try {
      new URL(bookmark.externalUrl);
    } catch {
      warnings.push('外网URL格式可能无效');
    }
  }
  
  // 图标类型检查
  if (bookmark.iconType === 'text' && !bookmark.iconText?.trim()) {
    warnings.push('文字图标类型需要设置图标文字');
  }
  
  if (bookmark.iconType === 'upload' && !bookmark.iconData?.trim()) {
    warnings.push('上传图标类型需要设置图标数据');
  }
  
  // 长度检查
  if (bookmark.title && bookmark.title.length > 100) {
    warnings.push('标题过长，建议控制在100字符以内');
  }
  
  if (bookmark.description && bookmark.description.length > 500) {
    warnings.push('描述过长，建议控制在500字符以内');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
};

/**
 * 生成书签的唯一键
 */
export const generateBookmarkKey = (bookmark: Bookmark, suffix?: string): string => {
  const parts = [bookmark.id, bookmark.title, bookmark.url];
  if (suffix) {
    parts.push(suffix);
  }
  return parts.join('-').replace(/[^a-zA-Z0-9-]/g, '-');
};

/**
 * 检查两个书签是否相同
 */
export const areBookmarksEqual = (a: Bookmark, b: Bookmark): boolean => {
  return (
    a.id === b.id &&
    a.title === b.title &&
    a.url === b.url &&
    a.internalUrl === b.internalUrl &&
    a.externalUrl === b.externalUrl &&
    a.description === b.description &&
    a.iconType === b.iconType &&
    a.iconText === b.iconText &&
    a.iconData === b.iconData &&
    a.iconColor === b.iconColor &&
    a.backgroundColor === b.backgroundColor &&
    a.categoryId === b.categoryId
  );
};
