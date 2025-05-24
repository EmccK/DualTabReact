import React from 'react';
import type { AppPreferences } from '@/types/settings';

interface ClockDisplayProps {
  currentTime: Date;
  preferences: AppPreferences;
  isGlassEffect?: boolean;
  className?: string;
}

/**
 * 时钟显示组件
 * 根据用户设置显示时间和日期格式
 */
export function ClockDisplay({ 
  currentTime, 
  preferences, 
  isGlassEffect = true, 
  className = '' 
}: ClockDisplayProps) {
  // 格式化时间显示
  const formatTime = (time: Date) => {
    const options: Intl.DateTimeFormatOptions = {
      hour12: preferences.timeFormat === '12h',
      hour: '2-digit',
      minute: '2-digit',
    };

    // 根据设置决定是否显示秒数
    if (preferences.showSeconds) {
      options.second = '2-digit';
    }

    return time.toLocaleTimeString('zh-CN', options);
  };

  // 格式化日期显示
  const formatDate = (time: Date) => {
    const locale = preferences.dateFormat || 'zh-CN';
    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long'
    };

    return time.toLocaleDateString(locale, options);
  };

  return (
    <div 
      className={`${
        isGlassEffect ? 'bg-white/10 backdrop-blur-md' : 'bg-black/20'
      } rounded-lg px-4 py-2 text-white shadow-lg border border-white/20 ${className}`}
    >
      <div className="text-2xl font-bold tracking-wide">
        {formatTime(currentTime)}
      </div>
      <div className="text-sm opacity-80">
        {formatDate(currentTime)}
      </div>
    </div>
  );
}
