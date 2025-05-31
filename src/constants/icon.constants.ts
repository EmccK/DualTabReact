/**
 * 图标相关常量定义
 */

import type { IconType, IconStatus } from '@/types/bookmark-icon.types';

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

// 图标类型描述映射
export const ICON_TYPE_DESCRIPTIONS = {
  [ICON_TYPES.OFFICIAL]: '自动获取网站的官方图标',
  [ICON_TYPES.TEXT]: '使用文字创建自定义图标',
  [ICON_TYPES.UPLOAD]: '上传本地图片作为图标',
} as const;

// 图标状态常量
export const ICON_STATUS = {
  LOADING: 'loading' as const,
  LOADED: 'loaded' as const,
  ERROR: 'error' as const,
  FALLBACK: 'fallback' as const,
} as const;

// 图标尺寸预设
export const ICON_SIZE_PRESETS = [
  { label: '小 (16px)', value: 16 },
  { label: '中 (24px)', value: 24 },
  { label: '默认 (32px)', value: 32 },
  { label: '大 (40px)', value: 40 },
  { label: '特大 (48px)', value: 48 },
  { label: '巨大 (64px)', value: 64 },
] as const;

// 图标尺寸范围
export const ICON_SIZE_RANGE = {
  min: 16,
  max: 64,
  step: 2,
  default: 32,
} as const;

// 边框圆角预设
export const BORDER_RADIUS_PRESETS = [
  { label: '直角', value: 0 },
  { label: '轻微', value: 4 },
  { label: '适中', value: 8 },
  { label: '圆润', value: 12 },
  { label: '很圆', value: 16 },
  { label: '圆形', value: 20 },
] as const;

// 边框宽度选项
export const BORDER_WIDTH_OPTIONS = [
  { label: '无边框', value: 0 },
  { label: '细 (1px)', value: 1 },
  { label: '中 (2px)', value: 2 },
  { label: '粗 (3px)', value: 3 },
  { label: '很粗 (4px)', value: 4 },
  { label: '最粗 (5px)', value: 5 },
] as const;

// 字体粗细选项
export const FONT_WEIGHT_OPTIONS = [
  { label: '正常', value: 'normal' },
  { label: '中等', value: 'medium' },
  { label: '粗体', value: 'bold' },
] as const;

// 对象填充方式选项
export const OBJECT_FIT_OPTIONS = [
  { label: '覆盖', value: 'cover' },
  { label: '包含', value: 'contain' },
  { label: '填充', value: 'fill' },
  { label: '缩小', value: 'scale-down' },
] as const;

// 默认颜色调色板
export const DEFAULT_COLOR_PALETTE = [
  '#ffffff', // white
  '#000000', // black
  '#3b82f6', // blue-500
  '#ef4444', // red-500
  '#10b981', // emerald-500
  '#f59e0b', // amber-500
  '#8b5cf6', // violet-500
  '#ec4899', // pink-500
  '#06b6d4', // cyan-500
  '#84cc16', // lime-500
  '#f97316', // orange-500
  '#6366f1', // indigo-500
  '#14b8a6', // teal-500
  '#a855f7', // purple-500
] as const;

// 预设背景色
export const PRESET_BACKGROUND_COLORS = [
  { label: '白色', value: '#ffffff' },
  { label: '蓝色', value: '#3b82f6' },
  { label: '红色', value: '#ef4444' },
  { label: '绿色', value: '#10b981' },
  { label: '黄色', value: '#f59e0b' },
  { label: '紫色', value: '#8b5cf6' },
  { label: '粉色', value: '#ec4899' },
  { label: '青色', value: '#06b6d4' },
  { label: '橙色', value: '#f97316' },
  { label: '灰色', value: '#6b7280' },
  { label: '黑色', value: '#1f2937' },
] as const;

// 预设文字颜色
export const PRESET_TEXT_COLORS = [
  { label: '白色', value: '#ffffff' },
  { label: '黑色', value: '#000000' },
  { label: '灰色', value: '#6b7280' },
  { label: '蓝色', value: '#3b82f6' },
  { label: '红色', value: '#ef4444' },
] as const;

// 官方图标获取服务URL模板
export const FAVICON_SERVICE_URLS = [
  'https://www.google.com/s2/favicons?domain={domain}&sz={size}',
  'https://icons.duckduckgo.com/ip3/{domain}.ico',
  'https://{domain}/favicon.ico',
  'https://favicons.githubusercontent.com/{domain}',
] as const;

// 图标缓存配置
export const ICON_CACHE_CONFIG = {
  maxSize: 50, // MB
  maxAge: 24 * 60 * 60 * 1000, // 24小时
  cleanupInterval: 60 * 60 * 1000, // 1小时清理一次
} as const;

// 图标加载重试配置
export const ICON_RETRY_CONFIG = {
  maxRetries: 3,
  retryDelay: 1000, // 1秒
  backoffMultiplier: 2,
  maxRetryDelay: 10000, // 10秒
} as const;

// 支持的图片格式
export const SUPPORTED_IMAGE_FORMATS = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml',
] as const;

// 上传图片限制
export const UPLOAD_IMAGE_LIMITS = {
  maxSize: 5 * 1024 * 1024, // 5MB
  maxWidth: 512,
  maxHeight: 512,
  quality: 0.8,
} as const;
