/**
 * 背景自动切换设置相关类型定义
 */

// 自动切换设置
export interface AutoSwitchSettings {
  /** 是否启用自动切换 */
  enabled: boolean;
  /** 切换间隔 (分钟) */
  intervalMinutes: number;
  /** 切换模式 */
  mode: 'random' | 'sequential' | 'favorite';
  /** 切换来源 */
  source: {
    /** 包含的分类 */
    categories: string[];
    /** 是否包含收藏 */
    includeFavorites: boolean;
    /** 是否包含本地图片 */
    includeLocal: boolean;
  };
  /** 切换条件 */
  conditions: {
    /** 仅在活跃时切换 */
    onlyWhenActive: boolean;
    /** 最小间隔时间 (分钟) */
    minInterval: number;
    /** 最大间隔时间 (分钟) */
    maxInterval: number;
  };
  /** 切换时间段 */
  schedule: {
    /** 是否启用时间段限制 */
    enabled: boolean;
    /** 开始时间 (HH:MM) */
    startTime: string;
    /** 结束时间 (HH:MM) */
    endTime: string;
    /** 工作日设置 */
    weekdays: boolean[];
  };
}

// 自动切换状态
export interface AutoSwitchState {
  /** 是否正在运行 */
  isRunning: boolean;
  /** 下次切换时间 */
  nextSwitchTime: number;
  /** 上次切换时间 */
  lastSwitchTime: number;
  /** 切换历史记录 */
  history: Array<{
    timestamp: number;
    imageId: string;
    category: string;
    source: 'unsplash' | 'local' | 'gradient';
  }>;
  /** 切换统计 */
  stats: {
    totalSwitches: number;
    dailySwitches: number;
    averageInterval: number;
  };
}

// 切换结果
export interface SwitchResult {
  success: boolean;
  imageId?: string;
  source?: 'unsplash' | 'local' | 'gradient';
  error?: string;
  nextScheduledTime?: number;
}
