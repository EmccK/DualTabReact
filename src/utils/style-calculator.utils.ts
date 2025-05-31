/**
 * 书签显示样式计算工具函数
 */

import type { BookmarkDisplayStyle, BookmarkCardSize, BookmarkGridConfig } from '@/types/bookmark-display.types';
import type { BookmarkSettings } from '@/types/settings';
import { DEFAULT_CARD_SIZES, CARD_SIZE_LIMITS, RESPONSIVE_BREAKPOINTS } from '@/constants';

/**
 * 计算卡片尺寸
 */
export const calculateCardSize = (
  displayStyle: BookmarkDisplayStyle,
  bookmarkSettings?: BookmarkSettings
): BookmarkCardSize => {
  const defaultSize = DEFAULT_CARD_SIZES[displayStyle];
  
  if (!bookmarkSettings) {
    return defaultSize;
  }

  return {
    width: Math.max(
      CARD_SIZE_LIMITS.width.min,
      Math.min(CARD_SIZE_LIMITS.width.max, bookmarkSettings.grid.minCardWidth)
    ),
    height: defaultSize.height,
    iconSize: Math.max(
      CARD_SIZE_LIMITS.iconSize.min,
      Math.min(CARD_SIZE_LIMITS.iconSize.max, bookmarkSettings.display.iconSize)
    ),
    padding: Math.max(
      CARD_SIZE_LIMITS.padding.min,
      Math.min(CARD_SIZE_LIMITS.padding.max, bookmarkSettings.display.cardPadding)
    ),
    spacing: Math.max(
      CARD_SIZE_LIMITS.spacing.min,
      Math.min(CARD_SIZE_LIMITS.spacing.max, bookmarkSettings.display.cardSpacing)
    ),
  };
};

/**
 * 计算网格布局配置
 */
export const calculateGridLayout = (
  containerWidth: number,
  displayStyle: BookmarkDisplayStyle,
  bookmarkSettings?: BookmarkSettings
): BookmarkGridConfig => {
  const cardSize = calculateCardSize(displayStyle, bookmarkSettings);
  const gap = bookmarkSettings?.display.cardSpacing || 16;
  
  // 计算每行可容纳的项目数
  const availableWidth = containerWidth - gap * 2; // 减去左右边距
  const itemWidth = cardSize.width + gap;
  const maxItemsPerRow = Math.floor(availableWidth / itemWidth);
  
  // 确保至少有1列
  const itemsPerRow = Math.max(1, maxItemsPerRow);
  
  // 如果设置了固定列数
  const columns = bookmarkSettings?.grid.columns || 'auto';
  const finalItemsPerRow = columns === 'auto' ? itemsPerRow : Math.min(columns, itemsPerRow);

  return {
    columns: finalItemsPerRow,
    gap,
    containerWidth,
    containerHeight: 0, // 将在运行时计算
    itemsPerRow: finalItemsPerRow,
  };
};

/**
 * 计算响应式列数
 */
export const calculateResponsiveColumns = (
  containerWidth: number,
  displayStyle: BookmarkDisplayStyle
): number => {
  const cardSize = DEFAULT_CARD_SIZES[displayStyle];
  const minGap = 16;
  
  if (containerWidth <= RESPONSIVE_BREAKPOINTS.sm) {
    // 小屏幕：根据卡片宽度计算
    return Math.max(1, Math.floor(containerWidth / (cardSize.width + minGap)));
  } else if (containerWidth <= RESPONSIVE_BREAKPOINTS.md) {
    // 中屏幕
    return displayStyle === 'compact' ? 6 : 4;
  } else if (containerWidth <= RESPONSIVE_BREAKPOINTS.lg) {
    // 大屏幕
    return displayStyle === 'compact' ? 8 : 6;
  } else if (containerWidth <= RESPONSIVE_BREAKPOINTS.xl) {
    // 超大屏幕
    return displayStyle === 'compact' ? 10 : 8;
  } else {
    // 超超大屏幕
    return displayStyle === 'compact' ? 12 : 10;
  }
};

/**
 * 计算纵横比
 */
export const calculateAspectRatio = (
  aspectRatioSetting: string,
  displayStyle: BookmarkDisplayStyle
): number => {
  switch (aspectRatioSetting) {
    case '1/1':
      return 1;
    case '4/3':
      return 4 / 3;
    case '16/9':
      return 16 / 9;
    case 'auto':
    default:
      // 根据显示样式返回默认纵横比
      return displayStyle === 'compact' ? 1 : 4 / 3;
  }
};

/**
 * 计算动画缩放值
 */
export const calculateAnimationScale = (
  state: {
    isHovered: boolean;
    isClicked: boolean;
    isDragging: boolean;
    isDragOver: boolean;
  },
  hoverScale: number = 1.05
): number => {
  if (state.isClicked) {
    return 0.95;
  } else if (state.isDragOver) {
    return 1.08;
  } else if (state.isHovered) {
    return hoverScale;
  } else if (state.isDragging) {
    return 0.95;
  }
  
  return 1;
};

/**
 * 生成CSS Grid样式
 */
export const generateGridStyles = (
  config: BookmarkGridConfig
): React.CSSProperties => {
  return {
    display: 'grid',
    gridTemplateColumns: `repeat(${config.itemsPerRow}, 1fr)`,
    gap: `${config.gap}px`,
    width: '100%',
    padding: `${config.gap}px`,
  };
};

/**
 * 生成卡片容器样式
 */
export const generateCardContainerStyles = (
  cardSize: BookmarkCardSize,
  aspectRatio: number,
  borderRadius: number
): React.CSSProperties => {
  return {
    width: `${cardSize.width}px`,
    height: `${cardSize.width / aspectRatio}px`,
    padding: `${cardSize.padding}px`,
    borderRadius: `${borderRadius}px`,
    position: 'relative',
    overflow: 'hidden',
  };
};

/**
 * 计算文字大小
 */
export const calculateFontSize = (
  displayStyle: BookmarkDisplayStyle,
  cardSize: BookmarkCardSize
): { title: number; description: number } => {
  const baseFontSize = displayStyle === 'compact' ? 12 : 14;
  const scaleFactor = cardSize.width / DEFAULT_CARD_SIZES[displayStyle].width;
  
  return {
    title: Math.max(10, Math.round(baseFontSize * scaleFactor)),
    description: Math.max(9, Math.round((baseFontSize - 2) * scaleFactor)),
  };
};

/**
 * 检查是否需要显示滚动条
 */
export const shouldShowScrollbar = (
  itemCount: number,
  itemsPerRow: number,
  maxVisibleRows: number = 4
): boolean => {
  const totalRows = Math.ceil(itemCount / itemsPerRow);
  return totalRows > maxVisibleRows;
};

/**
 * 计算虚拟滚动参数
 */
export const calculateVirtualScrollParams = (
  itemCount: number,
  itemsPerRow: number,
  cardHeight: number,
  gap: number,
  containerHeight: number
): {
  totalHeight: number;
  visibleRows: number;
  startIndex: number;
  endIndex: number;
} => {
  const totalRows = Math.ceil(itemCount / itemsPerRow);
  const rowHeight = cardHeight + gap;
  const totalHeight = totalRows * rowHeight;
  const visibleRows = Math.ceil(containerHeight / rowHeight) + 1; // 多渲染一行
  
  return {
    totalHeight,
    visibleRows,
    startIndex: 0, // 将在滚动时动态计算
    endIndex: Math.min(itemCount - 1, visibleRows * itemsPerRow - 1),
  };
};
