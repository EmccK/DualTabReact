/**
 * 自动切换服务
 * 处理背景图片的自动切换逻辑和调度
 */

import type { 
  AutoSwitchSettings, 
  AutoSwitchState, 
  SwitchResult 
} from '@/types/background/autoSwitchSettings';

const STORAGE_KEYS = {
  AUTO_SWITCH_SETTINGS: 'auto_switch_settings',
  AUTO_SWITCH_STATE: 'auto_switch_state'
} as const;

// 默认自动切换设置
const DEFAULT_AUTO_SWITCH_SETTINGS: AutoSwitchSettings = {
  enabled: false,
  intervalMinutes: 60,
  mode: 'random',
  source: {
    categories: ['nature', 'landscape'],
    includeFavorites: true,
    includeLocal: false
  },
  conditions: {
    onlyWhenActive: true,
    minInterval: 15,
    maxInterval: 360
  },
  schedule: {
    enabled: false,
    startTime: '09:00',
    endTime: '18:00',
    weekdays: [true, true, true, true, true, false, false] // 周一到周五
  }
};

// 默认自动切换状态
const DEFAULT_AUTO_SWITCH_STATE: AutoSwitchState = {
  isRunning: false,
  nextSwitchTime: 0,
  lastSwitchTime: 0,
  history: [],
  stats: {
    totalSwitches: 0,
    dailySwitches: 0,
    averageInterval: 60
  }
};

export class AutoSwitchService {
  private static timerId: number | null = null;

  /**
   * 获取自动切换设置
   */
  static async getSettings(): Promise<AutoSwitchSettings> {
    try {
      const result = await chrome.storage.local.get([STORAGE_KEYS.AUTO_SWITCH_SETTINGS]);
      return {
        ...DEFAULT_AUTO_SWITCH_SETTINGS,
        ...(result[STORAGE_KEYS.AUTO_SWITCH_SETTINGS] || {})
      };
    } catch (error) {
      console.error('Failed to get auto switch settings:', error);
      return DEFAULT_AUTO_SWITCH_SETTINGS;
    }
  }

  /**
   * 保存自动切换设置
   */
  static async saveSettings(settings: Partial<AutoSwitchSettings>): Promise<void> {
    try {
      const currentSettings = await this.getSettings();
      const updatedSettings = {
        ...currentSettings,
        ...settings
      };
      
      await chrome.storage.local.set({
        [STORAGE_KEYS.AUTO_SWITCH_SETTINGS]: updatedSettings
      });

      // 设置更新后，重新启动或停止服务
      if (updatedSettings.enabled) {
        await this.start();
      } else {
        await this.stop();
      }
    } catch (error) {
      console.error('Failed to save auto switch settings:', error);
      throw error;
    }
  }

  /**
   * 获取自动切换状态
   */
  static async getState(): Promise<AutoSwitchState> {
    try {
      const result = await chrome.storage.local.get([STORAGE_KEYS.AUTO_SWITCH_STATE]);
      return {
        ...DEFAULT_AUTO_SWITCH_STATE,
        ...(result[STORAGE_KEYS.AUTO_SWITCH_STATE] || {})
      };
    } catch (error) {
      console.error('Failed to get auto switch state:', error);
      return DEFAULT_AUTO_SWITCH_STATE;
    }
  }

  /**
   * 更新自动切换状态
   */
  private static async updateState(updates: Partial<AutoSwitchState>): Promise<void> {
    try {
      const currentState = await this.getState();
      const updatedState = {
        ...currentState,
        ...updates
      };
      
      await chrome.storage.local.set({
        [STORAGE_KEYS.AUTO_SWITCH_STATE]: updatedState
      });
    } catch (error) {
      console.error('Failed to update auto switch state:', error);
    }
  }

  /**
   * 启动自动切换服务
   */
  static async start(): Promise<void> {
    try {
      const settings = await this.getSettings();
      
      if (!settings.enabled) {
        return;
      }

      // 停止现有的定时器
      await this.stop();

      // 计算下次切换时间
      const nextSwitchTime = this.calculateNextSwitchTime(settings);
      
      await this.updateState({
        isRunning: true,
        nextSwitchTime
      });

      // 设置定时器
      this.scheduleNextSwitch(settings);
      
      console.log('Auto switch service started');
    } catch (error) {
      console.error('Failed to start auto switch service:', error);
    }
  }

