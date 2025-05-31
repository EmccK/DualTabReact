/**
 * 书签系统演示页面
 * 展示新的书签显示系统的所有功能
 */

import React, { useState, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BookmarkGridV2, BookmarkAppearancePage } from '@/components/bookmarks';
import { useBookmarkManager } from '@/hooks/bookmarks';
import { BOOKMARK_DISPLAY_STYLES } from '@/constants';
import type { Bookmark, NetworkMode } from '@/types';
import type { BookmarkSettings } from '@/types/settings';
import type { BookmarkDisplayStyle } from '@/types/bookmark-display.types';
import { Eye, Settings, Grid, Search, BarChart3 } from 'lucide-react';

// 模拟的书签设置
const mockBookmarkSettings: BookmarkSettings = {
  display: {
    iconSize: 32,
    showTitle: true,
    itemsPerRow: 'auto',
    cardSpacing: 16,
    cardPadding: 16,
    showFavicons: true,
    showDescriptions: true,
  },
  behavior: {
    openIn: 'current',
    hoverScale: 1.05,
  },
  grid: {
    columns: 'auto',
    aspectRatio: '1/1',
    responsive: true,
    minCardWidth: 120,
    maxCardWidth: 200,
  },
  categories: {
    sidebarVisible: 'always',
  },
};

// 示例书签数据
const sampleBookmarks: Bookmark[] = [
  {
    id: '1',
    name: 'Google',
    title: 'Google',
    url: 'https://www.google.com',
    description: '全球最大的搜索引擎',
    iconType: 'official',
    createdAt: Date.now() - 86400000,
    updatedAt: Date.now() - 86400000,
  },
  {
    id: '2',
    name: 'GitHub',
    title: 'GitHub',
    url: 'https://github.com',
    description: '全球最大的代码托管平台',
    iconType: 'official',
    createdAt: Date.now() - 172800000,
    updatedAt: Date.now() - 172800000,
  },
  {
    id: '3',
    name: 'React',
    title: 'React',
    url: 'https://reactjs.org',
    description: 'JavaScript库，用于构建用户界面',
    iconType: 'text',
    iconText: 'R',
    iconColor: '#ffffff',
    backgroundColor: '#61dafb',
    createdAt: Date.now() - 259200000,
    updatedAt: Date.now() - 259200000,
  },
  {
    id: '4',
    name: 'TypeScript',
    title: 'TypeScript',
    url: 'https://www.typescriptlang.org',
    description: 'JavaScript的超集，添加了静态类型',
    iconType: 'text',
    iconText: 'TS',
    iconColor: '#ffffff',
    backgroundColor: '#3178c6',
    createdAt: Date.now() - 345600000,
    updatedAt: Date.now() - 345600000,
  },
  {
    id: '5',
    name: 'Tailwind CSS',
    title: 'Tailwind CSS',
    url: 'https://tailwindcss.com',
    description: '实用优先的CSS框架',
    iconType: 'text',
    iconText: 'TW',
    iconColor: '#ffffff',
    backgroundColor: '#06b6d4',
    createdAt: Date.now() - 432000000,
    updatedAt: Date.now() - 432000000,
  },
  {
    id: '6',
    name: 'Vite',
    title: 'Vite',
    url: 'https://vitejs.dev',
    description: '下一代前端构建工具',
    iconType: 'text',
    iconText: 'V',
    iconColor: '#ffffff',
    backgroundColor: '#646cff',
    createdAt: Date.now() - 518400000,
    updatedAt: Date.now() - 518400000,
  },
];

