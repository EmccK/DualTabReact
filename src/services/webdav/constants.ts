/**
 * WebDAV同步相关常量配置
 */

/**
 * WebDAV HTTP状态码
 */
export const WEBDAV_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  MULTI_STATUS: 207,
  NOT_MODIFIED: 304,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  METHOD_NOT_ALLOWED: 405,
  CONFLICT: 409,
  PRECONDITION_FAILED: 412,
  LOCKED: 423,
  INTERNAL_SERVER_ERROR: 500,
  NOT_IMPLEMENTED: 501,
  INSUFFICIENT_STORAGE: 507,
} as const;

/**
 * WebDAV请求头
 */
export const WEBDAV_HEADERS = {
  CONTENT_TYPE: 'Content-Type',
  AUTHORIZATION: 'Authorization',
  DEPTH: 'Depth',
  DESTINATION: 'Destination',
  IF: 'If',
  LOCK_TOKEN: 'Lock-Token',
  OVERWRITE: 'Overwrite',
  TIMEOUT: 'Timeout',
  DAV: 'DAV',
  ETAG: 'ETag',
  IF_MATCH: 'If-Match',
  IF_NONE_MATCH: 'If-None-Match',
  LAST_MODIFIED: 'Last-Modified',
  CONTENT_LENGTH: 'Content-Length',
} as const;

/**
 * WebDAV Content-Type
 */
export const WEBDAV_CONTENT_TYPES = {
  XML: 'application/xml; charset=utf-8',
  JSON: 'application/json; charset=utf-8',
  TEXT: 'text/plain; charset=utf-8',
  OCTET_STREAM: 'application/octet-stream',
} as const;

/**
 * WebDAV PROPFIND 请求体模板
 */
export const PROPFIND_BODY = `<?xml version="1.0" encoding="utf-8"?>
<D:propfind xmlns:D="DAV:">
  <D:prop>
    <D:displayname/>
    <D:getcontentlength/>
    <D:getcontenttype/>
    <D:getlastmodified/>
    <D:getetag/>
    <D:resourcetype/>
  </D:prop>
</D:propfind>`;

/**
 * WebDAV MKCOL 请求体模板
 */
export const MKCOL_BODY = `<?xml version="1.0" encoding="utf-8"?>
<D:mkcol xmlns:D="DAV:">
  <D:set>
    <D:prop>
      <D:resourcetype>
        <D:collection/>
      </D:resourcetype>
    </D:prop>
  </D:set>
</D:mkcol>`;

/**
 * 同步文件名配置
 */
export const SYNC_FILES = {
  DATA: 'dualtab-data.json',
  METADATA: 'dualtab-metadata.json',
  BACKUP_PREFIX: 'dualtab-backup-',
  LOCK_FILE: '.dualtab-lock',
} as const;

/**
 * 同步相关常量
 */
export const SYNC_CONSTANTS = {
  /** 数据版本 */
  DATA_VERSION: '2.0.0',
  /** 最小同步间隔（毫秒） */
  MIN_SYNC_INTERVAL: 60 * 1000, // 1分钟
  /** 最大同步间隔（毫秒） */
  MAX_SYNC_INTERVAL: 24 * 60 * 60 * 1000, // 24小时
  /** 默认网络超时（毫秒） */
  DEFAULT_TIMEOUT: 30 * 1000, // 30秒
  /** 最大重试次数 */
  MAX_RETRIES: 3,
  /** 重试延迟基数（毫秒） */
  RETRY_DELAY_BASE: 1000,
  /** 锁文件超时时间（毫秒） */
  LOCK_TIMEOUT: 5 * 60 * 1000, // 5分钟
  /** 元数据缓存时间（毫秒） */
  METADATA_CACHE_TIME: 60 * 1000, // 1分钟
} as const;

/**
 * 错误消息
 */
export const ERROR_MESSAGES = {
  NETWORK_ERROR: '网络连接失败',
  AUTH_FAILED: '认证失败，请检查用户名和密码',
  SERVER_ERROR: 'WebDAV服务器错误',
  INVALID_CONFIG: 'WebDAV配置无效',
  SYNC_CONFLICT: '数据同步冲突',
  FILE_NOT_FOUND: '文件未找到',
  PERMISSION_DENIED: '权限不足',
  TIMEOUT: '请求超时',
  PARSE_ERROR: '数据解析失败',
  INVALID_RESPONSE: '服务器响应格式错误',
  SYNC_IN_PROGRESS: '同步正在进行中',
  LOCK_FAILED: '获取同步锁失败',
  BACKUP_FAILED: '创建备份失败',
  METADATA_INVALID: '元数据无效',
  HASH_MISMATCH: '数据完整性校验失败',
} as const;

/**
 * 成功消息
 */
export const SUCCESS_MESSAGES = {
  SYNC_SUCCESS: '数据同步成功',
  UPLOAD_SUCCESS: '上传成功',
  DOWNLOAD_SUCCESS: '下载成功',
  CONFIG_SAVED: 'WebDAV配置已保存',
  BACKUP_CREATED: '备份创建成功',
  CONFLICT_RESOLVED: '冲突已解决',
} as const;


/**
 * 设备平台识别
 */
export const DEVICE_PLATFORMS = {
  WINDOWS: 'Windows',
  MACOS: 'macOS',
  LINUX: 'Linux',
  ANDROID: 'Android',
  IOS: 'iOS',
  CHROME_OS: 'Chrome OS',
  UNKNOWN: 'Unknown',
} as const;

/**
 * 浏览器识别
 */
export const BROWSERS = {
  CHROME: 'Chrome',
  FIREFOX: 'Firefox',
  SAFARI: 'Safari',
  EDGE: 'Edge',
  OPERA: 'Opera',
  UNKNOWN: 'Unknown',
} as const;

/**
 * 日志级别
 */
export const LOG_LEVELS = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  DEBUG: 3,
} as const;

/**
 * 存储键名
 */
export const STORAGE_KEYS = {
  WEBDAV_CONFIG: 'webdav_config',
  SYNC_METADATA: 'sync_metadata',
  SYNC_STATUS: 'sync_status',
  DEVICE_INFO: 'device_info',
  LAST_SYNC_TIME: 'last_sync_time',
  SYNC_LOCK: 'sync_lock',
  CONFLICT_DATA: 'conflict_data',
} as const;
