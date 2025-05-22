import { useState, useEffect } from 'react'

/**
 * 实时时钟Hook
 * 返回当前时间，每秒更新一次
 */
export function useClock() {
  const [currentTime, setCurrentTime] = useState(new Date())

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  return currentTime
}
