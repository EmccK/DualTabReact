/**
 * Popup URL处理工具函数
 */

import type { FormValidationResult, QuickBookmarkFormData } from '@/types/popup/tab.types';

/**
 * 验证快速书签表单
 */
export function validateQuickBookmarkForm(formData: QuickBookmarkFormData): FormValidationResult {
  const errors: FormValidationResult['errors'] = {};

  // 验证书签名称
  if (!formData.name.trim()) {
    errors.name = '请输入书签名称';
  } else if (formData.name.trim().length < 1) {
    errors.name = '书签名称至少需要1个字符';
  } else if (formData.name.trim().length > 100) {
    errors.name = '书签名称不能超过100个字符';
  }

  // 验证URL
  if (!formData.url.trim()) {
    errors.url = '请输入网站地址';
  } else {
    try {
      new URL(formData.url);
    } catch {
      errors.url = '请输入有效的网站地址';
    }
  }

  // 验证分类
  if (!formData.categoryId) {
    errors.categoryId = '请选择书签分类';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}

/**
 * 检测URL是否为内网地址
 */
export function isInternalUrl(url: string): boolean {
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname;

    // 检查私有IP地址范围
    const privateIpPatterns = [
      /^127\./, // 127.0.0.0/8 (localhost)
      /^10\./, // 10.0.0.0/8
      /^172\.(1[6-9]|2[0-9]|3[0-1])\./, // 172.16.0.0/12
      /^192\.168\./, // 192.168.0.0/16
      /^169\.254\./, // 169.254.0.0/16 (link-local)
      /^::1$/, // IPv6 localhost
      /^fe80:/, // IPv6 link-local
      /^fc00:/, // IPv6 unique local
      /^fd00:/ // IPv6 unique local
    ];

    // 检查是否为localhost
    if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1') {
      return true;
    }

    // 检查私有IP范围
    return privateIpPatterns.some(pattern => pattern.test(hostname));
  } catch {
    return false;
  }
}

/**
 * 智能建议内外网URL
 */
export function suggestNetworkUrls(url: string): {
  external?: string;
  internal?: string;
  suggestion: 'external' | 'internal' | 'both';
} {
  if (isInternalUrl(url)) {
    return {
      internal: url,
      suggestion: 'internal'
    };
  } else {
    return {
      external: url,
      suggestion: 'external'
    };
  }
}

/**
 * 格式化URL显示
 */
export function formatUrlForDisplay(url: string, maxLength: number = 50): string {
  if (!url) return '';
  
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname;
    const pathname = urlObj.pathname;
    
    let displayUrl = hostname + pathname;
    
    if (displayUrl.length > maxLength) {
      displayUrl = displayUrl.substring(0, maxLength - 3) + '...';
    }
    
    return displayUrl;
  } catch {
    // 如果URL解析失败，直接截取
    return url.length > maxLength ? url.substring(0, maxLength - 3) + '...' : url;
  }
}
