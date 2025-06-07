/**
 * 缓存管理服务
 * 处理图片缓存的存储、清理和统计
 */

import type { 
  CacheSettings, 
  CacheStats, 
  CacheOperationResult 
} from '@/types/background/cacheSettings';

const STORAGE_KEYS = {
  CACHE_SETTINGS: 'cache_settings',
  CACHE_STATS: 'cache_stats',
  CACHE_DATA: 'cache_data'
} as const;

// 默认缓存设置
const DEFAULT_CACHE_SETTINGS: CacheSettings = {
  maxSizeInMB: 50,
  expirationDays: 30,
  autoCleanup: {
    enabled: true,
    threshold: 80,
    strategy: 'lru'
  },
  preload: {
    enabled: false,
    count: 10,
    categories: ['nature', 'landscape']
  }
};

// 默认缓存统计
const DEFAULT_CACHE_STATS: CacheStats = {
  currentSizeInMB: 0,
  fileCount: 0,
  hitRate: 0,
  lastCleanupTime: Date.now(),
  details: {
    categoryCount: {},
    categorySize: {},
    recentAccess: []
  }
};

export class CacheManagerService {
  /**
   * 获取缓存设置
   */
  static async getSettings(): Promise<CacheSettings> {
    try {
      const result = await chrome.storage.local.get([STORAGE_KEYS.CACHE_SETTINGS]);
      return {
        ...DEFAULT_CACHE_SETTINGS,
        ...(result[STORAGE_KEYS.CACHE_SETTINGS] || {})
      };
    } catch (error) {
      return DEFAULT_CACHE_SETTINGS;
    }
  }

  /**
   * 保存缓存设置
   */
  static async saveSettings(settings: Partial<CacheSettings>): Promise<void> {
    try {
      const currentSettings = await this.getSettings();
      const updatedSettings = {
        ...currentSettings,
        ...settings
      };
      
      await chrome.storage.local.set({
        [STORAGE_KEYS.CACHE_SETTINGS]: updatedSettings
      });

      // 设置更新后，检查是否需要立即清理
      if (settings.maxSizeInMB || settings.autoCleanup) {
        await this.checkAndCleanup();
      }
    } catch (error) {
      throw error;
    }
  }

  /**
   * 获取缓存统计
   */
  static async getStats(): Promise<CacheStats> {
    try {
      const result = await chrome.storage.local.get([STORAGE_KEYS.CACHE_STATS]);
      const stats = {
        ...DEFAULT_CACHE_STATS,
        ...(result[STORAGE_KEYS.CACHE_STATS] || {})
      };

      // 实时计算当前缓存信息
      await this.updateRealTimeStats(stats);
      
      return stats;
    } catch (error) {
      return DEFAULT_CACHE_STATS;
    }
  }

  /**
   * 更新实时统计信息
   */
  private static async updateRealTimeStats(stats: CacheStats): Promise<void> {
    try {
      // 获取所有缓存数据
      const result = await chrome.storage.local.get(null);
      let totalSize = 0;
      let fileCount = 0;
      const categoryCount: Record<string, number> = {};
      const categorySize: Record<string, number> = {};

      Object.keys(result).forEach(key => {
        if (key.startsWith('image_cache_')) {
          const data = result[key];
          if (data && data.imageData) {
            const sizeInMB = this.calculateSize(data.imageData) / (1024 * 1024);
            totalSize += sizeInMB;
            fileCount++;

            const category = data.category || 'unknown';
            categoryCount[category] = (categoryCount[category] || 0) + 1;
            categorySize[category] = (categorySize[category] || 0) + sizeInMB;
          }
        }
      });

      stats.currentSizeInMB = Math.round(totalSize * 100) / 100;
      stats.fileCount = fileCount;
      stats.details.categoryCount = categoryCount;
      stats.details.categorySize = categorySize;

      // 保存更新的统计信息
      await chrome.storage.local.set({
        [STORAGE_KEYS.CACHE_STATS]: stats
      });
    } catch (error) {
    }
  }

  /**
   * 计算数据大小（字节）
   */
  private static calculateSize(data: any): number {
    try {
      return new Blob([JSON.stringify(data)]).size;
    } catch {
      return 0;
    }
  }

