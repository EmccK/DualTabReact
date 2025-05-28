/**
 * WebDAV配置相关类型定义
 */

export interface WebDAVConfig {
  /** 服务器URL */
  serverUrl: string;
  /** 用户名 */
  username: string;
  /** 密码 */
  password: string;
  /** 基础路径 */
  basePath: string;
  /** 连接超时时间（毫秒） */
  timeout: number;
  /** 是否使用HTTPS */
  useHttps: boolean;
  /** 自定义请求头 */
  customHeaders?: Record<string, string>;
}

export interface WebDAVConnectionSettings {
  /** 是否启用WebDAV同步 */
  enabled: boolean;
  /** 连接配置 */
  config: WebDAVConfig;
  /** 是否自动同步 */
  autoSync: boolean;
  /** 同步间隔（分钟） */
  syncInterval: number;
  /** 最大重试次数 */
  maxRetries: number;
  /** 重试延迟（毫秒） */
  retryDelay: number;
}

export interface WebDAVValidationRules {
  /** URL正则验证 */
  urlPattern: RegExp;
  /** 用户名最小长度 */
  minUsernameLength: number;
  /** 密码最小长度 */
  minPasswordLength: number;
  /** 基础路径格式 */
  basePathPattern: RegExp;
  /** 超时时间范围 */
  timeoutRange: {
    min: number;
    max: number;
  };
  /** 同步间隔范围 */
  syncIntervalRange: {
    min: number;
    max: number;
  };
}

export interface WebDAVConfigError {
  /** 错误字段 */
  field: keyof WebDAVConfig;
  /** 错误消息 */
  message: string;
  /** 错误代码 */
  code: string;
}

export type WebDAVConfigValidationResult = {
  /** 是否有效 */
  isValid: boolean;
  /** 错误列表 */
  errors: WebDAVConfigError[];
};
