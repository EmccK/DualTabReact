/**
 * Unsplash设置相关类型定义
 */

// Unsplash API密钥设置
export interface UnsplashAPISettings {
  /** 自定义API密钥 */
  customApiKey: string;
  /** 是否使用自定义密钥 */
  useCustomKey: boolean;
  /** API密钥验证状态 */
  keyValidation: {
    isValid: boolean;
    lastVerified: number;
    errorMessage?: string;
  };
}

// Unsplash偏好设置
export interface UnsplashPreferences {
  /** 默认分类偏好 */
  defaultCategory: string;
  /** 图片质量选择 */
  imageQuality: 'regular' | 'full';
  /** 是否显示作者信息 */
  showAuthorInfo: boolean;
  /** 搜索语言偏好 */
  searchLanguage: 'en' | 'zh' | 'auto';
}

// API使用统计
export interface APIUsageStats {
  /** 当前小时请求数 */
  currentHourRequests: number;
  /** 今日总请求数 */
  dailyRequests: number;
  /** 月度总请求数 */
  monthlyRequests: number;
  /** 上次重置时间 */
  lastResetTime: number;
  /** API限制信息 */
  limits: {
    hourly: number;
    daily: number;
    monthly: number;
  };
}

// Unsplash完整设置
export interface UnsplashSettings {
  api: UnsplashAPISettings;
  preferences: UnsplashPreferences;
  usage: APIUsageStats;
}
