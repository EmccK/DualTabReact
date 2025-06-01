/**
 * 图标工具函数 - 重构简化版本
 * 提供简洁、高效的图标处理功能
 */

import type { Bookmark, NetworkMode } from '@/types';
import type { IconType } from '@/types/bookmark-icon.types';

// 简化的favicon服务列表 - 只保留最可靠的服务
const FAVICON_SERVICES = [
  'https://www.google.com/s2/favicons?domain={domain}&sz={size}',
  'https://icons.duckduckgo.com/ip3/{domain}.ico',
] as const;

// 内网域名模式
const INTERNAL_PATTERNS = [
  /^localhost$/i,
  /^127\.0\.0\.1$/,
  /^192\.168\./,
  /^10\./,
  /^172\.(1[6-9]|2[0-9]|3[0-1])\./,
  /\.local$/i,
  /\.lan$/i,
] as const;

/**
 * 从URL中提取域名
 */
export const extractDomain = (url: string): string => {
  try {
    return new URL(url).hostname;
  } catch {
    // 简单的备用解析
    const match = url.match(/^(?:https?:\/\/)?(?:www\.)?([^\/\?#]+)/i);
    return match ? match[1] : url;
  }
};

/**
 * 检查是否为内网地址
 */
export const isInternalDomain = (domain: string): boolean => {
  return INTERNAL_PATTERNS.some(pattern => pattern.test(domain));
};

/**
 * 获取书签的激活URL（根据网络模式）
 */
export const getActiveUrl = (bookmark: Bookmark, networkMode: NetworkMode): string => {
  if (networkMode === 'internal' && bookmark.internalUrl) {
    return bookmark.internalUrl;
  }
  if (networkMode === 'external' && bookmark.externalUrl) {
    return bookmark.externalUrl;
  }
  return bookmark.url;
};

/**
 * 获取favicon URL - 简化版本
 */
export const getFaviconUrl = (url: string, size: number = 32): string => {
  const domain = extractDomain(url);
  
  // 内网地址返回特殊标识
  if (isInternalDomain(domain)) {
    return 'internal-domain'; // 特殊标识，组件会处理为emoji或特殊样式
  }

  // 使用Google Favicons API（最可靠）
  return `https://www.google.com/s2/favicons?domain=${domain}&sz=${Math.min(size, 64)}`;
};

/**
 * 获取favicon备用URL列表
 */
export const getFaviconFallbackUrls = (url: string, size: number = 32): string[] => {
  const domain = extractDomain(url);
  
  if (isInternalDomain(domain)) {
    return ['internal-domain'];
  }

  return FAVICON_SERVICES.map(template =>
    template
      .replace('{domain}', domain)
      .replace('{size}', Math.min(size, 64).toString())
  );
};

/**
 * 测试图片URL是否可用
 */
export const testImageUrl = (url: string, timeout: number = 3000): Promise<boolean> => {
  return new Promise((resolve) => {
    if (url === 'internal-domain') {
      resolve(true);
      return;
    }

    const img = new Image();
    const timeoutId = setTimeout(() => resolve(false), timeout);
    
    img.onload = () => {
      clearTimeout(timeoutId);
      // 检查是否为有效图片（不是1x1透明图）
      resolve(img.width > 1 && img.height > 1);
    };
    
    img.onerror = () => {
      clearTimeout(timeoutId);
      resolve(false);
    };
    
    img.src = url;
  });
};

/**
 * 异步获取最佳favicon URL
 */
export const getBestFaviconUrl = async (url: string, size: number = 32): Promise<string | null> => {
  const fallbackUrls = getFaviconFallbackUrls(url, size);
  
  for (const faviconUrl of fallbackUrls) {
    if (await testImageUrl(faviconUrl)) {
      return faviconUrl;
    }
  }
  
  return null;
};

/**
 * 获取书签图标URL（根据图标类型）
 */
export const getBookmarkIconUrl = (
  bookmark: Bookmark, 
  networkMode: NetworkMode,
  size: number = 32
): string | null => {
  const iconType = bookmark.iconType || 'official';

  switch (iconType) {
    case 'upload':
      return bookmark.iconData || bookmark.iconImage || null;
    
    case 'text':
      // 文字图标不需要URL，返回null让组件自己渲染
      return null;
    
    case 'official':
    default:
      const activeUrl = getActiveUrl(bookmark, networkMode);
      return getFaviconUrl(activeUrl, size);
  }
};

/**
 * 简化的图标缓存管理
 */
class SimpleIconCache {
  private cache = new Map<string, { url: string; timestamp: number }>();
  private readonly maxSize = 100;
  private readonly maxAge = 24 * 60 * 60 * 1000; // 24小时

  private generateKey(url: string, size: number): string {
    return `${extractDomain(url)}:${size}`;
  }

  get(url: string, size: number): string | null {
    const key = this.generateKey(url, size);
    const entry = this.cache.get(key);
    
    if (!entry) return null;
    
    // 检查是否过期
    if (Date.now() - entry.timestamp > this.maxAge) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.url;
  }

  set(url: string, size: number, faviconUrl: string): void {
    const key = this.generateKey(url, size);
    
    this.cache.set(key, {
      url: faviconUrl,
      timestamp: Date.now(),
    });
    
    // 限制缓存大小
    if (this.cache.size > this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) {
        this.cache.delete(firstKey);
      }
    }
  }

  clear(): void {
    this.cache.clear();
  }

  getStats() {
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
    };
  }
}

// 创建全局缓存实例
export const iconCache = new SimpleIconCache();

/**
 * 带缓存的favicon获取
 */
export const getCachedFaviconUrl = async (url: string, size: number = 32): Promise<string | null> => {
  // 先尝试从缓存获取
  const cached = iconCache.get(url, size);
  if (cached) {
    return cached;
  }

  // 获取新的favicon URL
  const faviconUrl = await getBestFaviconUrl(url, size);
  
  if (faviconUrl) {
    iconCache.set(url, size, faviconUrl);
  }
  
  return faviconUrl;
};

/**
 * 预加载书签图标
 */
export const preloadBookmarkIcons = async (
  bookmarks: Bookmark[],
  networkMode: NetworkMode,
  size: number = 32
): Promise<void> => {
  const promises = bookmarks
    .filter(bookmark => (bookmark.iconType || 'official') === 'official')
    .map(bookmark => {
      const activeUrl = getActiveUrl(bookmark, networkMode);
      return getCachedFaviconUrl(activeUrl, size);
    });

  await Promise.allSettled(promises);
};

/**
 * 验证图标类型
 */
export const validateIconType = (iconType: string): IconType => {
  const validTypes: IconType[] = ['official', 'text', 'upload'];
  return validTypes.includes(iconType as IconType) ? (iconType as IconType) : 'official';
};

/**
 * 生成默认图标颜色（基于文本）
 */
export const generateDefaultIconColor = (text: string): string => {
  const colors = [
    '#3b82f6', '#ef4444', '#10b981', '#f59e0b',
    '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16',
    '#f97316', '#6366f1', '#14b8a6', '#a855f7',
  ];
  
  // 基于文本生成一致的颜色
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = text.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  return colors[Math.abs(hash) % colors.length];
};

/**
 * 清理图标缓存
 */
export const clearIconCache = (): void => {
  iconCache.clear();
};

/**
 * 获取图标缓存统计信息
 */
export const getIconCacheStats = () => {
  return iconCache.getStats();
};

// 兼容性导出（保持向后兼容）
export const loadBestFaviconUrl = getBestFaviconUrl;
export const preloadFavicon = getCachedFaviconUrl;

// 默认导出主要函数
export default {
  extractDomain,
  isInternalDomain,
  getActiveUrl,
  getFaviconUrl,
  getBookmarkIconUrl,
  getCachedFaviconUrl,
  preloadBookmarkIcons,
  validateIconType,
  generateDefaultIconColor,
  clearIconCache,
  getIconCacheStats,
};
