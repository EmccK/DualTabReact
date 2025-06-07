/**
 * 网络模式管理Hook
 * 提供网络模式的状态管理和持久化功能
 */

import { useState, useEffect, useCallback } from 'react'
import { loadNetworkMode, saveNetworkMode } from '@/utils/storage'
import type { NetworkMode } from '@/types'

interface UseNetworkModeReturn {
  networkMode: NetworkMode
  loading: boolean
  error: string | null
  setNetworkMode: (mode: NetworkMode) => Promise<void>
  toggleNetworkMode: () => Promise<void>
}

export function useNetworkMode(): UseNetworkModeReturn {
  const [networkMode, setNetworkModeState] = useState<NetworkMode>('external')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // 初始化加载网络模式
  useEffect(() => {
    const initNetworkMode = async () => {
      try {
        setLoading(true)
        setError(null)
        
        const result = await loadNetworkMode()
        
        if (result.success && result.data) {
          setNetworkModeState(result.data)
        } else {
          setNetworkModeState('external')
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : '加载网络模式时发生未知错误'
        setError(errorMessage)
        setNetworkModeState('external') // 使用默认值
      } finally {
        setLoading(false)
      }
    }

    initNetworkMode()
  }, [])  // 设置网络模式
  const setNetworkMode = useCallback(async (mode: NetworkMode) => {
    try {
      setError(null)
      
      // 先更新本地状态，提供即时反馈
      setNetworkModeState(mode)
      
      // 保存到存储
      const result = await saveNetworkMode(mode)
      
      if (!result.success) {
        // 如果保存失败，回滚状态
        setNetworkModeState(networkMode)
        throw new Error(result.error || '保存网络模式失败')
      }
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '设置网络模式时发生未知错误'
      setError(errorMessage)
      
      // 回滚状态
      setNetworkModeState(networkMode)
      throw err
    }
  }, [networkMode])

  // 切换网络模式
  const toggleNetworkMode = useCallback(async () => {
    const newMode: NetworkMode = networkMode === 'external' ? 'internal' : 'external'
    await setNetworkMode(newMode)
  }, [networkMode, setNetworkMode])

  return {
    networkMode,
    loading,
    error,
    setNetworkMode,
    toggleNetworkMode
  }
}