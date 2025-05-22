import React, { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'

interface BackgroundContainerProps {
  children: React.ReactNode
  className?: string
  backgroundImage?: string
  fallbackColor?: string
  showAttribution?: boolean
  attributionInfo?: {
    author: string
    authorUrl?: string
    source: string
    sourceUrl?: string
  }
}

export const BackgroundContainer: React.FC<BackgroundContainerProps> = ({
  children,
  className,
  backgroundImage,
  fallbackColor = 'from-blue-50 to-indigo-100',
  showAttribution = true,
  attributionInfo
}) => {
  const [imageLoaded, setImageLoaded] = useState(false)
  const [imageError, setImageError] = useState(false)

  useEffect(() => {
    if (backgroundImage) {
      setImageLoaded(false)
      setImageError(false)
      
      const img = new Image()
      img.onload = () => {
        setImageLoaded(true)
        setImageError(false)
      }
      img.onerror = () => {
        setImageError(true)
        setImageLoaded(false)
      }
      img.src = backgroundImage
    }
  }, [backgroundImage])

  const backgroundStyle = React.useMemo(() => {
    if (backgroundImage && imageLoaded && !imageError) {
      return {
        backgroundImage: `url(${backgroundImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }
    }
    return {}
  }, [backgroundImage, imageLoaded, imageError])

  return (
    <div
      className={cn(
        "min-h-screen relative transition-all duration-500",
        // 如果没有背景图片或加载失败，使用渐变背景
        (!backgroundImage || imageError) && `bg-gradient-to-br ${fallbackColor}`,
        className
      )}
      style={backgroundStyle}
    >
      {/* 背景遮罩层，提高文字可读性 */}
      {backgroundImage && imageLoaded && !imageError && (
        <div className="absolute inset-0 bg-black/20 backdrop-blur-[1px]" />
      )}
      
      {/* 主要内容区域 */}
      <div className="relative z-10">
        {children}
      </div>

      {/* 图片归属信息 */}
      {showAttribution && attributionInfo && backgroundImage && imageLoaded && !imageError && (
        <div className="absolute bottom-4 right-4 z-20">
          <div className="bg-black/50 text-white text-xs px-3 py-2 rounded-md backdrop-blur-sm">
            <div className="flex items-center space-x-2">
              <span>照片来自</span>
              {attributionInfo.authorUrl ? (
                <a
                  href={attributionInfo.authorUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:underline font-medium"
                >
                  {attributionInfo.author}
                </a>
              ) : (
                <span className="font-medium">{attributionInfo.author}</span>
              )}
              <span>·</span>
              {attributionInfo.sourceUrl ? (
                <a
                  href={attributionInfo.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:underline"
                >
                  {attributionInfo.source}
                </a>
              ) : (
                <span>{attributionInfo.source}</span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 加载状态指示器 */}
      {backgroundImage && !imageLoaded && !imageError && (
        <div className="absolute top-4 right-4 z-20">
          <div className="bg-white/90 text-gray-600 text-xs px-3 py-2 rounded-md backdrop-blur-sm">
            加载背景图片中...
          </div>
        </div>
      )}
    </div>
  )
}

export default BackgroundContainer
