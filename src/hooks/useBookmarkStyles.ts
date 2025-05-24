import { useMemo } from 'react';
import type { BookmarkSettings } from '@/types/settings';

/**
 * 书签样式应用Hook
 * 根据设置生成CSS样式和类名
 */
export function useBookmarkStyles(settings: BookmarkSettings) {
  // 生成网格样式
  const gridStyles = useMemo(() => {
    const styles: React.CSSProperties = {
      gap: `${settings.display.cardSpacing}px`,
    };

    // 根据设置生成网格列
    if (settings.grid.columns === 'auto' || settings.grid.responsive) {
      // 响应式网格
      if (settings.display.itemsPerRow === 'auto') {
        // 完全自适应
        styles.gridTemplateColumns = `repeat(auto-fill, minmax(${settings.grid.minCardWidth}px, 1fr))`;
      } else {
        // 固定每行数量
        styles.gridTemplateColumns = `repeat(${settings.display.itemsPerRow}, 1fr)`;
      }
    } else {
      // 固定列数
      styles.gridTemplateColumns = `repeat(${settings.grid.columns}, 1fr)`;
    }

    return styles;
  }, [settings.display, settings.grid]);

  // 生成卡片样式
  const cardStyles = useMemo(() => {
    const styles: React.CSSProperties = {
      padding: `${settings.display.cardPadding}px`,
      aspectRatio: settings.grid.aspectRatio,
      minWidth: `${settings.grid.minCardWidth}px`,
      maxWidth: `${settings.grid.maxCardWidth}px`,
    };

    // 悬停效果
    if (settings.behavior.enableHover) {
      styles.transition = 'transform 0.2s ease, box-shadow 0.2s ease';
    }

    return styles;
  }, [settings.display, settings.grid, settings.behavior]);

  // 生成图标样式
  const iconStyles = useMemo(() => ({
    width: `${settings.display.iconSize}px`,
    height: `${settings.display.iconSize}px`,
  }), [settings.display.iconSize]);

  // 生成CSS类名
  const gridClasses = useMemo(() => {
    const classes = ['grid'];
    
    // 响应式断点类名
    if (settings.grid.responsive && settings.display.itemsPerRow === 'auto') {
      classes.push(
        'grid-cols-2', 
        'sm:grid-cols-3', 
        'md:grid-cols-4', 
        'lg:grid-cols-5', 
        'xl:grid-cols-6',
        '2xl:grid-cols-8'
      );
    }
    
    return classes.join(' ');
  }, [settings.grid, settings.display]);

  // 生成卡片CSS类名
  const cardClasses = useMemo(() => {
    const classes = ['bookmark-card'];
    
    if (settings.behavior.enableHover) {
      classes.push('hover-enabled');
    }
    
    if (settings.behavior.clickAnimation) {
      classes.push('click-animation');
    }
    
    return classes.join(' ');
  }, [settings.behavior]);

  // 悬停缩放值
  const hoverScale = settings.behavior.enableHover ? settings.behavior.hoverScale : 1;

  return {
    gridStyles,
    cardStyles,
    iconStyles,
    gridClasses,
    cardClasses,
    hoverScale,
    showTitle: settings.display.showTitle,
    showFavicons: settings.display.showFavicons,
    showDescriptions: settings.display.showDescriptions,
    enableDrag: settings.behavior.enableDrag,
    openIn: settings.behavior.openIn,
  };
}

/**
 * 分类布局样式Hook
 */
export function useCategoryLayoutStyles(settings: BookmarkSettings) {
  const layoutStyles = useMemo(() => {
    if (settings.categories.layout === 'sidebar') {
      return {
        sidebarWidth: settings.categories.sidebarWidth,
        mainWidth: `calc(100% - ${settings.categories.sidebarWidth + 24}px)`, // 24px为间距
      };
    }
    return {
      sidebarWidth: 0,
      mainWidth: '100%',
    };
  }, [settings.categories]);

  return {
    ...layoutStyles,
    layout: settings.categories.layout,
    style: settings.categories.style,
    showEmpty: settings.categories.showEmpty,
    enableSort: settings.categories.enableSort,
    tabPosition: settings.categories.tabPosition,
  };
}
