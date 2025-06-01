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

// 图标类型描述映射
export const ICON_TYPE_DESCRIPTIONS = {
  [ICON_TYPES.OFFICIAL]: '自动获取网站的官方图标',
  [ICON_TYPES.TEXT]: '使用文字创建自定义图标',
  [ICON_TYPES.UPLOAD]: '上传本地图片作为图标',
} as const;

// 图标尺寸预设
export const ICON_SIZE_PRESETS = [
  { label: '小 (24px)', value: 24 },
  { label: '中 (32px)', value: 32 },
  { label: '大 (48px)', value: 48 },
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
  { label: '圆形', value: 20 },
] as const;

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

// 预设文字颜色
export const PRESET_TEXT_COLORS = [
  { label: '白色', value: '#ffffff' },
  { label: '黑色', value: '#000000' },
  { label: '灰色', value: '#6b7280' },
] as const;

// 简化的favicon服务URL
export const FAVICON_SERVICE_URLS = [
  'https://www.google.com/s2/favicons?domain={domain}&sz={size}',
  'https://icons.duckduckgo.com/ip3/{domain}.ico',
] as const;

// 图标缓存配置
export const ICON_CACHE_CONFIG = {
  maxSize: 100, // 条目数量
  maxAge: 24 * 60 * 60 * 1000, // 24小时
  cleanupInterval: 60 * 60 * 1000, // 1小时清理一次
} as const;

// 图标加载配置
export const ICON_LOAD_CONFIG = {
  timeout: 5000, // 5秒超时
  maxRetries: 2, // 最大重试次数
  retryDelay: 1000, // 重试延迟
} as const;

// 支持的图片格式
export const SUPPORTED_IMAGE_FORMATS = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'image/webp',
] as const;

// 上传图片限制
export const UPLOAD_IMAGE_LIMITS = {
  maxSize: 2 * 1024 * 1024, // 2MB
  maxWidth: 256,
  maxHeight: 256,
  quality: 0.8,
} as const;

// 内网域名检测模式
export const INTERNAL_DOMAIN_PATTERNS = [
  'localhost',
  '127.0.0.1',
  '192.168.',
  '10.',
  '172.16.',
  '.local',
  '.lan',
] as const;

// 默认图标设置
export const DEFAULT_ICON_SETTINGS = {
  size: 32,
  borderRadius: 8,
  backgroundColor: '#3b82f6',
  textColor: '#ffffff',
  fontSize: 20,
  fontWeight: 'bold',
} as const;

// 导出所有常量的默认对象
export default {
  ICON_TYPES,
  AVAILABLE_ICON_TYPES,
  ICON_TYPE_LABELS,
  ICON_TYPE_DESCRIPTIONS,
  ICON_SIZE_PRESETS,
  ICON_SIZE_RANGE,
  BORDER_RADIUS_PRESETS,
  PRESET_BACKGROUND_COLORS,
  PRESET_TEXT_COLORS,
  FAVICON_SERVICE_URLS,
  ICON_CACHE_CONFIG,
  ICON_LOAD_CONFIG,
  SUPPORTED_IMAGE_FORMATS,
  UPLOAD_IMAGE_LIMITS,
  INTERNAL_DOMAIN_PATTERNS,
  DEFAULT_ICON_SETTINGS,
};
