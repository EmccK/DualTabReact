/**
 * 缓存管理设置相关类型定义
 */

// 缓存配置设置
export interface CacheSettings {
  /** 最大缓存大小 (MB) */
  maxSizeInMB: number;
  /** 缓存过期时间 (天) */
  expirationDays: number;
  /** 自动清理策略 */
  autoCleanup: {
    enabled: boolean;
    /** 清理触发阈值 (缓存使用率%) */
    threshold: number;
    /** 清理策略 */
    strategy: 'lru' | 'fifo' | 'size';
  };
  /** 预加载设置 */
  preload: {
    enabled: boolean;
    /** 预加载数量 */
    count: number;
    /** 预加载分类 */
    categories: string[];
  };
}

// 缓存统计信息
export interface CacheStats {
  /** 当前缓存大小 (MB) */
  currentSizeInMB: number;
  /** 缓存文件数量 */
  fileCount: number;
  /** 缓存命中率 */
  hitRate: number;
  /** 最后清理时间 */
  lastCleanupTime: number;
  /** 缓存使用详情 */
  details: {
    /** 各分类缓存数量 */
    categoryCount: Record<string, number>;
    /** 各分类缓存大小 */
    categorySize: Record<string, number>;
    /** 最近访问的图片 */
    recentAccess: Array<{
      id: string;
      accessTime: number;
      category: string;
    }>;
  };
}

// 缓存操作结果
export interface CacheOperationResult {
  success: boolean;
  message: string;
  data?: {
    cleanedCount?: number;
    freedSpace?: number;
    errors?: string[];
  };
}