  /**
   * 停止自动切换服务
   */
  static async stop(): Promise<void> {
    try {
      if (this.timerId) {
        clearTimeout(this.timerId);
        this.timerId = null;
      }

      await this.updateState({
        isRunning: false,
        nextSwitchTime: 0
      });

      console.log('Auto switch service stopped');
    } catch (error) {
      console.error('Failed to stop auto switch service:', error);
    }
  }

  /**
   * 计算下次切换时间
   */
  private static calculateNextSwitchTime(settings: AutoSwitchSettings): number {
    const now = Date.now();
    let intervalMs = settings.intervalMinutes * 60 * 1000;

    // 如果启用了随机间隔
    if (settings.conditions.minInterval !== settings.conditions.maxInterval) {
      const minMs = settings.conditions.minInterval * 60 * 1000;
      const maxMs = settings.conditions.maxInterval * 60 * 1000;
      intervalMs = minMs + Math.random() * (maxMs - minMs);
    }

    let nextTime = now + intervalMs;

    // 检查时间段限制
    if (settings.schedule.enabled) {
      nextTime = this.adjustForSchedule(nextTime, settings.schedule);
    }

    return nextTime;
  }

  /**
   * 根据时间段调整切换时间
   */
  private static adjustForSchedule(
    targetTime: number, 
    schedule: AutoSwitchSettings['schedule']
  ): number {
    const targetDate = new Date(targetTime);
    const targetHour = targetDate.getHours();
    const targetMinute = targetDate.getMinutes();
    const targetWeekday = targetDate.getDay();

    const [startHour, startMinute] = schedule.startTime.split(':').map(Number);
    const [endHour, endMinute] = schedule.endTime.split(':').map(Number);

    const targetTimeInMinutes = targetHour * 60 + targetMinute;
    const startTimeInMinutes = startHour * 60 + startMinute;
    const endTimeInMinutes = endHour * 60 + endMinute;

    // 检查是否在工作日
    if (!schedule.weekdays[targetWeekday === 0 ? 6 : targetWeekday - 1]) {
      // 调整到下一个工作日的开始时间
      const nextWorkday = this.findNextWorkday(targetDate, schedule.weekdays);
      nextWorkday.setHours(startHour, startMinute, 0, 0);
      return nextWorkday.getTime();
    }

    // 检查是否在时间段内
    if (targetTimeInMinutes < startTimeInMinutes) {
      // 调整到今天的开始时间
      targetDate.setHours(startHour, startMinute, 0, 0);
      return targetDate.getTime();
    } else if (targetTimeInMinutes > endTimeInMinutes) {
      // 调整到下一个工作日的开始时间
      const nextWorkday = this.findNextWorkday(targetDate, schedule.weekdays);
      nextWorkday.setHours(startHour, startMinute, 0, 0);
      return nextWorkday.getTime();
    }

    return targetTime;
  }

  /**
   * 找到下一个工作日
   */
  private static findNextWorkday(currentDate: Date, weekdays: boolean[]): Date {
    const nextDay = new Date(currentDate);
    
    do {
      nextDay.setDate(nextDay.getDate() + 1);
    } while (!weekdays[nextDay.getDay() === 0 ? 6 : nextDay.getDay() - 1]);

    return nextDay;
  }

  /**
   * 调度下次切换
   */
  private static scheduleNextSwitch(settings: AutoSwitchSettings): void {
    const nextSwitchTime = this.calculateNextSwitchTime(settings);
    const delay = nextSwitchTime - Date.now();

    this.timerId = setTimeout(async () => {
      await this.performSwitch();
      
      // 如果服务仍然启用，调度下次切换
      const currentSettings = await this.getSettings();
      if (currentSettings.enabled) {
        this.scheduleNextSwitch(currentSettings);
      }
    }, Math.max(delay, 1000)); // 至少等待1秒
  }

