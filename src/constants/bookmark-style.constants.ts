/**
 * 新版书签样式常量
 */

import type { BookmarkStyleSettings } from '@/types/bookmark-style.types';

// 书签样式类型常量
export const BOOKMARK_STYLE_TYPES = {
  CARD: 'card' as const,   // 卡片式（图片1样式）
  ICON: 'icon' as const,   // 图标式（图片2样式）
} as const;

// 样式类型标签
export const STYLE_TYPE_LABELS = {
  [BOOKMARK_STYLE_TYPES.CARD]: '卡片样式',
  [BOOKMARK_STYLE_TYPES.ICON]: '图标样式',
} as const;

// 样式类型描述
export const STYLE_TYPE_DESCRIPTIONS = {
  [BOOKMARK_STYLE_TYPES.CARD]: '带背景的卡片式书签，图标和文字在同一行',
  [BOOKMARK_STYLE_TYPES.ICON]: '纯图标式书签，图标在上方，文字在下方',
} as const;

// 圆角设置范围
export const BORDER_RADIUS_CONFIG = {
  min: 0,
  max: 100,
  step: 1,
  default: 12,
} as const;

// 默认书签设置
export const DEFAULT_BOOKMARK_SETTINGS: BookmarkStyleSettings = {
  styleType: BOOKMARK_STYLE_TYPES.CARD,
  borderRadius: BORDER_RADIUS_CONFIG.default,
} as const;

// 预设圆角值
export const PRESET_BORDER_RADIUS = [
  { label: '无圆角', value: 0 },
  { label: '小圆角', value: 8 },
  { label: '中等圆角', value: 16 },
  { label: '大圆角', value: 24 },
  { label: '超大圆角', value: 50 },
  { label: '最大圆角', value: 100 },
] as const;

// 卡片样式配置
export const CARD_STYLE_CONFIG = {
  width: 200,           // 卡片宽度
  height: 60,           // 基础卡片高度
  heightWithDescription: 70,  // 显示描述时的卡片高度
  iconSize: 40,         // 图标大小
  padding: 12,          // 内边距
  spacing: 12,          // 图标和文字间距
} as const;

// 图标样式配置
export const ICON_STYLE_CONFIG = {
  iconSize: 64,         // 图标大小
  spacing: 8,           // 图标和文字间距
  textMaxWidth: 80,     // 文字最大宽度
} as const;

// 颜色配置
export const COLOR_PALETTE = [
  '#3b82f6', // 蓝色
  '#10b981', // 绿色
  '#f59e0b', // 黄色
  '#ef4444', // 红色
  '#8b5cf6', // 紫色
  '#06b6d4', // 青色
  '#f97316', // 橙色
  '#84cc16', // 青绿色
  '#ec4899', // 粉色
  '#6b7280', // 灰色
] as const;
