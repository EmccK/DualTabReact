/**
 * 背景管理Hook
 * 处理背景设置、样式生成和应用逻辑
 */

import { useMemo } from 'react';
import { useSettings } from '@/hooks/useSettings';
import { generateGradientCSS } from '@/utils/gradientUtils';
import type { BackgroundSettings } from '@/types/settings';
import type { UnsplashPhoto } from '@/services/unsplash';
import type { Attribution } from '@/types/attribution';
import { createUnsplashAttribution } from '@/utils/attribution';

export interface BackgroundStyles {
  backgroundImage?: string;
  backgroundSize: string;
  backgroundPosition: string;
  backgroundRepeat: string;
  opacity: number;
  filter: string;
}

export function useBackground() {
  const { settings, updateSettings } = useSettings();
  const backgroundSettings = settings.background;

  /**
   * 生成背景样式对象
   */
  const backgroundStyles = useMemo((): BackgroundStyles => {
    const { type, gradient, image, display } = backgroundSettings;
    const { fillMode, opacity, blur, brightness } = display;

    let styles: BackgroundStyles = {
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat',
      opacity: Math.max(0, Math.min(1, opacity / 100)),
      filter: blur > 0 || brightness !== 100 
        ? `blur(${Math.max(0, blur)}px) brightness(${Math.max(0, brightness)}%)`
        : 'none'
    };

    // 根据填充模式设置backgroundSize
    switch (fillMode) {
      case 'cover':
        styles.backgroundSize = 'cover';
        break;
      case 'contain':
        styles.backgroundSize = 'contain';
        break;
      case 'stretch':
        styles.backgroundSize = '100% 100%';
        break;
      case 'center':
        styles.backgroundSize = 'auto';
        styles.backgroundPosition = 'center';
        break;
    }

    // 根据背景类型生成背景图像
    try {
      switch (type) {
        case 'gradient':
          styles.backgroundImage = generateGradientCSS(gradient);
          break;
        case 'image':
          if (image?.url) {
            styles.backgroundImage = `url(${image.url})`;
          } else {
            styles.backgroundImage = generateGradientCSS(gradient);
          }
          break;
        case 'unsplash':
          if (backgroundSettings.unsplashPhoto?.cachedUrl) {
            styles.backgroundImage = `url(${backgroundSettings.unsplashPhoto.cachedUrl})`;
          } else {
            // 回退到渐变
            styles.backgroundImage = generateGradientCSS(gradient);
          }
          break;
        default:
          styles.backgroundImage = generateGradientCSS(gradient);
      }
    } catch (error) {
      console.warn('生成背景样式失败:', error);
      // 回退到默认渐变
      styles.backgroundImage = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
    }

    return styles;
  }, [backgroundSettings]);

  /**
   * 生成背景CSS字符串（用于style属性）
   */
  const backgroundStyleString = useMemo(() => {
    const styles = backgroundStyles;
    
    // 将驼峰式转换为kebab-case并过滤掉无效值
    const cssProperties: Record<string, string> = {};
    
    Object.entries(styles).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        const cssKey = key.replace(/([A-Z])/g, '-$1').toLowerCase();
        cssProperties[cssKey] = String(value);
      }
    });
    
    return cssProperties;
  }, [backgroundStyles]);

  /**
   * 更新背景设置
   */
  const updateBackground = async (updates: Partial<BackgroundSettings>) => {
    await updateSettings('background', updates);
  };

  /**
   * 设置渐变背景
   */
  const setGradientBackground = async (gradient: BackgroundSettings['gradient']) => {
    await updateBackground({
      type: 'gradient',
      gradient
    });
  };

  /**
   * 设置图片背景
   */
  const setImageBackground = async (imageFile: File) => {
    return new Promise<void>((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = async (e) => {
        const url = e.target?.result as string;
        const image = {
          url,
          name: imageFile.name,
          size: imageFile.size,
          type: imageFile.type
        };
        
        try {
          await updateBackground({
            type: 'image',
            image
          });
          resolve();
        } catch (error) {
          reject(error);
        }
      };
      
      reader.onerror = () => {
        reject(new Error('Failed to read image file'));
      };
      
      reader.readAsDataURL(imageFile);
    });
  };

  /**
   * 设置Unsplash背景
   */
  const setUnsplashBackground = async (photo: UnsplashPhoto, cachedUrl: string) => {
    const unsplashPhoto = {
      id: photo.id,
      url: photo.urls.regular,
      cachedUrl,
      photographer: photo.user.name,
      photographerUrl: photo.user.links.html,
      description: photo.alt_description || photo.description || '',
      width: photo.width,
      height: photo.height,
      downloadLocation: photo.links.download_location
    };

    await updateBackground({
      type: 'unsplash',
      unsplashPhoto
    });
  };

  /**
   * 更新显示效果设置
   */
  const updateDisplaySettings = async (display: Partial<BackgroundSettings['display']>) => {
    await updateBackground({
      display: {
        ...backgroundSettings.display,
        ...display
      }
    });
  };

  /**
   * 获取当前背景的归属信息
   */
  const currentAttribution = useMemo((): Attribution | null => {
    const { type, unsplashPhoto, image } = backgroundSettings;
    
    switch (type) {
      case 'unsplash':
        if (unsplashPhoto) {
          return createUnsplashAttribution({
            id: unsplashPhoto.id,
            urls: {
              regular: unsplashPhoto.url,
              full: unsplashPhoto.url
            },
            user: {
              name: unsplashPhoto.photographer,
              username: unsplashPhoto.photographer.toLowerCase().replace(/\s+/g, ''),
              links: {
                html: unsplashPhoto.photographerUrl
              }
            },
            links: {
              html: unsplashPhoto.photographerUrl,
              download: unsplashPhoto.downloadLocation || '',
              download_location: unsplashPhoto.downloadLocation || ''
            }
          });
        }
        break;
      
      case 'image':
        if (image?.url) {
          return {
            id: 'local-' + Date.now(),
            source: 'local',
            authorName: image.name || '本地图片',
            fileName: image.name,
            uploadDate: new Date().toISOString()
          };
        }
        break;
    }
    
    return null;
  }, [backgroundSettings]);
  const resetBackground = async () => {
    await updateSettings('background', {
      type: 'gradient',
      gradient: {
        type: 'linear',
        direction: 135,
        colors: [
          { color: '#667eea', position: 0 },
          { color: '#764ba2', position: 100 }
        ]
      }
    });
  };

  return {
    // 背景设置
    backgroundSettings,
    
    // 样式相关
    backgroundStyles,
    backgroundStyleString,
    
    // 归属信息
    currentAttribution,
    
    // 更新方法
    updateBackground,
    setGradientBackground,
    setImageBackground,
    setUnsplashBackground,
    updateDisplaySettings,
    resetBackground,
  };
}
