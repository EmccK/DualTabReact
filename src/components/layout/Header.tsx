import React from 'react'
import { Clock, Settings, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn, formatTime } from '@/lib/utils'

interface HeaderProps {
  className?: string
  onSettingsClick?: () => void
  onRefreshBackground?: () => void
  currentTime?: Date
}

export const Header: React.FC<HeaderProps> = ({
  className,
  onSettingsClick,
  onRefreshBackground,
  currentTime = new Date()
}) => {
  const { time, date } = formatTime(currentTime)

  return (
    <header className={cn("flex items-center justify-between p-6", className)}>
      {/* 左侧：时钟显示 */}
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2 text-white">
          <Clock className="h-5 w-5" />
          <div className="flex flex-col">
            <span className="text-2xl font-bold font-mono">{time}</span>
            <span className="text-sm opacity-80">{date}</span>
          </div>
        </div>
      </div>

      {/* 右侧：操作按钮 */}
      <div className="flex items-center space-x-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={onRefreshBackground}
          className="text-white hover:bg-white/20 transition-colors"
          title="刷新背景图片"
        >
          <RefreshCw className="h-5 w-5" />
        </Button>

        <Button
          variant="ghost"
          size="icon"
          onClick={onSettingsClick}
          className="text-white hover:bg-white/20 transition-colors"
          title="设置"
        >
          <Settings className="h-5 w-5" />
        </Button>
      </div>
    </header>
  )
}

export default Header
