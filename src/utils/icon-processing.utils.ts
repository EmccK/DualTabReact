/**
 * 图标处理工具函数 - 简化版本
 * 专注于核心的图标处理功能
 */

import type { Bookmark, NetworkMode } from '@/types';
import type { TextIconConfig, UploadIconConfig, OfficialIconConfig } from '@/types/bookmark-icon.types';
import { getActiveUrl, extractDomain, generateDefaultIconColor } from './icon-utils';

/**
 * 根据书签生成文字图标配置
 */
export const generateTextIconConfig = (
  bookmark: Bookmark,
  size: number,
  borderRadius: number
): TextIconConfig => {
  const text = bookmark.iconText || bookmark.title?.charAt(0) || '?';
  const backgroundColor = bookmark.iconColor || generateDefaultIconColor(text);
  
  return {
    text,
    fontSize: Math.round(size * 0.6),
    fontWeight: 'bold',
    textColor: '#ffffff',
    backgroundColor,
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
    imageData: bookmark.iconData || bookmark.iconImage || '',
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
  const activeUrl = getActiveUrl(bookmark, networkMode);
  const domain = extractDomain(activeUrl);

  // 获取URL协议
  const getUrlProtocol = (url: string): string => {
    try {
      return new URL(url).protocol.replace(':', '');
    } catch {
      return 'https';
    }
  };

  const protocol = getUrlProtocol(activeUrl);

  // 优先使用网站自己的图标，然后是可靠的第三方服务
  const fallbackUrls = [
    `${protocol}://${domain}/favicon.ico`,
    `${protocol}://${domain}/favicon.png`,
    `${protocol}://${domain}/apple-touch-icon.png`,
    `${protocol}://${domain}/apple-touch-icon-precomposed.png`,
    `https://icons.duckduckgo.com/ip3/${domain}.ico`,
    // 注意：Google的s2/favicons API有协议问题，暂时移除
  ];

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
  return bookmark.iconType || 'official';
};

/**
 * 验证图片文件
 */
export const validateImageFile = (file: File): { valid: boolean; error?: string } => {
  const supportedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  
  if (!supportedTypes.includes(file.type)) {
    return {
      valid: false,
      error: `不支持的文件类型: ${file.type}`
    };
  }

  const maxSize = 2 * 1024 * 1024; // 2MB
  if (file.size > maxSize) {
    return {
      valid: false,
      error: `文件过大: ${(file.size / 1024 / 1024).toFixed(2)}MB，最大支持2MB`
    };
  }

  return { valid: true };
};

/**
 * 文件转base64
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
    
    reader.onerror = () => reject(new Error('文件读取错误'));
    reader.readAsDataURL(file);
  });
};

/**
 * 压缩图片
 */
export const compressImage = (
  imageData: string,
  maxWidth: number = 256,
  maxHeight: number = 256,
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

      // 计算新尺寸，保持比例
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
    
    img.onerror = () => reject(new Error('图片加载失败'));
    img.src = imageData;
  });
};

/**
 * 应用图片缩放配置
 */
export const applyImageScale = (
  imageData: string,
  scaleConfig: {
    scale: number;
    offsetX: number;
    offsetY: number;
    rotation?: number;
    backgroundColor?: string;
    backgroundOpacity?: number;
  },
  outputSize: number = 64
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        reject(new Error('无法创建canvas上下文'));
        return;
      }

      canvas.width = outputSize;
      canvas.height = outputSize;

      // 绘制背景
      if (scaleConfig.backgroundColor && (scaleConfig.backgroundOpacity ?? 100) > 0) {
        const opacity = (scaleConfig.backgroundOpacity ?? 100) / 100;
        ctx.globalAlpha = opacity;
        ctx.fillStyle = scaleConfig.backgroundColor;
        ctx.fillRect(0, 0, outputSize, outputSize);
        ctx.globalAlpha = 1;
      }

      // 应用变换
      ctx.save();
      ctx.translate(outputSize / 2, outputSize / 2);

      if (scaleConfig.rotation) {
        ctx.rotate((scaleConfig.rotation * Math.PI) / 180);
      }

      // 计算尺寸
      const aspectRatio = img.width / img.height;
      let baseWidth, baseHeight;

      if (aspectRatio > 1) {
        baseWidth = outputSize;
        baseHeight = outputSize / aspectRatio;
      } else {
        baseHeight = outputSize;
        baseWidth = outputSize * aspectRatio;
      }

      const finalWidth = baseWidth * scaleConfig.scale;
      const finalHeight = baseHeight * scaleConfig.scale;

      const offsetX = (scaleConfig.offsetX / 100) * outputSize;
      const offsetY = (scaleConfig.offsetY / 100) * outputSize;

      ctx.drawImage(
        img,
        -finalWidth / 2 + offsetX,
        -finalHeight / 2 + offsetY,
        finalWidth,
        finalHeight
      );

      ctx.restore();

      try {
        const resultData = canvas.toDataURL('image/png');
        resolve(resultData);
      } catch (error) {
        reject(error);
      }
    };

    img.onerror = () => reject(new Error('图片加载失败'));
    img.src = imageData;
  });
};

/**
 * 压缩并应用缩放配置
 */
export const compressAndScaleImage = (
  imageData: string,
  scaleConfig?: {
    scale: number;
    offsetX: number;
    offsetY: number;
    rotation?: number;
    backgroundColor?: string;
    backgroundOpacity?: number;
  },
  maxWidth: number = 256,
  maxHeight: number = 256,
  quality: number = 0.8
): Promise<string> => {
  return new Promise((resolve, reject) => {
    if (scaleConfig) {
      applyImageScale(imageData, scaleConfig, Math.min(maxWidth, maxHeight))
        .then(scaledData => {
          // 如果有透明背景，保持PNG格式
          const needsPngFormat = !scaleConfig.backgroundColor || (scaleConfig.backgroundOpacity ?? 100) < 100;
          
          if (needsPngFormat) {
            resolve(scaledData);
          } else {
            compressImage(scaledData, maxWidth, maxHeight, quality)
              .then(resolve)
              .catch(reject);
          }
        })
        .catch(reject);
    } else {
      compressImage(imageData, maxWidth, maxHeight, quality)
        .then(resolve)
        .catch(reject);
    }
  });
};

/**
 * 检查URL是否为有效图片
 */
export const isValidImageUrl = (url: string): Promise<boolean> => {
  return new Promise((resolve) => {
    const img = new Image();
    const timeoutId = setTimeout(() => resolve(false), 5000);

    img.onload = () => {
      clearTimeout(timeoutId);
      resolve(true);
    };
    
    img.onerror = () => {
      clearTimeout(timeoutId);
      resolve(false);
    };

    img.src = url;
  });
};

// 导出所有函数
export default {
  generateTextIconConfig,
  generateUploadIconConfig,
  generateOfficialIconConfig,
  getBookmarkIconType,
  validateImageFile,
  fileToBase64,
  compressImage,
  applyImageScale,
  compressAndScaleImage,
  isValidImageUrl,
};
