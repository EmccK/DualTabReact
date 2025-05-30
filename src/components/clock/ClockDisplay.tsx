import React from 'react';
import type { AppPreferences } from '@/types/settings';

interface ClockDisplayProps {
  currentTime: Date;
  preferences: AppPreferences;
  className?: string;
}

/**
 * 时钟显示组件
 * 根据用户设置显示时间和日期格式，始终使用毛玻璃效果
 */
export function ClockDisplay({ 
  currentTime, 
  preferences, 
  className = '' 
}: ClockDisplayProps) {
  // 格式化时间显示 - 始终显示秒数
  const formatTime = (time: Date) => {
    const options: Intl.DateTimeFormatOptions = {
      hour12: preferences.timeFormat === '12h',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit', // 始终显示秒数
    };

    return time.toLocaleTimeString('zh-CN', options);
  };

  // 格式化日期显示 - 始终使用中文格式
  const formatDate = (time: Date) => {
    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long'
    };

    return time.toLocaleDateString('zh-CN', options);
  };

  return (
    <div className={`bg-white/10 backdrop-blur-md rounded-lg px-4 py-2 text-white shadow-lg border border-white/20 ${className}`}>
      <div className="text-2xl font-bold tracking-wide">
        {formatTime(currentTime)}
      </div>
      <div className="text-sm opacity-80">
        {formatDate(currentTime)}
      </div>
    </div>
  );
}
