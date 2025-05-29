/**
 * Popup 标签页操作工具函数
 */

import type { CurrentTabInfo, TabDetectionResult } from '@/types/popup/tab.types';

/**
 * 获取当前活动标签页信息
 */
export async function getCurrentTab(): Promise<TabDetectionResult> {
  try {
    // 检查Chrome API是否可用
    if (typeof chrome === 'undefined' || !chrome.tabs) {
      return {
        success: false,
        error: 'Chrome tabs API not available'
      };
    }

    // 查询当前活动标签页
    const tabs = await chrome.tabs.query({ 
      active: true, 
      currentWindow: true 
    });

    if (tabs.length === 0) {
      return {
        success: false,
        error: 'No active tab found'
      };
    }

    const tab = tabs[0];
    
    // 过滤Chrome内部页面
    if (tab.url?.startsWith('chrome://') || tab.url?.startsWith('chrome-extension://')) {
      return {
        success: false,
        error: 'Cannot access Chrome internal pages'
      };
    }

    const tabInfo: CurrentTabInfo = {
      id: tab.id,
      url: tab.url,
      title: tab.title,
      favIconUrl: tab.favIconUrl,
      active: tab.active,
      windowId: tab.windowId
    };

    return {
      success: true,
      data: tabInfo
    };
  } catch (error) {
    console.error('获取当前标签页失败:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * 检查URL是否有效
 */
export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * 清理和标准化URL
 */
export function sanitizeUrl(url: string): string {
  if (!url) return '';
  
  // 移除前后空格
  url = url.trim();
  
  // 如果没有协议，添加https://
  if (!/^https?:\/\//i.test(url)) {
    url = 'https://' + url;
  }
  
  return url;
}

/**
 * 从URL提取域名
 */
export function extractDomain(url: string): string {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname;
  } catch {
    return '';
  }
}

/**
 * 生成默认书签名称
 */
export function generateDefaultBookmarkName(title?: string, url?: string): string {
  if (title && title.trim()) {
    return title.trim();
  }
  
  if (url) {
    const domain = extractDomain(url);
    if (domain) {
      // 移除www前缀
      return domain.replace(/^www\./, '');
    }
  }
  
  return '新书签';
}
