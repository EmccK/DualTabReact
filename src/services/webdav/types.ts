/**
 * WebDAV同步相关类型定义
 */

// 导出所有类型接口
export type WebDAVMethod = 'GET' | 'PUT' | 'DELETE' | 'PROPFIND' | 'MKCOL';
export type SyncStatus = 'idle' | 'syncing' | 'success' | 'error' | 'conflict';
export type ConflictResolution = 'use_local' | 'use_remote' | 'merge' | 'manual';

/**
 * WebDAV服务器配置
 */
export interface WebDAVConfig {
  /** 服务器地址 */
  serverUrl: string;
  /** 用户名 */
  username: string;
  /** 密码 */
  password: string;
  /** 同步路径 */
  syncPath: string;
  /** 启用状态 */
  enabled: boolean;
  /** 自动同步间隔（分钟） */
  autoSyncInterval: number;
}


/**
 * WebDAV请求选项
 */
export interface WebDAVRequestOptions {
  method: WebDAVMethod;
  url: string;
  headers?: Record<string, string>;
  body?: string | ArrayBuffer;
  timeout?: number;
  useDefaultContentType?: boolean;
}

/**
 * WebDAV响应
 */
export interface WebDAVResponse {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  data?: string | ArrayBuffer;
}

/**
 * WebDAV文件信息
 */
export interface WebDAVFileInfo {
  /** 文件名 */
  name: string;
  /** 完整路径 */
  path: string;
  /** 文件大小 */
  size: number;
  /** 最后修改时间 */
  lastModified: Date;
  /** 是否为目录 */
  isDirectory: boolean;
  /** ETag */
  etag?: string;
}

/**
 * 同步元数据
 */
export interface SyncMetadata {
  /** 最后同步时间 */
  lastSyncTime: number;
  /** 本地数据时间戳 */
  localTimestamp: number;
  /** 远程数据时间戳 */
  remoteTimestamp: number;
  /** 数据哈希值 */
  dataHash: string;
  /** 同步版本号 */
  version: string;
  /** 设备ID */
  deviceId: string;
}


/**
 * 同步结果
 */
export interface SyncResult {
  /** 同步状态 */
  status: SyncStatus;
  /** 消息 */
  message?: string;
  /** 错误信息 */
  error?: string;
  /** 同步时间戳 */
  timestamp: number;
  /** 是否有冲突 */
  hasConflict?: boolean;
  /** 冲突详情 */
  conflictInfo?: ConflictInfo;
}

/**
 * 冲突信息
 */
export interface ConflictInfo {
  /** 冲突类型 */
  type: 'data_conflict' | 'timestamp_conflict' | 'hash_mismatch';
  /** 本地数据 */
  localData: unknown;
  /** 远程数据 */
  remoteData: unknown;
  /** 本地时间戳 */
  localTimestamp: number;
  /** 远程时间戳 */
  remoteTimestamp: number;
  /** 冲突发生时间 */
  conflictTime: number;
}


/**
 * 同步配置
 */
export interface SyncConfig extends WebDAVConfig {
  /** 冲突解决策略 */
  conflictResolution: ConflictResolution;
  /** 备份保留天数 */
  backupRetentionDays: number;
  /** 启用增量同步 */
  enableIncrementalSync: boolean;
  /** 网络超时时间（秒） */
  networkTimeout: number;
  /** 重试次数 */
  maxRetries: number;
}

/**
 * 设备信息
 */
export interface DeviceInfo {
  /** 设备ID */
  id: string;
  /** 设备名称 */
  name: string;
  /** 浏览器信息 */
  browser: string;
  /** 操作系统 */
  platform: string;
  /** 创建时间 */
  createdAt: number;
  /** 最后活跃时间 */
  lastActiveAt: number;
}

/**
 * 同步数据包
 */
export interface SyncDataPackage {
  /** 元数据 */
  metadata: SyncMetadata;
  /** 设备信息 */
  device: DeviceInfo;
  /** 书签分类数据 */
  categories: unknown[];
  /** 书签数据 */
  bookmarks: unknown[];
  /** 应用设置 */
  settings: unknown;
  /** 数据版本 */
  version: string;
  /** 创建时间 */
  createdAt: number;
}

/**
 * 默认WebDAV配置
 */
export const DEFAULT_WEBDAV_CONFIG: WebDAVConfig = {
  serverUrl: '',
  username: '',
  password: '',
  syncPath: '/DualTab',
  enabled: false,
  autoSyncInterval: 30, // 30分钟
};

/**
 * 默认同步配置
 */
export const DEFAULT_SYNC_CONFIG: Omit<SyncConfig, keyof WebDAVConfig> = {
  conflictResolution: 'manual',
  backupRetentionDays: 7,
  enableIncrementalSync: true,
  networkTimeout: 30,
  maxRetries: 3,
};
