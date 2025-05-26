/**
 * 自动切换Hook
 * 提供背景自动切换的状态管理和操作方法
 */

import { useState, useEffect, useCallback } from 'react';
import type { 
  AutoSwitchSettings, 
  AutoSwitchState, 
  SwitchResult 
} from '@/types/background/autoSwitchSettings';
import { AutoSwitchService } from '@/services/background/autoSwitchService';

export function useAutoSwitch() {
  const [settings, setSettings] = useState<AutoSwitchSettings | null>(null);
  const [state, setState] = useState<AutoSwitchState | null>(null);
  const [loading, setLoading] = useState(true);
  const [switching, setSwitching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 加载自动切换设置
  const loadSettings = useCallback(async () => {
    try {
      setError(null);
      const data = await AutoSwitchService.getSettings();
      setSettings(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载自动切换设置失败');
    }
  }, []);

  // 加载自动切换状态
  const loadState = useCallback(async () => {
    try {
      setError(null);
      const data = await AutoSwitchService.getState();
      setState(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载自动切换状态失败');
    }
  }, []);

  // 加载所有数据
  const loadData = useCallback(async () => {
    setLoading(true);
    await Promise.all([loadSettings(), loadState()]);
    setLoading(false);
  }, [loadSettings, loadState]);

  // 更新设置
  const updateSettings = useCallback(async (newSettings: Partial<AutoSwitchSettings>) => {
    if (!settings) return;

    try {
      setError(null);
      const updatedSettings = { ...settings, ...newSettings };
      await AutoSwitchService.saveSettings(updatedSettings);
      setSettings(updatedSettings);
      
      // 重新加载状态以反映服务状态变化
      await loadState();
    } catch (err) {
      setError(err instanceof Error ? err.message : '保存自动切换设置失败');
      throw err;
    }
  }, [settings, loadState]);

  // 启动自动切换
  const startAutoSwitch = useCallback(async () => {
    try {
      setError(null);
      await AutoSwitchService.start();
      await loadState();
    } catch (err) {
      setError(err instanceof Error ? err.message : '启动自动切换失败');
      throw err;
    }
  }, [loadState]);

  // 停止自动切换
  const stopAutoSwitch = useCallback(async () => {
    try {
      setError(null);
      await AutoSwitchService.stop();
      await loadState();
    } catch (err) {
      setError(err instanceof Error ? err.message : '停止自动切换失败');
      throw err;
    }
  }, [loadState]);

  // 切换启用状态
  const toggleAutoSwitch = useCallback(async (enabled: boolean) => {
    try {
      await updateSettings({ enabled });
    } catch (err) {
      setError(err instanceof Error ? err.message : '切换自动切换状态失败');
      throw err;
    }
  }, [updateSettings]);

  // 手动触发切换
  const triggerSwitch = useCallback(async (): Promise<SwitchResult> => {
    try {
      setSwitching(true);
      setError(null);
      
      const result = await AutoSwitchService.triggerSwitch();
      
      if (result.success) {
        // 切换成功，重新加载状态
        await loadState();
      } else {
        setError(result.error || '手动切换失败');
      }
      
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '手动切换失败';
      setError(errorMessage);
      return {
        success: false,
        error: errorMessage
      };
    } finally {
      setSwitching(false);
    }
  }, [loadState]);

  // 获取摘要信息
  const getSummary = useCallback(async () => {
    try {
      return await AutoSwitchService.getSummary();
    } catch (err) {
      setError(err instanceof Error ? err.message : '获取摘要信息失败');
      return null;
    }
  }, []);

  // 格式化下次切换时间
  const getNextSwitchTime = useCallback(() => {
    if (!state?.nextSwitchTime || state.nextSwitchTime <= Date.now()) {
      return null;
    }
    
    return new Date(state.nextSwitchTime);
  }, [state]);

  // 格式化上次切换时间
  const getLastSwitchTime = useCallback(() => {
    if (!state?.lastSwitchTime) {
      return null;
    }
    
    return new Date(state.lastSwitchTime);
  }, [state]);

  // 计算剩余时间
  const getTimeUntilNextSwitch = useCallback(() => {
    const nextTime = getNextSwitchTime();
    if (!nextTime) return null;
    
    const now = Date.now();
    const diff = nextTime.getTime() - now;
    
    if (diff <= 0) return null;
    
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) {
      return `${days}天 ${hours % 24}小时`;
    } else if (hours > 0) {
      return `${hours}小时 ${minutes % 60}分钟`;
    } else {
      return `${minutes}分钟`;
    }
  }, [getNextSwitchTime]);

  // 获取今日切换历史
  const getTodayHistory = useCallback(() => {
    if (!state?.history) return [];
    
    const todayStart = new Date().setHours(0, 0, 0, 0);
    return state.history.filter(item => item.timestamp >= todayStart);
  }, [state]);

  // 获取分类使用统计
  const getCategoryStats = useCallback(() => {
    if (!state?.history) return {};
    
    const stats: Record<string, number> = {};
    state.history.forEach(item => {
      stats[item.category] = (stats[item.category] || 0) + 1;
    });
    
    return Object.entries(stats)
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => b.count - a.count);
  }, [state]);

  // 验证时间段设置
  const validateSchedule = useCallback((schedule: AutoSwitchSettings['schedule']) => {
    if (!schedule.enabled) return { valid: true };
    
    const [startHour, startMinute] = schedule.startTime.split(':').map(Number);
    const [endHour, endMinute] = schedule.endTime.split(':').map(Number);
    
    const startTimeInMinutes = startHour * 60 + startMinute;
    const endTimeInMinutes = endHour * 60 + endMinute;
    
    if (startTimeInMinutes >= endTimeInMinutes) {
      return {
        valid: false,
        error: '结束时间必须晚于开始时间'
      };
    }
    
    const hasActiveDay = schedule.weekdays.some(active => active);
    if (!hasActiveDay) {
      return {
        valid: false,
        error: '至少需要选择一个工作日'
      };
    }
    
    return { valid: true };
  }, []);

  // 检查当前是否在允许的时间段内
  const isInScheduledTime = useCallback(() => {
    if (!settings?.schedule.enabled) return true;
    
    const now = new Date();
    const currentDay = now.getDay();
    const currentTime = now.getHours() * 60 + now.getMinutes();
    
    // 检查是否是工作日
    const isWorkday = settings.schedule.weekdays[currentDay === 0 ? 6 : currentDay - 1];
    if (!isWorkday) return false;
    
    // 检查是否在时间段内
    const [startHour, startMinute] = settings.schedule.startTime.split(':').map(Number);
    const [endHour, endMinute] = settings.schedule.endTime.split(':').map(Number);
    
    const startTime = startHour * 60 + startMinute;
    const endTime = endHour * 60 + endMinute;
    
    return currentTime >= startTime && currentTime <= endTime;
  }, [settings]);

  // 初始化加载
  useEffect(() => {
    loadData();
  }, [loadData]);

  // 定期刷新状态（每分钟）
  useEffect(() => {
    const interval = setInterval(() => {
      if (!loading && !switching) {
        loadState();
      }
    }, 60000);

    return () => clearInterval(interval);
  }, [loading, switching, loadState]);

  return {
    // 状态
    settings,
    state,
    loading,
    switching,
    error,
    
    // 操作方法
    loadData,
    loadSettings,
    loadState,
    updateSettings,
    startAutoSwitch,
    stopAutoSwitch,
    toggleAutoSwitch,
    triggerSwitch,
    getSummary,
    
    // 计算方法
    getNextSwitchTime,
    getLastSwitchTime,
    getTimeUntilNextSwitch,
    getTodayHistory,
    getCategoryStats,
    validateSchedule,
    isInScheduledTime,
    
    // 便捷访问
    isEnabled: settings?.enabled || false,
    isRunning: state?.isRunning || false,
    intervalMinutes: settings?.intervalMinutes || 60,
    todaySwitches: state?.stats.dailySwitches || 0,
    totalSwitches: state?.stats.totalSwitches || 0,
    averageInterval: state?.stats.averageInterval || 60,
    nextSwitchTime: getNextSwitchTime(),
    lastSwitchTime: getLastSwitchTime(),
    timeUntilNext: getTimeUntilNextSwitch(),
    todayHistory: getTodayHistory(),
    categoryStats: getCategoryStats(),
    inScheduledTime: isInScheduledTime()
  };
}
