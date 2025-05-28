/**
 * WebDAV类型统一导出
 */

// 配置相关类型
export type {
  WebDAVConfig,
  WebDAVConnectionSettings,
  WebDAVValidationRules,
  WebDAVConfigError,
  WebDAVConfigValidationResult,
} from './config';

// 客户端相关类型
export type {
  WebDAVResponse,
  WebDAVFile,
  WebDAVDirectory,
  WebDAVRequestOptions,
  WebDAVConnectionStatus,
  WebDAVError,
} from './client';

// 同步相关类型
export type {
  SyncStatus,
  SyncDirection,
  SyncProgress,
  SyncItem,
  SyncConflict,
  SyncHistory,
} from './sync';
