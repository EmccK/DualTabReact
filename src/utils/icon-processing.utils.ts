/**
 * 图标处理工具函数
 */

import type { Bookmark, NetworkMode } from '@/types';
import type { TextIconConfig, UploadIconConfig, OfficialIconConfig } from '@/types/bookmark-icon.types';
import { ICON_TYPES, FAVICON_SERVICE_URLS } from '@/constants';
import { getUrlDomain } from '@/utils/url-utils';

/**
 * 根据书签生成文字图标配置
 */
export const generateTextIconConfig = (
  bookmark: Bookmark,
  size: number,
  borderRadius: number
): TextIconConfig => {
  return {
    text: bookmark.iconText || bookmark.title?.charAt(0) || '?',
    fontSize: Math.round(size * 0.6),
    fontWeight: 'bold',
    textColor: bookmark.iconColor || '#ffffff',
    backgroundColor: bookmark.backgroundColor || '#3b82f6',
    borderRadius,
    borderWidth: 0,
    borderColor: 'transparent',
  };
};

/**
 * 根据书签生成上传图标配置
 */
export const generateUploadIconConfig = (
  bookmark: Bookmark,
  borderRadius: number
): UploadIconConfig => {
  return {
    imageData: bookmark.iconData || bookmark.icon || '',
    backgroundColor: bookmark.backgroundColor,
    borderRadius,
    borderWidth: 0,
    borderColor: 'transparent',
    objectFit: 'cover',
  };
};

/**
 * 根据书签生成官方图标配置
 */
export const generateOfficialIconConfig = (
  bookmark: Bookmark,
  networkMode: NetworkMode,
  size: number,
  borderRadius: number
): OfficialIconConfig => {
  const getActiveUrl = () => {
    if (networkMode === 'internal' && bookmark.internalUrl) {
      return bookmark.internalUrl;
    }
    if (networkMode === 'external' && bookmark.externalUrl) {
      return bookmark.externalUrl;
    }
    return bookmark.url;
  };

  const activeUrl = getActiveUrl();
  const domain = getUrlDomain(activeUrl);
  
  // 生成回退URL列表
  const fallbackUrls = domain 
    ? FAVICON_SERVICE_URLS.map(template => 
        template
          .replace('{domain}', domain)
          .replace('{size}', size.toString())
      )
    : [];

  return {
    url: activeUrl,
    fallbackUrls,
    currentFallbackIndex: 0,
    borderRadius,
    borderWidth: 0,
    borderColor: 'transparent',
    backgroundColor: bookmark.backgroundColor,
  };
};

/**
 * 获取书签的图标类型
 */
export const getBookmarkIconType = (bookmark: Bookmark) => {
  return bookmark.iconType || ICON_TYPES.OFFICIAL;
};

/**
 * 验证图片文件类型
 */
export const validateImageFile = (file: File): { valid: boolean; error?: string } => {
  const supportedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  
  if (!supportedTypes.includes(file.type)) {
    return {
      valid: false,
      error: `不支持的文件类型: ${file.type}。支持的类型: ${supportedTypes.join(', ')}`
    };
  }

  const maxSize = 5 * 1024 * 1024; // 5MB
  if (file.size > maxSize) {
    return {
      valid: false,
      error: `文件太大: ${(file.size / 1024 / 1024).toFixed(2)}MB。最大支持: 5MB`
    };
  }

  return { valid: true };
};

/**
 * 将文件转换为base64
 */
export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('读取文件失败'));
      }
    };
    
    reader.onerror = () => {
      reject(new Error('读取文件时发生错误'));
    };
    
    reader.readAsDataURL(file);
  });
};

/**
 * 压缩图片
 */
export const compressImage = (
  imageData: string,
  maxWidth: number = 512,
  maxHeight: number = 512,
  quality: number = 0.8
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        reject(new Error('无法创建canvas上下文'));
        return;
      }

      // 计算新尺寸
      let { width, height } = img;
      
      if (width > maxWidth) {
        height = (height * maxWidth) / width;
        width = maxWidth;
      }
      
      if (height > maxHeight) {
        width = (width * maxHeight) / height;
        height = maxHeight;
      }

      canvas.width = width;
      canvas.height = height;

      // 绘制并压缩
      ctx.drawImage(img, 0, 0, width, height);
      
      try {
        const compressedData = canvas.toDataURL('image/jpeg', quality);
        resolve(compressedData);
      } catch (error) {
        reject(error);
      }
    };
    
    img.onerror = () => {
      reject(new Error('图片加载失败'));
    };
    
    img.src = imageData;
  });
};

/**
 * 生成默认文字图标
 */
export const generateDefaultTextIcon = (text: string, backgroundColor?: string): string => {
  const canvas = document.createElement('canvas');
  const size = 64;
  canvas.width = size;
  canvas.height = size;
  
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  // 设置背景
  ctx.fillStyle = backgroundColor || '#3b82f6';
  ctx.fillRect(0, 0, size, size);

  // 设置文字样式
  ctx.fillStyle = '#ffffff';
  ctx.font = `bold ${size * 0.6}px Arial`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // 绘制文字
  const displayText = text.charAt(0).toUpperCase();
  ctx.fillText(displayText, size / 2, size / 2);

  return canvas.toDataURL('image/png');
};

/**
 * 检查URL是否为有效的图片
 */
export const isValidImageUrl = (url: string): Promise<boolean> => {
  return new Promise((resolve) => {
    const img = new Image();
    
    img.onload = () => resolve(true);
    img.onerror = () => resolve(false);
    
    // 设置超时
    setTimeout(() => resolve(false), 5000);
    
    img.src = url;
  });
};