const BookmarkDemoPage: React.FC = () => {
  const [displayStyle, setDisplayStyle] = useState<BookmarkDisplayStyle>(BOOKMARK_DISPLAY_STYLES.DETAILED);
  const [borderRadius, setBorderRadius] = useState(8);
  const [networkMode, setNetworkMode] = useState<NetworkMode>('external');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTab, setSelectedTab] = useState('grid');

  // 使用书签管理器Hook
  const bookmarkManager = useBookmarkManager({
    networkMode,
    bookmarkSettings: mockBookmarkSettings,
    displayStyle,
    borderRadius,
    searchQuery,
  });

  // 模拟书签数据（因为useBookmarks可能返回空数组）
  const displayBookmarks = bookmarkManager.bookmarks.length > 0 ? bookmarkManager.filteredBookmarks : sampleBookmarks;

  // 处理书签点击
  const handleBookmarkClick = useCallback((bookmark: Bookmark) => {
    console.log('书签点击:', bookmark.title, bookmark.url);
    // 在实际应用中这里会打开URL
  }, []);

  // 处理书签右键菜单
  const handleBookmarkContextMenu = useCallback((bookmark: Bookmark, event: React.MouseEvent) => {
    event.preventDefault();
    console.log('书签右键菜单:', bookmark.title);
    // 在实际应用中这里会显示上下文菜单
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8">
        {/* 页面标题 */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            DualTab 书签系统演示
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400">
            支持两种显示样式的现代化书签管理系统
          </p>
        </div>

        {/* 主要内容 */}
        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="grid" className="flex items-center space-x-2">
              <Grid size={16} />
              <span>书签展示</span>
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center space-x-2">
              <Settings size={16} />
              <span>外观设置</span>
            </TabsTrigger>
            <TabsTrigger value="demo" className="flex items-center space-x-2">
              <Eye size={16} />
              <span>功能演示</span>
            </TabsTrigger>
          </TabsList>

          {/* 书签展示 */}
          <TabsContent value="grid" className="space-y-6">
            {/* 控制面板 */}
            <Card className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                {/* 显示样式选择 */}
                <div className="space-y-2">
                  <Label>显示样式</Label>
                  <Select value={displayStyle} onValueChange={(value: BookmarkDisplayStyle) => setDisplayStyle(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={BOOKMARK_DISPLAY_STYLES.DETAILED}>详细样式</SelectItem>
                      <SelectItem value={BOOKMARK_DISPLAY_STYLES.COMPACT}>紧凑样式</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* 网络模式 */}
                <div className="space-y-2">
                  <Label>网络模式</Label>
                  <Select value={networkMode} onValueChange={(value: NetworkMode) => setNetworkMode(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="external">外网模式</SelectItem>
                      <SelectItem value="internal">内网模式</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* 圆角设置 */}
                <div className="space-y-2">
                  <Label>圆角大小</Label>
                  <Select value={borderRadius.toString()} onValueChange={(value) => setBorderRadius(Number(value))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">直角</SelectItem>
                      <SelectItem value="4">轻微</SelectItem>
                      <SelectItem value="8">适中</SelectItem>
                      <SelectItem value="12">圆润</SelectItem>
                      <SelectItem value="16">很圆</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* 搜索 */}
                <div className="space-y-2">
                  <Label>搜索书签</Label>
                  <div className="relative">
                    <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <Input
                      placeholder="输入关键词..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
              </div>

              {/* 统计信息 */}
              <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
                <div className="flex items-center space-x-4">
                  <span>共 {displayBookmarks.length} 个书签</span>
                  <span>显示样式: {displayStyle === BOOKMARK_DISPLAY_STYLES.DETAILED ? '详细' : '紧凑'}</span>
                  <span>圆角: {borderRadius}px</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSearchQuery('')}
                    disabled={!searchQuery}
                  >
                    清除搜索
                  </Button>
                </div>
              </div>
            </Card>

            {/* 书签网格 */}
            <Card className="p-6">
              <BookmarkGridV2
                bookmarks={displayBookmarks}
                networkMode={networkMode}
                bookmarkSettings={mockBookmarkSettings}
                displayStyle={displayStyle}
                borderRadius={borderRadius}
                searchQuery={searchQuery}
                onBookmarkClick={handleBookmarkClick}
                onBookmarkContextMenu={handleBookmarkContextMenu}
                className="min-h-[400px]"
              />
            </Card>
          </TabsContent>

          {/* 外观设置 */}
          <TabsContent value="settings" className="space-y-6">
            <BookmarkAppearancePage
              bookmarkSettings={mockBookmarkSettings}
              onSettingsChange={(updates) => {
                console.log('设置更新:', updates);
              }}
              sampleBookmark={sampleBookmarks[0]}
            />
          </TabsContent>

          {/* 功能演示 */}
          <TabsContent value="demo" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* 样式对比 */}
              <Card className="p-6">
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <BarChart3 size={20} />
                    <h3 className="text-lg font-medium">样式对比</h3>
                  </div>
                  
                  <div className="space-y-6">
                    {/* 详细样式 */}
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">详细样式</Label>
                      <div className="p-4 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-lg">
                        <div className="flex justify-center">
                          <div className="w-32 h-24 bg-white/10 backdrop-blur-md border border-white/20 rounded-lg flex flex-col items-center justify-center p-3">
                            <div className="w-8 h-8 bg-blue-500 rounded-lg mb-2 flex items-center justify-center text-white text-sm font-bold">
                              G
                            </div>
                            <div className="text-xs text-white text-center truncate w-full">
                              Google搜索
                            </div>
                            <div className="text-xs text-white/70 text-center truncate w-full mt-1">
                              全球最大搜索引擎
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="text-xs text-gray-500">
                        显示图标、标题和描述，适合大屏幕使用
                      </div>
                    </div>

                    {/* 紧凑样式 */}
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">紧凑样式</Label>
                      <div className="p-4 bg-gradient-to-br from-green-500/20 to-blue-500/20 rounded-lg">
                        <div className="flex justify-center">
                          <div className="w-20 h-24 bg-white/10 backdrop-blur-md border border-white/20 rounded-lg flex flex-col items-center justify-between p-2">
                            <div className="flex-1 flex items-center">
                              <div className="w-6 h-6 bg-green-500 rounded-lg flex items-center justify-center text-white text-xs font-bold">
                                G
                              </div>
                            </div>
                            <div className="text-xs text-white text-center truncate w-full">
                              Google
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="text-xs text-gray-500">
                        只显示图标和标题，节省空间
                      </div>
                    </div>
                  </div>
                </div>
              </Card>

              {/* 功能特性 */}
              <Card className="p-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">主要特性</h3>
                  
                  <div className="space-y-3">
                    <div className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                      <div>
                        <div className="font-medium text-sm">两种显示样式</div>
                        <div className="text-xs text-gray-500">详细样式和紧凑样式自由切换</div>
                      </div>
                    </div>
                    
                    <div className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                      <div>
                        <div className="font-medium text-sm">三种图标类型</div>
                        <div className="text-xs text-gray-500">官方图标、文字图标、上传图片</div>
                      </div>
                    </div>
                    
                    <div className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
                      <div>
                        <div className="font-medium text-sm">可配置圆角</div>
                        <div className="text-xs text-gray-500">0-20px圆角大小调节</div>
                      </div>
                    </div>
                    
                    <div className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2"></div>
                      <div>
                        <div className="font-medium text-sm">自定义颜色</div>
                        <div className="text-xs text-gray-500">文字色和背景色自由设置</div>
                      </div>
                    </div>
                    
                    <div className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-red-500 rounded-full mt-2"></div>
                      <div>
                        <div className="font-medium text-sm">响应式布局</div>
                        <div className="text-xs text-gray-500">自动适配不同屏幕尺寸</div>
                      </div>
                    </div>
                    
                    <div className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-indigo-500 rounded-full mt-2"></div>
                      <div>
                        <div className="font-medium text-sm">拖拽排序</div>
                        <div className="text-xs text-gray-500">支持书签拖拽重新排序</div>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            </div>

            {/* 技术说明 */}
            <Card className="p-6">
              <div className="space-y-4">
                <h3 className="text-lg font-medium">技术实现</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <h4 className="font-medium text-sm">架构设计</h4>
                    <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                      <li>• 极度模块化设计，单一职责原则</li>
                      <li>• TypeScript严格类型约束</li>
                      <li>• React 19 + Hooks架构</li>
                      <li>• Shadcn/UI + Tailwind CSS</li>
                    </ul>
                  </div>
                  
                  <div className="space-y-3">
                    <h4 className="font-medium text-sm">性能优化</h4>
                    <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                      <li>• 图片压缩和懒加载</li>
                      <li>• 虚拟滚动支持</li>
                      <li>• 防抖和节流处理</li>
                      <li>• 内存管理和清理</li>
                    </ul>
                  </div>
                </div>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default BookmarkDemoPage;
