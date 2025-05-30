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

  // 格式化时间显示 - 始终显示秒数
  const formatTime = (time: Date) => {
    const options: Intl.DateTimeFormatOptions = {
      hour12: preferences?.timeFormat === '12h',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit', // 始终显示秒数
    }

    return time.toLocaleTimeString('zh-CN', options)
  }

  // 格式化日期显示 - 始终使用中文格式
  const formatDate = (time: Date) => {
    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long'
    }

    return time.toLocaleDateString('zh-CN', options)
  }

  return {
    currentTime,
    formatTime,
    formatDate
  }
}
