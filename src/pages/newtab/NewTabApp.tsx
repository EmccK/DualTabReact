import React, { useState, useCallback, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { BookmarkGrid, BookmarkModal } from '@/components/bookmarks'
import { NetworkSwitch } from '@/components/network'
import { CategoryModal, ResizableCategorySidebar } from '@/components/categories'
import { SettingsModal } from '@/components/settings'
import { SearchBox } from '@/components/search'
import { ClockDisplay } from '@/components/clock'
import { BackgroundWrapper } from '@/components/background'
import { useClock, useBookmarks, useNetworkMode, useCategories, useSettings } from '@/hooks'
import { Plus, RefreshCw, Settings, Cloud, Droplets, TestTube, Edit, Trash2 } from 'lucide-react'
import type { Bookmark, NetworkMode, BookmarkCategory } from '@/types'
import { createTestBookmarks } from '@/utils/test-data'
import { safeOpenUrl } from '@/utils/url-utils'
import './newtab.css'

function NewTabApp() {
  // 设置管理Hook - 最优先加载
  const { settings, updateSettings, isLoading: settingsLoading } = useSettings()
  
  // 使用设置数据的其他Hooks
  const { currentTime } = useClock(settings.preferences)
  const { networkMode, setNetworkMode, loading: networkLoading } = useNetworkMode()
  const [backgroundImage, setBackgroundImage] = useState<string>()
  const [isGlassEffect, setIsGlassEffect] = useState(true)
  
  // 书签弹窗状态
  const [bookmarkModalOpen, setBookmarkModalOpen] = useState(false)
  const [bookmarkModalMode, setBookmarkModalMode] = useState<'add' | 'edit'>('add')
  const [editingBookmark, setEditingBookmark] = useState<Bookmark | undefined>()
  
  // 书签管理Hook
  const {
    bookmarks,
    loading: bookmarksLoading,
    error: bookmarksError,
    deleteBookmark,
    reorderBookmarks,
    reload: reloadBookmarks
  } = useBookmarks()
  
  // 分类管理Hook
  const {
    categories,
    loading: categoriesLoading,
    error: categoriesError,
    addCategory,
    updateCategory,
    deleteCategory,
    reorderCategories
  } = useCategories()
  
  // 分类筛选状态 - 确保始终选中第一个分类
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null)
  
  // 当分类数据加载完成后，确保有默认选中的分类
  useEffect(() => {
    if (categories.length > 0 && !selectedCategoryId) {
      setSelectedCategoryId(categories[0].id)
    }
  }, [categories, selectedCategoryId])
  
  // 分类弹窗状态
  const [categoryModalOpen, setCategoryModalOpen] = useState(false)
  const [categoryModalMode, setCategoryModalMode] = useState<'add' | 'edit'>('add')
  const [editingCategory, setEditingCategory] = useState<BookmarkCategory | undefined>()
  
  // 设置弹窗状态
  const [settingsModalOpen, setSettingsModalOpen] = useState(false)
  
  // 通用右键菜单状态
  const [contextMenu, setContextMenu] = useState<{
    visible: boolean
    x: number
    y: number
    type: 'bookmark' | 'category' | null
    target: Bookmark | BookmarkCategory | null
  }>({
    visible: false,
    x: 0,
    y: 0,
    type: null,
    target: null
  })

  const backgroundAttributionInfo = backgroundImage ? {
    author: "示例作者",
    authorUrl: "https://unsplash.com/@author",
    source: "Unsplash",
    sourceUrl: "https://unsplash.com"
  } : undefined

  // 网络模式切换处理
  const handleNetworkModeChange = useCallback(async (mode: NetworkMode) => {
    try {
      await setNetworkMode(mode)
      console.log(`网络模式已切换到: ${mode}`)
    } catch (error) {
      console.error('网络模式切换失败:', error)
    }
  }, [setNetworkMode])

  const toggleGlassEffect = useCallback(() => {
    setIsGlassEffect(!isGlassEffect)
  }, [isGlassEffect])

  const handleWebDAVSync = useCallback(() => {
    console.log('WebDAV同步')
  }, [])

  const handleOpenSettings = useCallback(() => {
    setSettingsModalOpen(true)
  }, [])

  const handleRefreshBackground = useCallback(() => {
    console.log('刷新背景图片')
    // TODO: 实现背景图片刷新功能
  }, [])

  // 书签弹窗处理函数
  const handleAddBookmark = useCallback(() => {
    setBookmarkModalMode('add')
    setEditingBookmark(undefined)
    setBookmarkModalOpen(true)
  }, [])

  const handleEditBookmark = useCallback((bookmark: Bookmark) => {
    setBookmarkModalMode('edit')
    setEditingBookmark(bookmark)
    setBookmarkModalOpen(true)
  }, [])

  const handleCloseBookmarkModal = useCallback(() => {
    setBookmarkModalOpen(false)
    setEditingBookmark(undefined)
  }, [])

  // 处理书签点击
  const handleBookmarkClick = useCallback((bookmark: Bookmark) => {
    const url = networkMode === 'internal' && bookmark.internalUrl 
      ? bookmark.internalUrl 
      : networkMode === 'external' && bookmark.externalUrl 
        ? bookmark.externalUrl 
        : bookmark.url
    
    if (url) {
      safeOpenUrl(url)
    }
  }, [networkMode])

  // 其他回调函数...
  const hideContextMenu = useCallback(() => {
    setContextMenu({
      visible: false,
      x: 0,
      y: 0,
      type: null,
      target: null
    })
  }, [])

  // 处理删除书签
  const handleDeleteBookmark = useCallback(async (bookmark: Bookmark) => {
    if (confirm(`确定要删除书签"${bookmark.title}"吗？`)) {
      try {
        const result = await deleteBookmark(bookmark.id)
        if (result.success) {
          console.log('书签删除成功')
          hideContextMenu()
        } else {
          console.error('书签删除失败:', result.error)
          alert('删除书签失败，请重试')
        }
      } catch (error) {
        console.error('书签删除失败:', error)
        alert('删除书签失败，请重试')
      }
    }
  }, [deleteBookmark, hideContextMenu])

  // 全局点击处理
  const handleGlobalClick = useCallback((event: React.MouseEvent) => {
    if (contextMenu.visible) {
      const target = event.target as Element
      const menuElement = target.closest('[data-context-menu="true"]')
      
      if (!menuElement) {
        hideContextMenu()
      }
    }
  }, [contextMenu.visible, hideContextMenu])

  // 如果设置还在加载，显示加载状态
  if (settingsLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center">
        <div className="text-center text-white">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-lg">加载应用设置中...</p>
        </div>
      </div>
    )
  }

  return (
    <BackgroundWrapper>
      <div className="min-h-screen" onClick={handleGlobalClick}>
        {/* 主要内容区域 */}
        <div className="flex h-screen w-full">
          <div className="flex-1 flex flex-col">
            <header className="flex justify-between items-start p-6">
              <ClockDisplay
                currentTime={currentTime}
                preferences={settings.preferences}
                isGlassEffect={isGlassEffect}
              />
              <div className="flex items-center space-x-3">
                <Button
                  onClick={handleOpenSettings}
                  size="sm"
                  variant="ghost"
                  className="bg-white/10 backdrop-blur-md text-white hover:bg-white/20 border border-white/20"
                  title="应用设置"
                >
                  <Settings className="h-4 w-4" />
                </Button>
              </div>
            </header>
            
            <div className="flex-1 flex flex-col justify-center items-center px-4">
              <div className="mb-16 w-full">
                <SearchBox
                  preferences={settings.preferences}
                  isGlassEffect={isGlassEffect}
                />
              </div>
              
              <div className="w-full max-w-5xl">
                <BookmarkGrid
                  bookmarks={bookmarks}
                  categories={categories}
                  networkMode={networkMode}
                  isGlassEffect={isGlassEffect}
                  bookmarkSettings={settings.bookmarks}
                  loading={bookmarksLoading}
                  error={bookmarksError}
                  selectedCategoryId={selectedCategoryId}
                  onBookmarkClick={handleBookmarkClick}
                  onBookmarkContextMenu={() => {}}
                  onAddBookmarkClick={handleAddBookmark}
                  onBookmarksReorder={() => {}}
                />
              </div>
            </div>
          </div>
        </div>

        {/* 设置弹窗 */}
        <SettingsModal
          open={settingsModalOpen}
          onOpenChange={setSettingsModalOpen}
        />
      </div>
    </BackgroundWrapper>
  )
}

export default NewTabApp