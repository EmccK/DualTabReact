/**
 * 图标工具函数 - 重构简化版本
 * 提供简洁、高效的图标处理功能
 */

import type { Bookmark, NetworkMode } from '@/types';
import type { IconType } from '@/types/bookmark-icon.types';

// favicon获取策略 - 优先使用网站自己的图标，避免有问题的第三方API
const FAVICON_SERVICES = [
  '{protocol}://{domain}/favicon.ico',
  '{protocol}://{domain}/favicon.png',
  '{protocol}://{domain}/apple-touch-icon.png',
  '{protocol}://{domain}/apple-touch-icon-precomposed.png',
  'https://icons.duckduckgo.com/ip3/{domain}.ico',
  // 注意：Google的s2/favicons API有协议问题，暂时移除
  // 'https://www.google.com/s2/favicons?domain={domain}&sz={size}',
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
 * 获取网站协议
 */
const getUrlProtocol = (url: string): string => {
  try {
    return new URL(url).protocol.replace(':', '');
  } catch {
    return 'https';
  }
};

/**
 * 获取favicon URL - 优先使用网站自己的图标
 */
export const getFaviconUrl = (url: string, size: number = 32): string => {
  const domain = extractDomain(url);
  const protocol = getUrlProtocol(url);

  // 内网地址返回特殊标识
  if (isInternalDomain(domain)) {
    return 'internal-domain'; // 特殊标识，组件会处理为emoji或特殊样式
  }

  // 优先使用网站自己的favicon.ico
  return `${protocol}://${domain}/favicon.ico`;
};

/**
 * 尝试从Chrome API获取标签页的favicon URL（仅在扩展环境中可用）
 */
export const getTabFaviconUrl = async (url: string): Promise<string | null> => {
  try {
    // 检查是否在Chrome扩展环境中
    if (typeof chrome === 'undefined' || !chrome.tabs) {
      return null;
    }

    // 查询匹配URL的标签页
    const tabs = await chrome.tabs.query({ url: url });
    if (tabs.length > 0 && tabs[0].favIconUrl) {
      return tabs[0].favIconUrl;
    }

    // 如果没找到精确匹配，尝试查询当前活动标签页
    const activeTabs = await chrome.tabs.query({ active: true, currentWindow: true });
    if (activeTabs.length > 0 && activeTabs[0].url === url && activeTabs[0].favIconUrl) {
      return activeTabs[0].favIconUrl;
    }
  } catch (error) {
    // 忽略错误，可能是权限问题
  }

  return null;
};

/**
 * 尝试从当前页面获取真实的favicon URL（仅在content script环境中可用）
 */
export const getRealPageFaviconUrl = (): string | null => {
  // 检查是否在浏览器环境中
  if (typeof document === 'undefined') {
    return null;
  }

  try {
    // 方法1：从页面的link标签获取（最准确）
    const faviconLink = document.querySelector('link[rel*="icon"]') as HTMLLinkElement;
    if (faviconLink && faviconLink.href) {
      return faviconLink.href;
    }

    // 方法2：尝试其他可能的图标链接
    const iconSelectors = [
      'link[rel="shortcut icon"]',
      'link[rel="icon"]',
      'link[rel="apple-touch-icon"]',
      'link[rel="apple-touch-icon-precomposed"]'
    ];

    for (const selector of iconSelectors) {
      const link = document.querySelector(selector) as HTMLLinkElement;
      if (link && link.href) {
        return link.href;
      }
    }
  } catch (error) {
    // 忽略错误，返回null
  }

  return null;
};

/**
 * 获取favicon备用URL列表
 */
export const getFaviconFallbackUrls = (url: string, size: number = 32): string[] => {
  const domain = extractDomain(url);
  const protocol = getUrlProtocol(url);

  if (isInternalDomain(domain)) {
    return ['internal-domain'];
  }

  // 生成标准的备用URL列表
  const fallbackUrls = FAVICON_SERVICES.map(template =>
    template
      .replace('{protocol}', protocol)
      .replace('{domain}', domain)
      .replace('{size}', Math.min(size, 64).toString())
  );

  return fallbackUrls;
};

/**
 * 检查是否为第三方服务的通用兜底图标
 */
const isGenericFallbackIcon = (img: HTMLImageElement, url: string): boolean => {
  // Google Favicons API的通用兜底图标检测
  if (url.includes('google.com/s2/favicons')) {
    // 方法1：检查尺寸不匹配
    const sizeMatch = url.match(/sz=(\d+)/);
    const requestedSize = sizeMatch ? parseInt(sizeMatch[1]) : 16;

    // 如果请求的是较大尺寸但返回的是16x16，很可能是兜底图标
    if (requestedSize > 16 && img.width === 16 && img.height === 16) {
      return true;
    }

    // 方法2：检查是否为已知的通用图标尺寸和特征
    if (img.width === 16 && img.height === 16) {
      // 对于16x16的图标，我们需要更仔细的检查
      // 但由于跨域限制，我们采用保守策略
      // 如果明确请求的是16x16，则认为是有效的
      if (requestedSize === 16) {
        return false; // 可能是真实的16x16图标
      }
    }
  }

  // DuckDuckGo Icons API的检测
  if (url.includes('icons.duckduckgo.com')) {
    // DuckDuckGo通常返回32x32的图标，如果返回很小的图标可能是兜底
    if (img.width < 16 || img.height < 16) {
      return true;
    }
  }

  // 通用检查：如果图标太小，可能是占位符
  if (img.width < 8 || img.height < 8) {
    return true;
  }

  return false;
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
      if (img.width <= 1 || img.height <= 1) {
        resolve(false);
        return;
      }

      // 检查是否为第三方服务的通用兜底图标
      if (isGenericFallbackIcon(img, url)) {
        resolve(false);
        return;
      }

      resolve(true);
    };

    img.onerror = () => {
      clearTimeout(timeoutId);
      resolve(false);
    };

    // 设置crossOrigin以便能够读取图片数据（如果可能的话）
    try {
      img.crossOrigin = 'anonymous';
    } catch (e) {
      // 忽略crossOrigin设置错误
    }

    img.src = url;
  });
};

