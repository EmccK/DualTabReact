/**
 * 应用核心类型定义
 */

// 图标类型 - 统一定义，移除重复的类型
export type IconType = 'official' | 'text' | 'upload';

// 书签类型定义
export interface Bookmark {
  id: string;
  name: string; // 添加name字段作为title的别名
  title: string;
  url: string;
  categoryId?: string; // 所属分类ID
  internalUrl?: string; // 内网URL
  externalUrl?: string; // 外网URL
  description?: string; // 书签描述
  icon?: string;
  iconType?: IconType;
  iconText?: string; // 文字图标内容（支持任意字符数）
  iconImage?: string; // 图片图标URL
  iconData?: string; // 上传图片的base64数据
  originalIconImage?: string; // 原始图片数据（用于重新编辑）
  iconColor?: string; // 图标背景颜色
  imageScale?: import('./bookmark-style.types').ImageScaleConfig; // 图片缩放配置
  backgroundColor?: string;
  position?: number; // 书签在网格中的位置索引
  createdAt: number;
  updatedAt: number;
}

// 书签分类类型定义
export interface BookmarkCategory {
  id: string;
  name: string;
  icon: string;
  color: string;
  bookmarks: string[]; // 书签ID列表
  createdAt: number;
  updatedAt: number;
}

// 右键菜单项类型
export interface ContextMenuItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
  className?: string;
  disabled?: boolean;
  separator?: boolean;
}

// 网络模式类型
export type NetworkMode = 'internal' | 'external';

// 应用设置类型
export interface AppSettings {
  networkMode: NetworkMode;
  enableBlur: boolean;
  enableAnimations: boolean;
  autoSync: boolean;
  [key: string]: any;
}

// API限制信息类型
export interface ApiLimits {
  limit: number;
  remaining: number;
  reset: number;
}

// 备份数据类型
export interface BackupData {
  bookmarks: Bookmark[];
  categories: BookmarkCategory[];
  settings: AppSettings;
  networkMode: NetworkMode;
  timestamp: number;
  version: string;
}

// Chrome Storage 响应类型
export interface StorageResponse<T = any> {
  [key: string]: T;
}

// 操作结果类型
export interface OperationResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

// 搜索相关类型
export * from './search';