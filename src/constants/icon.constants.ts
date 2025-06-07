/**
 * 图标相关常量定义 - 简化版本
 * 只保留核心的、真正使用的常量
 */

import type { IconType } from '@/types/index';

// 图标类型常量
export const ICON_TYPES = {
  OFFICIAL: 'official' as const,
  TEXT: 'text' as const,
  UPLOAD: 'upload' as const,
} as const;

// 可用图标类型列表
export const AVAILABLE_ICON_TYPES: IconType[] = [
  ICON_TYPES.OFFICIAL,
  ICON_TYPES.TEXT,
  ICON_TYPES.UPLOAD,
];

// 图标类型标签映射
export const ICON_TYPE_LABELS = {
  [ICON_TYPES.OFFICIAL]: '网站图标',
  [ICON_TYPES.TEXT]: '文字图标',
  [ICON_TYPES.UPLOAD]: '上传图片',
} as const;


// 预设背景色
export const PRESET_BACKGROUND_COLORS = [
  { label: '蓝色', value: '#3b82f6' },
  { label: '红色', value: '#ef4444' },
  { label: '绿色', value: '#10b981' },
  { label: '黄色', value: '#f59e0b' },
  { label: '紫色', value: '#8b5cf6' },
  { label: '粉色', value: '#ec4899' },
  { label: '青色', value: '#06b6d4' },
  { label: '橙色', value: '#f97316' },
] as const;


