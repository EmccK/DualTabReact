import React, { useState, useCallback } from 'react'
import { MainLayout } from '@/components/layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useClock } from '@/hooks'
import { BookOpen, Grid3X3, Image, Settings, Wifi, WifiOff } from 'lucide-react'

function NewTabApp() {
  const currentTime = useClock()
  const [isOnline, setIsOnline] = useState(true)
  const [backgroundImage, setBackgroundImage] = useState<string>()
  
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

  return (
    <MainLayout
      currentTime={currentTime}
      backgroundImage={backgroundImage}
      backgroundAttributionInfo={backgroundAttributionInfo}
      onSettingsClick={handleSettingsClick}
      onRefreshBackground={handleRefreshBackground}
      onSearch={handleSearch}
    >
      {/* 内外网模式切换 */}
      <div className="mb-6">
        <Card className="bg-white/80 backdrop-blur-sm border-white/20 shadow-lg">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center space-x-2">
              {isOnline ? <Wifi className="h-5 w-5" /> : <WifiOff className="h-5 w-5" />}
              <span>当前模式：{isOnline ? '外网' : '内网'}</span>
            </CardTitle>
            <CardDescription>
              切换内外网模式以显示对应的书签和地址
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={toggleNetworkMode}
              variant={isOnline ? "default" : "secondary"}
              className="w-full"
            >
              切换到{isOnline ? '内网' : '外网'}模式
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* 功能状态展示 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* 书签管理 */}
        <Card className="bg-white/80 backdrop-blur-sm border-white/20 shadow-lg hover:shadow-xl transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <BookOpen className="h-5 w-5 text-blue-600" />
              <span>书签管理</span>
            </CardTitle>
            <CardDescription>
              管理您的书签，支持分类和快速访问
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>书签数量</span>
                <span className="font-medium">0</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>分类数量</span>
                <span className="font-medium">0</span>
              </div>
              <Button variant="outline" className="w-full mt-4" disabled>
                即将实现...
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* 分类系统 */}
        <Card className="bg-white/80 backdrop-blur-sm border-white/20 shadow-lg hover:shadow-xl transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Grid3X3 className="h-5 w-5 text-green-600" />
              <span>分类系统</span>
            </CardTitle>
            <CardDescription>
              自定义分类，更好地组织您的书签
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>默认分类</span>
                <span className="font-medium">已创建</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>自定义分类</span>
                <span className="font-medium">0</span>
              </div>
              <Button variant="outline" className="w-full mt-4" disabled>
                即将实现...
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* 背景图片 */}
        <Card className="bg-white/80 backdrop-blur-sm border-white/20 shadow-lg hover:shadow-xl transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Image className="h-5 w-5 text-purple-600" />
              <span>背景图片</span>
            </CardTitle>
            <CardDescription>
              自动更换精美的背景图片
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>当前背景</span>
                <span className="font-medium">
                  {backgroundImage ? '自定义' : '默认渐变'}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Unsplash API</span>
                <span className="font-medium">未配置</span>
              </div>
              <Button variant="outline" className="w-full mt-4" disabled>
                即将实现...
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 开发状态信息 */}
      <div className="mt-8">
        <Card className="bg-white/80 backdrop-blur-sm border-white/20 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Settings className="h-5 w-5 text-gray-600" />
              <span>开发状态</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <h4 className="font-medium text-green-600 mb-2">✅ 已完成</h4>
                <ul className="space-y-1 text-gray-600">
                  <li>• 基础架构与配置</li>
                  <li>• 核心存储与工具模块</li>
                  <li>• 路由与页面结构</li>
                  <li>• 基础UI组件库</li>
                  <li>• 布局系统</li>
                  <li>• 实时时钟</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-blue-600 mb-2">🚧 待实现</h4>
                <ul className="space-y-1 text-gray-600">
                  <li>• 书签数据管理</li>
                  <li>• 分类管理系统</li>
                  <li>• 背景图片系统</li>
                  <li>• WebDAV同步</li>
                  <li>• 弹出窗口功能</li>
                  <li>• 性能优化</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  )
}

export default NewTabApp
