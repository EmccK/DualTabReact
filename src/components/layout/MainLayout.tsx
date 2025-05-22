import React from 'react'
import { BackgroundContainer } from './BackgroundContainer'
import { Header } from './Header'
import { SearchBar } from './SearchBar'
import { cn } from '@/lib/utils'

interface MainLayoutProps {
  children: React.ReactNode
  className?: string
  backgroundImage?: string
  currentTime?: Date
  onSettingsClick?: () => void
  onRefreshBackground?: () => void
  onSearch?: (query: string) => void
  showHeader?: boolean
  showSearchBar?: boolean
  backgroundAttributionInfo?: {
    author: string
    authorUrl?: string
    source: string
    sourceUrl?: string
  }
}

export const MainLayout: React.FC<MainLayoutProps> = ({
  children,
  className,
  backgroundImage,
  currentTime,
  onSettingsClick,
  onRefreshBackground,
  onSearch,
  showHeader = true,
  showSearchBar = true,
  backgroundAttributionInfo
}) => {
  return (
    <BackgroundContainer
      backgroundImage={backgroundImage}
      attributionInfo={backgroundAttributionInfo}
      className={className}
    >
      <div className="min-h-screen flex flex-col">
        {/* 头部区域 */}
        {showHeader && (
          <Header
            currentTime={currentTime}
            onSettingsClick={onSettingsClick}
            onRefreshBackground={onRefreshBackground}
          />
        )}

        {/* 主要内容区域 */}
        <main className="flex-1 flex flex-col">
          {/* 搜索栏区域 */}
          {showSearchBar && (
            <div className="px-6 py-8">
              <SearchBar onSearch={onSearch} />
            </div>
          )}

          {/* 页面主要内容 */}
          <div className={cn("flex-1 px-6 pb-6", className)}>
            {children}
          </div>
        </main>
      </div>
    </BackgroundContainer>
  )
}

export default MainLayout
