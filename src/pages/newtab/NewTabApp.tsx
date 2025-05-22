import React, { useState, useCallback } from 'react'
import { MainLayout } from '@/components/layout'
import { Button } from '@/components/ui/button'
import { useClock } from '@/hooks'
import { Plus, RefreshCw, Settings, Cloud, Droplets, Wifi, WifiOff } from 'lucide-react'

function NewTabApp() {
  const currentTime = useClock()
  const [isOnline, setIsOnline] = useState(true)
  const [backgroundImage, setBackgroundImage] = useState<string>()
  const [isGlassEffect, setIsGlassEffect] = useState(true)
  
  // 背景图片归属信息（示例数据）
  const backgroundAttributionInfo = backgroundImage ? {
    author: "示例作者",
    authorUrl: "https://unsplash.com/@author",
    source: "Unsplash",
    sourceUrl: "https://unsplash.com"
  } : undefined

  const handleSettingsClick = useCallback(() => {
    console.log('打开设置')
    // TODO: 实现设置功能
  }, [])

  const handleRefreshBackground = useCallback(() => {
    console.log('刷新背景图片')
    // TODO: 实现背景图片刷新功能
  }, [])

  const handleSearch = useCallback((query: string) => {
    console.log('搜索:', query)
  }, [])

  const toggleNetworkMode = useCallback(() => {
    setIsOnline(!isOnline)
  }, [isOnline])

  const toggleGlassEffect = useCallback(() => {
    setIsGlassEffect(!isGlassEffect)
  }, [isGlassEffect])

  const handleAddBookmark = useCallback(() => {
    console.log('添加书签')
    // TODO: 实现添加书签功能
  }, [])

  const handleWebDAVSync = useCallback(() => {
    console.log('WebDAV同步')
    // TODO: 实现WebDAV同步功能
  }, [])

  // 示例书签数据
  const bookmarks = [
    // 暂时为空，等待书签功能实现
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 relative overflow-hidden">
      {/* 背景图片容器 */}
      {backgroundImage && (
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-opacity duration-500"
          style={{ backgroundImage: `url(${backgroundImage})` }}
        />
      )}
      
      {/* 主要内容区域 */}
      <div className="relative z-10 flex flex-col h-screen">
        
        {/* 头部控制区域 */}
        <header className="flex justify-between items-start p-6">
          {/* 左侧：时间日期显示 */}
          <div className={`${isGlassEffect ? 'bg-white/10 backdrop-blur-md' : 'bg-black/20'} rounded-lg px-4 py-2 text-white shadow-lg border border-white/20`}>
            <div className="text-2xl font-bold tracking-wide">
              {currentTime.toLocaleTimeString('zh-CN', { 
                hour12: false,
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
              })}
            </div>
            <div className="text-sm opacity-80">
              {currentTime.toLocaleDateString('zh-CN', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                weekday: 'long'
              })}
            </div>
          </div>

          {/* 右侧：控制按钮组 */}
          <div className="flex items-center space-x-3">
            {/* 毛玻璃效果切换 */}
            <Button
              onClick={toggleGlassEffect}
              size="sm"
              variant="ghost"
              className={`${isGlassEffect ? 'bg-white/10 backdrop-blur-md' : 'bg-black/20'} text-white hover:bg-white/20 border border-white/20`}
              title="切换毛玻璃效果"
            >
              <Droplets className="h-4 w-4" />
            </Button>

            {/* WebDAV同步 */}
            <Button
              onClick={handleWebDAVSync}
              size="sm"
              variant="ghost"
              className={`${isGlassEffect ? 'bg-white/10 backdrop-blur-md' : 'bg-black/20'} text-white hover:bg-white/20 border border-white/20`}
              title="WebDAV同步设置"
            >
              <Cloud className="h-4 w-4 mr-1" />
              <span className="text-xs">同步</span>
            </Button>

            {/* 网络模式切换 */}
            <div className={`${isGlassEffect ? 'bg-white/10 backdrop-blur-md' : 'bg-black/20'} rounded-lg px-3 py-2 flex items-center space-x-2 border border-white/20`}>
              <span className="text-white text-sm">网络模式：</span>
              <Button
                onClick={toggleNetworkMode}
                size="sm"
                variant="ghost"
                className="text-white hover:bg-white/20 p-1 h-auto"
              >
                {isOnline ? <Wifi className="h-4 w-4" /> : <WifiOff className="h-4 w-4" />}
              </Button>
              <span className={`text-sm font-medium ${isOnline ? 'text-green-300' : 'text-yellow-300'}`}>
                {isOnline ? '外网' : '内网'}
              </span>
            </div>
          </div>
        </header>

        {/* 中央搜索区域 */}
        <div className="flex-1 flex flex-col justify-center items-center px-6">
          <div className="w-full max-w-2xl mb-16">
            {/* Google搜索框 */}
            <form 
              action="https://www.google.com/search" 
              method="get"
              className="w-full"
            >
              <div className={`${isGlassEffect ? 'bg-white/90 backdrop-blur-md' : 'bg-white/95'} rounded-full shadow-lg border border-white/30 p-4 flex items-center transition-all duration-300 hover:shadow-xl hover:bg-white/95`}>
                <img
                  src="./images/google-logo.png"
                  alt="Google"
                  className="w-8 h-8 mr-4"
                />
                <input
                  type="text"
                  name="q"
                  placeholder="搜索"
                  className="flex-1 bg-transparent outline-none text-lg text-gray-700 placeholder-gray-500 font-medium"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      const query = (e.target as HTMLInputElement).value
                      if (query.trim()) {
                        window.open(`https://www.google.com/search?q=${encodeURIComponent(query)}`, '_blank')
                      }
                    }
                  }}
                />
              </div>
            </form>
          </div>

          {/* 书签网格区域 */}
          <div className="w-full max-w-6xl">
            {bookmarks.length === 0 ? (
              <div className="text-center">
                <div className={`${isGlassEffect ? 'bg-white/10 backdrop-blur-md' : 'bg-black/20'} rounded-lg p-8 text-white border border-white/20`}>
                  <p className="text-lg mb-4">还没有书签，点击右下角的 + 按钮开始添加</p>
                  <p className="text-sm opacity-80">书签功能即将实现...</p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4">
                {bookmarks.map((bookmark: any, index: number) => (
                  <div
                    key={index}
                    className={`${isGlassEffect ? 'bg-white/10 backdrop-blur-md' : 'bg-black/20'} rounded-lg p-4 text-center cursor-pointer transition-all duration-200 hover:scale-105 hover:bg-white/20 border border-white/20`}
                  >
                    {/* 书签图标和标题将在这里显示 */}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 右下角固定按钮组 */}
        <div className="fixed bottom-6 right-6 flex flex-col space-y-3">
          {/* 刷新背景按钮 */}
          <Button
            onClick={handleRefreshBackground}
            size="sm"
            className={`${isGlassEffect ? 'bg-white/10 backdrop-blur-md' : 'bg-black/20'} text-white hover:bg-white/20 border border-white/20 w-12 h-12 rounded-full p-0`}
            title="刷新背景图片"
          >
            <RefreshCw className="h-5 w-5" />
          </Button>

          {/* 添加书签按钮 */}
          <Button
            onClick={handleAddBookmark}
            size="sm"
            className={`${isGlassEffect ? 'bg-white/10 backdrop-blur-md' : 'bg-black/20'} text-white hover:bg-white/20 border border-white/20 w-12 h-12 rounded-full p-0`}
            title="添加书签"
          >
            <Plus className="h-5 w-5" />
          </Button>
        </div>

        {/* 背景图片归属信息 */}
        {backgroundAttributionInfo && (
          <div className="fixed bottom-3 right-3 text-xs text-white/70 bg-black/30 px-2 py-1 rounded backdrop-blur-sm">
            Photo by{' '}
            <a
              href={backgroundAttributionInfo.authorUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-white/90 hover:underline"
            >
              {backgroundAttributionInfo.author}
            </a>
            {' '}on{' '}
            <a
              href={backgroundAttributionInfo.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-white/90 hover:underline"
            >
              {backgroundAttributionInfo.source}
            </a>
          </div>
        )}
      </div>
    </div>
  )
}

export default NewTabApp