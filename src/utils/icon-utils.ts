/**
 * 图标获取工具函数
 * 处理各种图标获取方式，包括fallback机制
 */

import type { Bookmark } from '../types';

/**
 * 获取网站favicon的多种方式
 */
export function getFaviconUrl(url: string, size: number = 32): string {
  try {
    const urlObj = new URL(url);
    const domain = urlObj.hostname;
    
    // 使用Google S2 Favicons API，这个比较稳定
    return `https://www.google.com/s2/favicons?domain=${domain}&sz=${size}`;
  } catch (error) {
    console.warn('无法解析URL获取favicon:', url, error);
    return '';
  }
}

/**
 * 获取网站favicon的备用URL列表
 */
export function getFaviconFallbackUrls(url: string, size: number = 32): string[] {
  try {
    const urlObj = new URL(url);
    const domain = urlObj.hostname;
    const baseUrl = `${urlObj.protocol}//${urlObj.hostname}`;
    
    return [
      // 1. Google S2 Favicons API
      `https://www.google.com/s2/favicons?domain=${domain}&sz=${size}`,
      // 2. 直接从网站根目录获取
      `${baseUrl}/favicon.ico`,
      // 3. DuckDuckGo icon API
      `https://icons.duckduckgo.com/ip3/${domain}.ico`,
      // 4. Favicon.io API
      `https://favicons.githubusercontent.com/${domain}`,
    ];
  } catch (error) {
    console.warn('无法解析URL获取favicon备用列表:', url, error);
    return [];
  }
}

/**
 * 创建一个带有错误处理的图标组件
 */
export function createFaviconElement(
  url: string, 
  alt: string, 
  className: string = 'w-8 h-8',
  onError?: () => void
): HTMLImageElement {
  const img = document.createElement('img');
  const fallbackUrls = getFaviconFallbackUrls(url);
  let currentUrlIndex = 0;

  const tryNextUrl = () => {
    if (currentUrlIndex < fallbackUrls.length) {
      img.src = fallbackUrls[currentUrlIndex];
      currentUrlIndex++;
    } else {
      // 所有URL都失败了，触发最终的错误处理
      onError?.();
    }
  };

  img.onerror = tryNextUrl;
  img.alt = alt;
  img.className = className;
  
  // 开始尝试第一个URL
  tryNextUrl();
  
  return img;
}

/**
 * 获取书签的最佳图标URL
 */
export function getBookmarkIconUrl(bookmark: Bookmark, networkMode: 'internal' | 'external'): string {
  // 根据网络模式选择URL
  let url = bookmark.url;
  if (networkMode === 'internal' && bookmark.internalUrl) {
    url = bookmark.internalUrl;
  } else if (networkMode === 'external' && bookmark.externalUrl) {
    url = bookmark.externalUrl;
  }

  switch (bookmark.iconType) {
    case 'upload':
      return bookmark.iconData || bookmark.icon || '';
    
    case 'text':
      // 文字图标不需要URL
      return '';
    
    case 'official':
    default:
      return getFaviconUrl(url);
  }
}

/**
 * 预加载图标
 */
export function preloadIcon(url: string): Promise<boolean> {
  return new Promise((resolve) => {
    if (!url) {
      resolve(false);
      return;
    }

    const img = new Image();
    img.onload = () => resolve(true);
    img.onerror = () => resolve(false);
    img.src = url;
  });
}

/**
 * 批量预加载书签图标
 */
export async function preloadBookmarkIcons(
  bookmarks: Bookmark[], 
  networkMode: 'internal' | 'external'
): Promise<{ success: number; failed: number }> {
  const results = await Promise.allSettled(
    bookmarks.map(bookmark => {
      const iconUrl = getBookmarkIconUrl(bookmark, networkMode);
      return preloadIcon(iconUrl);
    })
  );

  const success = results.filter(r => r.status === 'fulfilled' && r.value).length;
  const failed = results.length - success;

  return { success, failed };
}
