import React, { useState, useCallback } from 'react'
import { Wifi, Building } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { NetworkMode } from '@/types'

interface NetworkSwitchProps {
  networkMode: NetworkMode
  onNetworkModeChange: (mode: NetworkMode) => void
  className?: string
}

const NetworkSwitch: React.FC<NetworkSwitchProps> = ({
  networkMode, onNetworkModeChange, className = ''
}) => {
  const [isAnimating, setIsAnimating] = useState(false)

  const handleToggle = useCallback(async () => {
    if (isAnimating) return
    setIsAnimating(true)
    const newMode: NetworkMode = networkMode === 'external' ? 'internal' : 'external'
    
    try {
      onNetworkModeChange(newMode)
      setTimeout(() => setIsAnimating(false), 600)
    } catch (error) {
      setIsAnimating(false)
    }
  }, [networkMode, onNetworkModeChange, isAnimating])

  const isExternal = networkMode === 'external'
  const IconComponent = isExternal ? Wifi : Building
  const modeLabel = isExternal ? '外网' : '内网'
  const modeColor = isExternal ? 'text-green-300' : 'text-yellow-300'
  const indicatorColor = isExternal ? 'bg-green-400' : 'bg-yellow-400'

  return (
    <div className={`relative ${className}`}>
      <div className="bg-white/10 backdrop-blur-md rounded-lg px-3 py-2 flex items-center space-x-2 border border-white/20 transition-all duration-300 hover:bg-white/20 hover:border-white/40">
        <span className="text-white text-xs">网络：</span>        
        <Button
          onClick={handleToggle}
          disabled={isAnimating}
          size="sm"
          variant="ghost"
          className={`
            text-white hover:bg-white/20 p-1 h-auto rounded-md
            transition-all duration-300 ${isAnimating ? 'animate-pulse' : ''}
          `}
        >
          <div className={`
            transition-all duration-300
            ${isAnimating ? 'rotate-180 scale-110' : 'rotate-0 scale-100'}
          `}>
            <IconComponent className="h-4 w-4" />
          </div>
        </Button>

        <div className="flex items-center space-x-1">
          <div className={`
            w-1.5 h-1.5 rounded-full transition-all duration-300
            ${indicatorColor} ${isAnimating ? 'animate-ping' : ''}
          `} />
          
          <span className={`
            text-xs font-medium transition-all duration-300
            ${modeColor} ${isAnimating ? 'opacity-50' : 'opacity-100'}
          `}>
            {modeLabel}
          </span>
        </div>


      </div>
    </div>
  )
}

export default NetworkSwitch