/**
 * Unsplash设置服务
 * 处理API密钥验证、偏好设置和使用统计
 */

import type { 
  UnsplashSettings, 
  UnsplashAPISettings, 
  UnsplashPreferences, 
  APIUsageStats 
} from '@/types/background/unsplashSettings';

const STORAGE_KEYS = {
  UNSPLASH_SETTINGS: 'unsplash_settings',
  API_USAGE_STATS: 'api_usage_stats'
} as const;

// 默认Unsplash设置
const DEFAULT_UNSPLASH_SETTINGS: UnsplashSettings = {
  api: {
    customApiKey: '',
    useCustomKey: false,
    keyValidation: {
      isValid: false,
      lastVerified: 0
    }
  },
  preferences: {
    defaultCategory: 'nature',
    imageQuality: 'regular',
    showAuthorInfo: true,
    searchLanguage: 'auto'
  },
  usage: {
    currentHourRequests: 0,
    dailyRequests: 0,
    monthlyRequests: 0,
    lastResetTime: Date.now(),
    limits: {
      hourly: 50,
      daily: 5000,
      monthly: 50000
    }
  }
};

export class UnsplashSettingsService {
  /**
   * 获取Unsplash设置
   */
  static async getSettings(): Promise<UnsplashSettings> {
    try {
      const result = await chrome.storage.local.get([STORAGE_KEYS.UNSPLASH_SETTINGS]);
      return {
        ...DEFAULT_UNSPLASH_SETTINGS,
        ...(result[STORAGE_KEYS.UNSPLASH_SETTINGS] || {})
      };
    } catch (error) {
      console.error('Failed to get Unsplash settings:', error);
      return DEFAULT_UNSPLASH_SETTINGS;
    }
  }

  /**
   * 保存Unsplash设置
   */
  static async saveSettings(settings: Partial<UnsplashSettings>): Promise<void> {
    try {
      const currentSettings = await this.getSettings();
      const updatedSettings = {
        ...currentSettings,
        ...settings
      };
      
      await chrome.storage.local.set({
        [STORAGE_KEYS.UNSPLASH_SETTINGS]: updatedSettings
      });
    } catch (error) {
      console.error('Failed to save Unsplash settings:', error);
      throw error;
    }
  }

  /**
   * 验证API密钥
   * 使用/photos/random接口进行验证
   */
  static async validateApiKey(apiKey: string): Promise<{
    isValid: boolean;
    errorMessage?: string;
    userInfo?: any;
  }> {
    try {
      const response = await fetch('https://api.unsplash.com/photos/random?count=1', {
        headers: {
          'Authorization': `Client-ID ${apiKey}`,
          'Accept-Version': 'v1'
        }
      });

      if (response.ok) {
        const photoData = await response.json();
        
        // 更新验证状态
        await this.updateApiValidation(apiKey, true);
        
        return {
          isValid: true,
          userInfo: { photoTest: true } // 简化的验证结果
        };
      } else {
        const errorData = await response.json();
        const errorMessage = errorData.errors?.[0] || 'API密钥验证失败';
        
        await this.updateApiValidation(apiKey, false, errorMessage);
        
        return {
          isValid: false,
          errorMessage
        };
      }
    } catch (error) {
      const errorMessage = '网络连接错误，请检查网络后重试';
      await this.updateApiValidation(apiKey, false, errorMessage);
      
      return {
        isValid: false,
        errorMessage
      };
    }
  }

  /**
   * 更新API验证状态
   */
  private static async updateApiValidation(
    apiKey: string, 
    isValid: boolean, 
    errorMessage?: string
  ): Promise<void> {
    const settings = await this.getSettings();
    settings.api.keyValidation = {
      isValid,
      lastVerified: Date.now(),
      errorMessage
    };
    
    if (isValid) {
      settings.api.customApiKey = apiKey;
    }
    
    await this.saveSettings(settings);
  }

  /**
   * 更新API使用统计
   */
  static async updateUsageStats(requestType: 'search' | 'download' | 'random' = 'search'): Promise<void> {
    try {
      const settings = await this.getSettings();
      const now = Date.now();
      const currentHour = Math.floor(now / (1000 * 60 * 60));
      const currentDay = Math.floor(now / (1000 * 60 * 60 * 24));
      const currentMonth = Math.floor(now / (1000 * 60 * 60 * 24 * 30));
      
      const lastResetHour = Math.floor(settings.usage.lastResetTime / (1000 * 60 * 60));
      const lastResetDay = Math.floor(settings.usage.lastResetTime / (1000 * 60 * 60 * 24));
      const lastResetMonth = Math.floor(settings.usage.lastResetTime / (1000 * 60 * 60 * 24 * 30));

      // 重置计数器
      if (currentHour > lastResetHour) {
        settings.usage.currentHourRequests = 0;
      }
      if (currentDay > lastResetDay) {
        settings.usage.dailyRequests = 0;
      }
      if (currentMonth > lastResetMonth) {
        settings.usage.monthlyRequests = 0;
      }

      // 增加请求计数
      settings.usage.currentHourRequests++;
      settings.usage.dailyRequests++;
      settings.usage.monthlyRequests++;
      settings.usage.lastResetTime = now;

      await this.saveSettings(settings);
    } catch (error) {
      console.error('Failed to update usage stats:', error);
    }
  }

  /**
   * 检查API使用限制
   */
  static async checkUsageLimits(): Promise<{
    canRequest: boolean;
    limitType?: 'hourly' | 'daily' | 'monthly';
    resetTime?: number;
  }> {
    const settings = await this.getSettings();
    const { usage } = settings;

    // 检查小时限制
    if (usage.currentHourRequests >= usage.limits.hourly) {
      const nextHour = Math.ceil(Date.now() / (1000 * 60 * 60)) * (1000 * 60 * 60);
      return {
        canRequest: false,
        limitType: 'hourly',
        resetTime: nextHour
      };
    }

    // 检查日限制
    if (usage.dailyRequests >= usage.limits.daily) {
      const nextDay = Math.ceil(Date.now() / (1000 * 60 * 60 * 24)) * (1000 * 60 * 60 * 24);
      return {
        canRequest: false,
        limitType: 'daily',
        resetTime: nextDay
      };
    }

    // 检查月限制
    if (usage.monthlyRequests >= usage.limits.monthly) {
      const nextMonth = Math.ceil(Date.now() / (1000 * 60 * 60 * 24 * 30)) * (1000 * 60 * 60 * 24 * 30);
      return {
        canRequest: false,
        limitType: 'monthly',
        resetTime: nextMonth
      };
    }

    return { canRequest: true };
  }

  /**
   * 获取当前使用的API密钥
   */
  static async getCurrentApiKey(): Promise<string> {
    const settings = await this.getSettings();
    
    if (settings.api.useCustomKey && settings.api.customApiKey) {
      return settings.api.customApiKey;
    }
    
    // 返回默认API密钥（从环境变量或配置文件获取）
    return import.meta.env.VITE_UNSPLASH_ACCESS_KEY || '';
  }
}
