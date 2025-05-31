/**
 * 书签显示相关常量定义
 */

import type { BookmarkDisplayStyle, ResponsiveBreakpoints, BookmarkCardSize } from '@/types/bookmark-display.types';

// 显示样式常量
export const BOOKMARK_DISPLAY_STYLES = {
  DETAILED: 'detailed' as const,
  COMPACT: 'compact' as const,
} as const;

// 可用的显示样式列表
export const AVAILABLE_DISPLAY_STYLES: BookmarkDisplayStyle[] = [
  BOOKMARK_DISPLAY_STYLES.DETAILED,
  BOOKMARK_DISPLAY_STYLES.COMPACT,
];

// 显示样式标签映射
export const DISPLAY_STYLE_LABELS = {
  [BOOKMARK_DISPLAY_STYLES.DETAILED]: '详细样式',
  [BOOKMARK_DISPLAY_STYLES.COMPACT]: '紧凑样式',
} as const;

// 显示样式描述映射
export const DISPLAY_STYLE_DESCRIPTIONS = {
  [BOOKMARK_DISPLAY_STYLES.DETAILED]: '显示图标、标题和描述信息',
  [BOOKMARK_DISPLAY_STYLES.COMPACT]: '只显示图标和底部标题',
} as const;

// 响应式断点
export const RESPONSIVE_BREAKPOINTS: ResponsiveBreakpoints = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  xxl: 1536,
} as const;

// 默认卡片尺寸配置
export const DEFAULT_CARD_SIZES: Record<BookmarkDisplayStyle, BookmarkCardSize> = {
  [BOOKMARK_DISPLAY_STYLES.DETAILED]: {
    width: 160,
    height: 120,
    iconSize: 32,
    padding: 16,
    spacing: 12,
  },
  [BOOKMARK_DISPLAY_STYLES.COMPACT]: {
    width: 80,
    height: 96,
    iconSize: 40,
    padding: 12,
    spacing: 8,
  },
} as const;

// 卡片尺寸范围限制
export const CARD_SIZE_LIMITS = {
  width: { min: 60, max: 300 },
  height: { min: 60, max: 200 },
  iconSize: { min: 16, max: 64 },
  padding: { min: 4, max: 32 },
  spacing: { min: 2, max: 24 },
} as const;

// 边框圆角范围
export const BORDER_RADIUS_RANGE = {
  min: 0,
  max: 20,
  step: 1,
  default: 8,
} as const;

// 纵横比选项
export const ASPECT_RATIO_OPTIONS = [
  { label: '正方形 (1:1)', value: '1/1' },
  { label: '传统 (4:3)', value: '4/3' },
  { label: '宽屏 (16:9)', value: '16/9' },
  { label: '自适应', value: 'auto' },
] as const;

// 文本对齐选项
export const TEXT_ALIGNMENT_OPTIONS = [
  { label: '居左', value: 'left' },
  { label: '居中', value: 'center' },
  { label: '居右', value: 'right' },
] as const;

// 图标位置选项
export const ICON_POSITION_OPTIONS = [
  { label: '顶部', value: 'top' },
  { label: '左侧', value: 'left' },
  { label: '居中', value: 'center' },
] as const;

// 网格布局常量
export const GRID_LAYOUT = {
  MIN_COLUMNS: 1,
  MAX_COLUMNS: 12,
  DEFAULT_COLUMNS: 'auto' as const,
  MIN_GAP: 4,
  MAX_GAP: 32,
  DEFAULT_GAP: 16,
} as const;

// 动画时长常量
export const ANIMATION_DURATIONS = {
  FAST: 150,
  NORMAL: 250,
  SLOW: 350,
  EXTRA_SLOW: 500,
} as const;

// 默认动画配置
export const DEFAULT_ANIMATION_CONFIG = {
  hoverScale: 1.05,
  clickScale: 0.95,
  duration: ANIMATION_DURATIONS.NORMAL,
  easing: 'ease-out' as const,
} as const;
