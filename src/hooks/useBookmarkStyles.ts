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
      transition: 'transform 0.2s ease, box-shadow 0.2s ease', // 始终启用过渡效果
    };

    return styles;
  }, [settings.display, settings.grid]);

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
    
    // 始终启用悬停和点击动画
    classes.push('hover-enabled');
    classes.push('click-animation');
    
    return classes.join(' ');
  }, []);

  // 悬停缩放值 - 悬停效果始终启用
  const hoverScale = settings.behavior.hoverScale;

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
    enableDragSort: true, // 拖拽排序始终启用
    openIn: settings.behavior.openIn,
  };
}

/**
 * 分类布局样式Hook
 */
export function useCategoryLayoutStyles(settings: BookmarkSettings) {
  const layoutStyles = useMemo(() => {
    // 分类布局始终为右侧边栏，使用固定宽度
    const SIDEBAR_WIDTH = 160;
    return {
      sidebarWidth: SIDEBAR_WIDTH,
      mainWidth: `calc(100% - ${SIDEBAR_WIDTH + 24}px)`, // 24px为间距
    };
  }, []);

  return {
    ...layoutStyles,
    layout: 'sidebar', // 始终为右侧边栏
    style: 'simple', // 始终为简单样式
    showEmpty: true, // 始终显示空分类
    enableSort: true, // 始终启用分类排序
  };
}