  /**
   * 执行切换
   */
  private static async performSwitch(): Promise<SwitchResult> {
    try {
      const settings = await this.getSettings();
      const state = await this.getState();

      // 检查是否应该在当前条件下切换
      if (settings.conditions.onlyWhenActive && !await this.isUserActive()) {
        // 用户不活跃，延迟切换
        const nextTime = Date.now() + 5 * 60 * 1000; // 5分钟后重试
        await this.updateState({ nextSwitchTime: nextTime });
        return {
          success: false,
          error: 'User not active, switch delayed'
        };
      }

      // 选择下一张图片
      const imageResult = await this.selectNextImage(settings);
      
      if (!imageResult.success || !imageResult.imageId) {
        return {
          success: false,
          error: imageResult.error || 'Failed to select image'
        };
      }

      // 应用背景（这里需要调用背景设置服务）
      // 暂时模拟成功
      const now = Date.now();
      
      // 更新历史记录
      const newHistory = [
        {
          timestamp: now,
          imageId: imageResult.imageId,
          category: imageResult.category || 'unknown',
          source: imageResult.source || 'local'
        },
        ...state.history.slice(0, 49) // 保留最近50条记录
      ];

      // 更新统计信息
      const todayStart = new Date().setHours(0, 0, 0, 0);
      const dailySwitches = newHistory.filter(h => h.timestamp >= todayStart).length;

      await this.updateState({
        lastSwitchTime: now,
        history: newHistory,
        stats: {
          totalSwitches: state.stats.totalSwitches + 1,
          dailySwitches,
          averageInterval: this.calculateAverageInterval(newHistory)
        }
      });

      return {
        success: true,
        imageId: imageResult.imageId,
        source: imageResult.source,
        nextScheduledTime: this.calculateNextSwitchTime(settings)
      };
    } catch (error) {
      console.error('Failed to perform switch:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * 选择下一张图片
   */
  private static async selectNextImage(settings: AutoSwitchSettings): Promise<{
    success: boolean;
    imageId?: string;
    category?: string;
    source?: 'local' | 'gradient';
    error?: string;
  }> {
    try {
      // 这里应该根据设置选择图片
      // 暂时返回模拟数据
      const categories = settings.source.categories;
      const randomCategory = categories[Math.floor(Math.random() * categories.length)];
      
      return {
        success: true,
        imageId: `mock_${Date.now()}`,
        category: randomCategory,
        source: 'local'
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to select image'
      };
    }
  }

  /**
   * 检查用户是否活跃
   */
  private static async isUserActive(): Promise<boolean> {
    try {
      // 在Chrome扩展中，可以通过检查标签页活动状态来判断
      const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
      return tabs.length > 0;
    } catch {
      // 如果无法检查，默认认为用户活跃
      return true;
    }
  }

  /**
   * 计算平均切换间隔
   */
  private static calculateAverageInterval(history: AutoSwitchState['history']): number {
    if (history.length < 2) {
      return 60; // 默认60分钟
    }

    const intervals: number[] = [];
    for (let i = 0; i < history.length - 1; i++) {
      const interval = (history[i].timestamp - history[i + 1].timestamp) / (1000 * 60);
      intervals.push(interval);
    }

    const sum = intervals.reduce((a, b) => a + b, 0);
    return Math.round(sum / intervals.length);
  }

  /**
   * 手动触发切换
   */
  static async triggerSwitch(): Promise<SwitchResult> {
    const settings = await this.getSettings();
    
    if (!settings.enabled) {
      return {
        success: false,
        error: 'Auto switch is disabled'
      };
    }

    return await this.performSwitch();
  }

  /**
   * 获取切换状态摘要
   */
  static async getSummary(): Promise<{
    isEnabled: boolean;
    isRunning: boolean;
    nextSwitchTime: number;
    todaySwitches: number;
    totalSwitches: number;
    lastSwitchTime: number;
  }> {
    const settings = await this.getSettings();
    const state = await this.getState();

    return {
      isEnabled: settings.enabled,
      isRunning: state.isRunning,
      nextSwitchTime: state.nextSwitchTime,
      todaySwitches: state.stats.dailySwitches,
      totalSwitches: state.stats.totalSwitches,
      lastSwitchTime: state.lastSwitchTime
    };
  }
}