/**
 * 异步获取最佳favicon URL - 增强版，优先使用浏览器原生favicon
 */
export const getBestFaviconUrl = async (url: string, size: number = 32): Promise<string | null> => {
  // 方法1：尝试从Chrome API获取标签页的favicon（最可靠）
  try {
    const tabFaviconUrl = await getTabFaviconUrl(url);
    if (tabFaviconUrl && await testImageUrl(tabFaviconUrl)) {
      return tabFaviconUrl;
    }
  } catch (error) {
    // 忽略错误，继续尝试其他方法
  }

  // 方法2：使用标准的备用URL列表
  const fallbackUrls = getFaviconFallbackUrls(url, size);

  for (const faviconUrl of fallbackUrls) {
    if (await testImageUrl(faviconUrl)) {
      return faviconUrl;
    }
  }

  return null;
};

/**
 * 获取书签图标URL（根据图标类型）- 同步版本，返回第一个URL
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
 * 异步获取书签的最佳图标URL（根据图标类型）
 */
export const getBestBookmarkIconUrl = async (
  bookmark: Bookmark,
  networkMode: NetworkMode,
  size: number = 32
): Promise<string | null> => {
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

      // 如果书签有保存的真实favicon URL，优先使用
      if (bookmark.realFaviconUrl) {
        if (await testImageUrl(bookmark.realFaviconUrl)) {
          return bookmark.realFaviconUrl;
        }
      }

      return await getBestFaviconUrl(activeUrl, size);
  }
};

/**
 * 为当前页面获取真实的favicon URL（仅在popup环境中使用）
 */
export const captureCurrentPageFavicon = async (): Promise<string | null> => {
  // 方法1：尝试从页面获取真实favicon（popup环境中可用）
  const realPageFavicon = getRealPageFaviconUrl();
  if (realPageFavicon && await testImageUrl(realPageFavicon)) {
    return realPageFavicon;
  }

  return null;
};

/**
 * 为新书签获取并保存真实的favicon URL
 */
export const captureRealFaviconForBookmark = async (url: string): Promise<string | null> => {
  // 方法1：尝试从Chrome API获取当前标签页的favicon
  try {
    const tabFaviconUrl = await getTabFaviconUrl(url);
    if (tabFaviconUrl && await testImageUrl(tabFaviconUrl)) {
      return tabFaviconUrl;
    }
  } catch (error) {
    // 忽略错误
  }

  // 方法2：尝试从当前页面获取真实favicon（如果是popup环境）
  try {
    const currentPageFavicon = await captureCurrentPageFavicon();
    if (currentPageFavicon) {
      return currentPageFavicon;
    }
  } catch (error) {
    // 忽略错误
  }

  // 方法3：使用最佳favicon获取逻辑
  return await getBestFaviconUrl(url, 32);
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
  getBestBookmarkIconUrl,
  getCachedFaviconUrl,
  preloadBookmarkIcons,
  validateIconType,
  generateDefaultIconColor,
  clearIconCache,
  getIconCacheStats,
};