  /**
   * 清理缓存
   */
  static async cleanupCache(
    strategy: 'all' | 'expired' | 'lru' | 'size' = 'lru'
  ): Promise<CacheOperationResult> {
    try {
      const settings = await this.getSettings();
      const result = await chrome.storage.local.get(null);
      const cacheKeys: Array<{
        key: string;
        data: any;
        lastAccess: number;
        size: number;
      }> = [];

      // 收集所有缓存键
      Object.keys(result).forEach(key => {
        if (key.startsWith('image_cache_')) {
          const data = result[key];
          if (data) {
            cacheKeys.push({
              key,
              data,
              lastAccess: data.lastAccess || 0,
              size: this.calculateSize(data)
            });
          }
        }
      });

      let keysToDelete: string[] = [];
      const now = Date.now();
      const expirationTime = settings.expirationDays * 24 * 60 * 60 * 1000;

      switch (strategy) {
        case 'all':
          keysToDelete = cacheKeys.map(item => item.key);
          break;

        case 'expired':
          keysToDelete = cacheKeys
            .filter(item => now - item.lastAccess > expirationTime)
            .map(item => item.key);
          break;

        case 'lru':
          // 按最后访问时间排序，删除最旧的
          const sortedByAccess = cacheKeys.sort((a, b) => a.lastAccess - b.lastAccess);
          const deleteCount = Math.ceil(cacheKeys.length * 0.3); // 删除30%
          keysToDelete = sortedByAccess.slice(0, deleteCount).map(item => item.key);
          break;

        case 'size':
          // 按大小排序，删除最大的
          const sortedBySize = cacheKeys.sort((a, b) => b.size - a.size);
          const deleteCountBySize = Math.ceil(cacheKeys.length * 0.2); // 删除20%
          keysToDelete = sortedBySize.slice(0, deleteCountBySize).map(item => item.key);
          break;
      }

      // 执行删除
      if (keysToDelete.length > 0) {
        await chrome.storage.local.remove(keysToDelete);
      }

      // 计算释放的空间
      const freedSpace = keysToDelete.reduce((total, key) => {
        const item = cacheKeys.find(cache => cache.key === key);
        return total + (item?.size || 0);
      }, 0) / (1024 * 1024); // 转换为MB

      // 更新统计信息
      const stats = await this.getStats();
      stats.lastCleanupTime = now;
      await chrome.storage.local.set({
        [STORAGE_KEYS.CACHE_STATS]: stats
      });

      return {
        success: true,
        message: `成功清理 ${keysToDelete.length} 个缓存文件`,
        data: {
          cleanedCount: keysToDelete.length,
          freedSpace: Math.round(freedSpace * 100) / 100
        }
      };
    } catch (error) {
      return {
        success: false,
        message: '缓存清理失败',
        data: {
          errors: [error instanceof Error ? error.message : '未知错误']
        }
      };
    }
  }

  /**
   * 检查并自动清理缓存
   */
  static async checkAndCleanup(): Promise<void> {
    try {
      const settings = await this.getSettings();
      const stats = await this.getStats();

      if (!settings.autoCleanup.enabled) {
        return;
      }

      // 检查是否超过大小限制
      const usagePercentage = (stats.currentSizeInMB / settings.maxSizeInMB) * 100;
      
      if (usagePercentage >= settings.autoCleanup.threshold) {
        await this.cleanupCache(settings.autoCleanup.strategy);
      }
    } catch (error) {
    }
  }

  /**
   * 记录缓存访问
   */
  static async recordAccess(imageId: string, category: string): Promise<void> {
    try {
      const stats = await this.getStats();
      const now = Date.now();

      // 更新最近访问记录
      stats.details.recentAccess = stats.details.recentAccess.filter(
        access => access.id !== imageId
      );
      
      stats.details.recentAccess.unshift({
        id: imageId,
        accessTime: now,
        category
      });

      // 只保留最近50条记录
      stats.details.recentAccess = stats.details.recentAccess.slice(0, 50);

      await chrome.storage.local.set({
        [STORAGE_KEYS.CACHE_STATS]: stats
      });
    } catch (error) {
    }
  }

  /**
   * 预加载图片
   */
  static async preloadImages(): Promise<CacheOperationResult> {
    try {
      const settings = await this.getSettings();
      
      if (!settings.preload.enabled) {
        return {
          success: false,
          message: '预加载功能未启用'
        };
      }

      // 这里可以实现预加载逻辑
      // 暂时返回成功状态
      return {
        success: true,
        message: `预加载功能正在开发中`
      };
    } catch (error) {
      return {
        success: false,
        message: '预加载失败',
        data: {
          errors: [error instanceof Error ? error.message : '未知错误']
        }
      };
    }
  }
}
