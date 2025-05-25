import { useCallback, useMemo } from 'react';
import type { BackgroundSettings } from '@/types/settings';
import { useSettings } from './useSettings';

/**
 * 背景管理Hook
 * 提供背景设置管理、样式计算和应用功能
 */
export function useBackground() {
  const { settings, updateSettings } = useSettings();
  const backgroundSettings = settings.background;

  // 更新背景设置
  const updateBackground = useCallback(
    async (updates: Partial<BackgroundSettings>) => {
      await updateSettings('background', updates);
    },
    [updateSettings]
  );

  // 设置背景类型
  const setBackgroundType = useCallback(
    async (type: BackgroundSettings['type']) => {
      await updateBackground({ type });
    },
    [updateBackground]
  );

  // 设置纯色背景
  const setColorBackground = useCallback(
    async (color: string) => {
      const colorHistory = backgroundSettings.colorHistory.filter(c => c !== color);
      colorHistory.unshift(color);
      
      await updateBackground({
        type: 'color',
        color,
        colorHistory: colorHistory.slice(0, 10), // 保留最近10个颜色
      });
    },
    [backgroundSettings.colorHistory, updateBackground]
  );

  // 设置渐变背景
  const setGradientBackground = useCallback(
    async (gradient: BackgroundSettings['gradient']) => {
      await updateBackground({
        type: 'gradient',
        gradient,
      });
    },
    [updateBackground]
  );

  // 应用渐变预设
  const applyGradientPreset = useCallback(
    async (presetId: string) => {
      const preset = backgroundSettings.gradientPresets.find(p => p.id === presetId);
      if (preset) {
        await updateBackground({
          type: 'gradient',
          gradient: preset.gradient,
        });
      }
    },
    [backgroundSettings.gradientPresets, updateBackground]
  );

  // 添加本地图片
  const addLocalImage = useCallback(
    async (imageData: {
      name: string;
      data: string;
      size: number;
      type: string;
    }) => {
      const newImage = {
        id: `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        ...imageData,
        uploadTime: Date.now(),
      };

      const updatedImages = [...backgroundSettings.localImages, newImage];
      
      await updateBackground({
        localImages: updatedImages,
        currentLocalImage: newImage.id,
        type: 'local',
      });

      return newImage.id;
    },
    [backgroundSettings.localImages, updateBackground]
  );

  // 删除本地图片
  const removeLocalImage = useCallback(
    async (imageId: string) => {
      const updatedImages = backgroundSettings.localImages.filter(
        img => img.id !== imageId
      );
      
      const updates: Partial<BackgroundSettings> = {
        localImages: updatedImages,
      };

      // 如果删除的是当前选中的图片，切换到纯色背景
      if (backgroundSettings.currentLocalImage === imageId) {
        updates.type = 'color';
        updates.currentLocalImage = undefined;
      }

      await updateBackground(updates);
    },
    [backgroundSettings.localImages, backgroundSettings.currentLocalImage, updateBackground]
  );

  // 设置当前本地图片
  const setCurrentLocalImage = useCallback(
    async (imageId: string) => {
      await updateBackground({
        type: 'local',
        currentLocalImage: imageId,
      });
    },
    [updateBackground]
  );

  // 更新显示效果设置
  const updateDisplaySettings = useCallback(
    async (displayUpdates: Partial<BackgroundSettings['display']>) => {
      await updateBackground({
        display: {
          ...backgroundSettings.display,
          ...displayUpdates,
        },
      });
    },
    [backgroundSettings.display, updateBackground]
  );

  // 计算当前背景样式
  const backgroundStyles = useMemo(() => {
    const { type, color, gradient, currentLocalImage, localImages, display } = backgroundSettings;
    const {
      fillMode,
      opacity,
      blur,
      brightness,
      contrast,
      saturation,
      overlay,
      overlayColor,
      overlayOpacity,
    } = display;

    console.log('useBackground - backgroundSettings:', backgroundSettings);
    console.log('useBackground - type:', type);
    console.log('useBackground - gradient:', gradient);

    let backgroundImage = 'none';
    let backgroundColor = 'transparent';

    // 根据背景类型设置图像或颜色
    switch (type) {
      case 'color':
        backgroundColor = color;
        break;
      case 'gradient':
        // 生成CSS渐变
        const gradientColors = gradient.colors
          .sort((a, b) => a.position - b.position)
          .map(c => `${c.color} ${c.position}%`)
          .join(', ');
        
        console.log('useBackground - gradientColors:', gradientColors);
        
        if (gradient.type === 'linear') {
          backgroundImage = `linear-gradient(${gradient.direction}deg, ${gradientColors})`;
        } else {
          backgroundImage = `radial-gradient(circle at ${gradient.radialPosition.x}% ${gradient.radialPosition.y}%, ${gradientColors})`;
        }
        console.log('useBackground - backgroundImage:', backgroundImage);
        break;
      case 'local':
        if (currentLocalImage) {
          const image = localImages.find(img => img.id === currentLocalImage);
          if (image) {
            backgroundImage = `url(${image.data})`;
          }
        }
        break;
      case 'unsplash':
        // Unsplash图片将在后续实现
        if (backgroundSettings.currentUnsplashImage) {
          backgroundImage = `url(${backgroundSettings.currentUnsplashImage.url})`;
        }
        break;
    }

    // 构建CSS滤镜
    const filters = [];
    if (blur > 0) filters.push(`blur(${blur}px)`);
    if (brightness !== 100) filters.push(`brightness(${brightness}%)`);
    if (contrast !== 100) filters.push(`contrast(${contrast}%)`);
    if (saturation !== 100) filters.push(`saturate(${saturation}%)`);

    // 主背景样式
    const mainStyle: React.CSSProperties = {
      backgroundImage,
      backgroundColor,
      backgroundSize: (type === 'color') ? 'auto' : 'cover', // 修改这里：渐变也应该使用 cover
      backgroundPosition: 'center',
      backgroundRepeat: fillMode === 'repeat' ? 'repeat' : 'no-repeat',
      opacity: opacity / 100,
      filter: filters.length > 0 ? filters.join(' ') : 'none',
    };

    console.log('useBackground - mainStyle:', mainStyle);
    console.log('useBackground - opacity:', opacity, '-> ', opacity / 100);

    // 叠加层样式
    const overlayStyle: React.CSSProperties = overlay
      ? {
          backgroundColor: overlayColor,
          opacity: overlayOpacity / 100,
        }
      : {};

    return {
      main: mainStyle,
      overlay: overlayStyle,
      hasOverlay: overlay,
    };
  }, [backgroundSettings]);

  // 获取当前本地图片
  const currentLocalImageData = useMemo(() => {
    if (backgroundSettings.type === 'local' && backgroundSettings.currentLocalImage) {
      return backgroundSettings.localImages.find(
        img => img.id === backgroundSettings.currentLocalImage
      );
    }
    return null;
  }, [backgroundSettings.type, backgroundSettings.currentLocalImage, backgroundSettings.localImages]);

  // 计算本地图片总大小
  const totalLocalImagesSize = useMemo(() => {
    return backgroundSettings.localImages.reduce((total, img) => total + img.size, 0);
  }, [backgroundSettings.localImages]);

  return {
    // 设置数据
    settings: backgroundSettings,
    
    // 状态信息
    currentLocalImageData,
    totalLocalImagesSize,
    localImagesCount: backgroundSettings.localImages.length,
    
    // 样式信息
    backgroundStyles,
    
    // 操作方法
    updateBackground,
    setBackgroundType,
    setColorBackground,
    setGradientBackground,
    applyGradientPreset,
    addLocalImage,
    removeLocalImage,
    setCurrentLocalImage,
    updateDisplaySettings,
  };
}
