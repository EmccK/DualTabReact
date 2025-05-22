/**
 * 应用核心类型定义
 */

// 书签类型定义
export interface Bookmark {
  id: string;
  title: string;
  url: string;
  internalUrl?: string; // 内网URL
  externalUrl?: string; // 外网URL
  icon?: string;
  iconType?: 'official' | 'text' | 'upload';
  iconText?: string;
  iconColor?: string;
  backgroundColor?: string;
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

// 网络模式类型
export type NetworkMode = 'internal' | 'external';

// 应用设置类型
export interface AppSettings {
  networkMode: NetworkMode;
  enableBlur: boolean;
  enableAnimations: boolean;
  autoSync: boolean;
  webdav_config?: {
    url: string;
    username: string;
    password: string;
  };
  splash_api_key?: string;
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
