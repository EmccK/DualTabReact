/**
 * WebDAV相关常量定义
 */

import type { 
  WebDAVConfig, 
  WebDAVConnectionSettings, 
  WebDAVValidationRules 
} from '../../types/webdav';

/**
 * 默认WebDAV配置
 */
export const DEFAULT_WEBDAV_CONFIG: WebDAVConfig = {
  serverUrl: '',
  username: '',
  password: '',
  basePath: '/dualtab',
  timeout: 30000, // 30秒
  useHttps: true,
  customHeaders: {},
};

/**
 * 默认WebDAV连接设置
 */
export const DEFAULT_CONNECTION_SETTINGS: WebDAVConnectionSettings = {
  enabled: false,
  config: DEFAULT_WEBDAV_CONFIG,
  autoSync: false,
  syncInterval: 30, // 30分钟
  maxRetries: 3,
  retryDelay: 5000, // 5秒
};

/**
 * WebDAV配置验证规则
 */
export const VALIDATION_RULES: WebDAVValidationRules = {
  urlPattern: /^https?:\/\/[^\s/$.?#].[^\s]*$/i,
  minUsernameLength: 1,
  minPasswordLength: 1,
  basePathPattern: /^\/[a-zA-Z0-9_\-/]*$/,
  timeoutRange: {
    min: 5000,   // 5秒
    max: 120000, // 2分钟
  },
  syncIntervalRange: {
    min: 5,    // 5分钟
    max: 1440, // 24小时
  },
};

/**
 * WebDAV HTTP方法常量
 */
export const WEBDAV_METHODS = {
  GET: 'GET',
  PUT: 'PUT',
  POST: 'POST',
  DELETE: 'DELETE',
  PROPFIND: 'PROPFIND',
  MKCOL: 'MKCOL',
} as const;

/**
 * WebDAV文件路径常量
 */
export const WEBDAV_PATHS = {
  BOOKMARKS: 'bookmarks.json',
  CATEGORIES: 'categories.json',
  SETTINGS: 'settings.json',
  SYNC_METADATA: '.sync-metadata.json',
} as const;
