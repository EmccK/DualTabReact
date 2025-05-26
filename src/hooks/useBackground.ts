/**
 * 背景管理Hook
 * 处理背景设置、样式生成和应用逻辑
 */

import { useMemo } from 'react';
import { useSettings } from '@/hooks/useSettings';
import { generateGradientCSS } from '@/utils/gradientUtils';
import type { BackgroundSettings } from '@/types/settings';
import type { BackgroundImage } from '@/types/background';
import type { Attribution } from '@/types/attribution';

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
        case 'random':
          if (image?.url) {
            styles.backgroundImage = `url("${image.url}")`;
          } else {
            // 如果没有图片，回退到渐变
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
   * 设置在线图片背景（统一接口）
   */
  const setOnlineImageBackground = async (image: BackgroundImage, cachedUrl: string) => {
    try {
      await updateBackground({
        type: 'random',
        image: {
          id: image.id,
          url: cachedUrl,
          originalUrl: image.url,
          width: image.width,
          height: image.height,
          description: image.description,
          keywords: image.keywords,
          category: image.category,
          source: image.source,
          createdAt: image.createdAt,
          updatedAt: image.updatedAt
        }
      });
      console.log('随机图片背景设置成功:', image.id);
    } catch (error) {
      console.error('设置在线图片背景失败:', error);
      throw error;
    }
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
    // 暂时不支持在线图片归属信息
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
    setOnlineImageBackground, // 新的统一接口
    updateDisplaySettings,
    resetBackground,
  };
}
