import { useState, useEffect } from 'react'
import type { AppPreferences } from '@/types/settings'

/**
 * 实时时钟Hook
 * 返回当前时间和格式化函数，支持设置配置
 */
export function useClock(preferences?: AppPreferences) {
  const [currentTime, setCurrentTime] = useState(new Date())

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  // 格式化时间显示
  const formatTime = (time: Date) => {
    const options: Intl.DateTimeFormatOptions = {
      hour12: preferences?.timeFormat === '12h',
      hour: '2-digit',
      minute: '2-digit',
    }

    // 根据设置决定是否显示秒数
    if (preferences?.showSeconds) {
      options.second = '2-digit'
    }

    return time.toLocaleTimeString('zh-CN', options)
  }

  // 格式化日期显示
  const formatDate = (time: Date) => {
    const locale = preferences?.dateFormat || 'zh-CN'
    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long'
    }

    return time.toLocaleDateString(locale, options)
  }

  return {
    currentTime,
    formatTime,
    formatDate
  }
}
