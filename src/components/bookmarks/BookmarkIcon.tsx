import React, { useState, useCallback, useEffect } from 'react'
import { Globe, Type, Image, AlertCircle } from 'lucide-react'
import type { Bookmark, NetworkMode } from '@/types'
import { getUrlDomain } from '@/utils/url-utils'

interface BookmarkIconProps {
  bookmark: Bookmark
  networkMode: NetworkMode
  size?: number
  className?: string
}

const BookmarkIcon: React.FC<BookmarkIconProps> = ({
  bookmark,
  networkMode,
  size = 32,
  className = 'w-8 h-8'
}) => {
  const [currentIconUrl, setCurrentIconUrl] = useState<string>('')
  const [hasError, setHasError] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [fallbackIndex, setFallbackIndex] = useState(0)

  // 获取当前模式下的URL
  const getActiveUrl = useCallback(() => {
    if (networkMode === 'internal' && bookmark.internalUrl) {
      return bookmark.internalUrl
    }
    if (networkMode === 'external' && bookmark.externalUrl) {
      return bookmark.externalUrl
    }
    return bookmark.url
  }, [bookmark, networkMode])

  // 获取备用图标URL列表
  const getFallbackUrls = useCallback((domain: string) => {
    return [
      `https://www.google.com/s2/favicons?domain=${domain}&sz=${size}`,
      `https://icons.duckduckgo.com/ip3/${domain}.ico`,
      `https://${domain}/favicon.ico`,
      `https://favicons.githubusercontent.com/${domain}`
    ]
  }, [size])

  // 初始化图标URL
  useEffect(() => {
    setHasError(false)
    setFallbackIndex(0)
    
    if (bookmark.iconType === 'official') {
      const activeUrl = getActiveUrl()
      if (activeUrl) {
        const domain = getUrlDomain(activeUrl)
        if (domain) {
          // 使用更可靠的favicon获取方式
          const iconUrl = `https://www.google.com/s2/favicons?domain=${domain}&sz=${size}`
          setCurrentIconUrl(iconUrl)
          setIsLoading(true)
        } else {
          setHasError(true)
        }
      } else {
        setHasError(true)
      }
    } else if (bookmark.iconType === 'upload') {
      const iconUrl = bookmark.iconData || bookmark.icon || ''
      setCurrentIconUrl(iconUrl)
      if (iconUrl) {
        setIsLoading(true)
      } else {
        setHasError(true)
      }
    }
  }, [bookmark, networkMode, size, getActiveUrl])

  // 处理图标加载错误
  const handleImageError = useCallback(() => {
    setIsLoading(false)
    
    if (bookmark.iconType === 'official') {
      const activeUrl = getActiveUrl()
      const domain = getUrlDomain(activeUrl)
      
      if (domain) {
        const fallbackUrls = getFallbackUrls(domain)
        
        if (fallbackIndex < fallbackUrls.length - 1) {
          const nextIndex = fallbackIndex + 1
          setFallbackIndex(nextIndex)
          setCurrentIconUrl(fallbackUrls[nextIndex])
          setIsLoading(true)
          console.log(`尝试备用图标 ${nextIndex + 1}/${fallbackUrls.length}: ${fallbackUrls[nextIndex]}`)
          return
        }
      }
    }
    
    // 所有方式都失败了
    setHasError(true)
    console.warn('所有图标获取方式都失败了:', bookmark.title, bookmark.url)
  }, [bookmark, fallbackIndex, getActiveUrl, getFallbackUrls])

  // 处理图标加载成功
  const handleImageLoad = useCallback(() => {
    setIsLoading(false)
    setHasError(false)
  }, [])

  // 渲染不同类型的图标
  const renderIcon = () => {
    const baseClasses = `${className} rounded-lg border-2 border-white/20`

    switch (bookmark.iconType) {
      case 'text':
        return (
          <div
            className={`${baseClasses} flex items-center justify-center text-lg font-bold`}
            style={{
              backgroundColor: bookmark.backgroundColor || '#3b82f6',
              color: bookmark.iconColor || '#ffffff'
            }}
          >
            {bookmark.iconText?.charAt(0)?.toUpperCase() || 
             bookmark.title?.charAt(0)?.toUpperCase() || '?'}
          </div>
        )
      
      case 'upload':
        if (hasError || !currentIconUrl) {
          return (
            <div className={`${baseClasses} bg-gray-500 flex items-center justify-center`}>
              <Image className="w-4 h-4 text-white" />
            </div>
          )
        }
        
        return (
          <div className="relative">
            <img
              src={currentIconUrl}
              alt={bookmark.title}
              className={baseClasses}
              onError={handleImageError}
              onLoad={handleImageLoad}
              style={{ display: isLoading ? 'none' : 'block' }}
            />
            {isLoading && (
              <div className={`${baseClasses} bg-gray-300 flex items-center justify-center animate-pulse`}>
                <Image className="w-4 h-4 text-gray-500" />
              </div>
            )}
          </div>
        )
      
      case 'official':
      default:
        if (hasError || !currentIconUrl) {
          return (
            <div className={`${baseClasses} bg-blue-500 flex items-center justify-center`}>
              <Globe className="w-4 h-4 text-white" />
            </div>
          )
        }
        
        return (
          <div className="relative">
            <img
              src={currentIconUrl}
              alt={bookmark.title}
              className={baseClasses}
              onError={handleImageError}
              onLoad={handleImageLoad}
              style={{ display: isLoading ? 'none' : 'block' }}
            />
            {isLoading && (
              <div className={`${baseClasses} bg-gray-300 flex items-center justify-center animate-pulse`}>
                <Globe className="w-4 h-4 text-gray-500" />
              </div>
            )}
          </div>
        )
    }
  }

  return (
    <div className="relative">
      {renderIcon()}
      
      {/* 调试信息（仅在开发环境显示） */}
      {process.env.NODE_ENV === 'development' && hasError && (
        <div className="absolute -top-1 -right-1">
          <AlertCircle className="w-3 h-3 text-red-500" title="图标加载失败" />
        </div>
      )}
    </div>
  )
}

export default BookmarkIcon
