/**
 * 优化的NewTabApp组件
 * 解决分类切换和页面加载时的闪烁问题
 */

import React, { useState, useCallback, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { BookmarkModal } from '@/components/bookmarks'
import OptimizedBookmarkGridV3 from '@/components/bookmarks/OptimizedBookmarkGridV3'
import { NetworkSwitch } from '@/components/network'
import { CategoryModal, SimpleCategorySidebar } from '@/components/categories'
import { SettingsModal } from '@/components/settings'
import { SearchBox } from '@/components/search'
import { ClockDisplay } from '@/components/clock'
import { AttributionOverlay } from '@/components/background'

import { useClock, useBookmarks, useNetworkMode, useCategories, useSettings, useBackground, useBookmarkDataChangeDetection, useSettingsDataChangeDetection, debounce } from '@/hooks'
import { useCategorySwitch, usePageLoadState } from '@/hooks/useOptimizedCategories'
import { useMouseWheelCategorySwitch } from '@/hooks/useMouseWheelCategorySwitch'
import { useRuntimeMessageListener } from '@/hooks/webdav/use-storage-listener'
import { backgroundImageManager } from '@/services/background'
import type { BackgroundImageFilters } from '@/types/background'
import { Plus, RefreshCw, Settings, Edit, Trash2 } from 'lucide-react'
import type { Bookmark, NetworkMode, BookmarkCategory } from '@/types'
import { safeOpenUrl } from '@/utils/url-utils'
import './newtab.css'

const SIDEBAR_WIDTH = 160 // 固定边栏宽度

function OptimizedNewTabApp() {
  // 页面加载状态
  const isPageReady = usePageLoadState()
  
  // 设置管理Hook - 最优先加载
  const { settings, isLoading: settingsLoading } = useSettings()
  
  // 背景管理Hook
  const { backgroundStyles, currentAttribution, setOnlineImageBackground } = useBackground()
  
  // 使用设置数据的其他Hooks
  const { currentTime } = useClock(settings.preferences)
  const { networkMode, setNetworkMode } = useNetworkMode()
  
  // 书签管理Hook
  const {
    bookmarks,
    loading: bookmarksLoading,
    addBookmark,
    updateBookmark,
    deleteBookmark,
    reorderBookmarks,
    reload: reloadBookmarks
  } = useBookmarks()
  
  // 分类管理Hook
  const {
    categories,
    loading: categoriesLoading,
    addCategory,
    updateCategory,
    deleteCategory,
    reorderCategories,
    reload: reloadCategories
  } = useCategories()
  
  // 优化的分类切换Hook
  const {
    selectedCategoryName,
    handleCategorySelect,
    isInitialized: categoryInitialized
  } = useCategorySwitch({
    categories,
    categoriesLoading
  })
  
  // 鼠标滚轮切换分类Hook
  useMouseWheelCategorySwitch({
    categories,
    selectedCategoryName,
    onCategorySelect: handleCategorySelect,
    enabled: settings.bookmarks.categories.enableScrollSwitch !== false
  })
  
  // 书签弹窗状态
  const [bookmarkModalOpen, setBookmarkModalOpen] = useState(false)
  const [bookmarkModalMode, setBookmarkModalMode] = useState<'add' | 'edit'>('add')
  const [editingBookmark, setEditingBookmark] = useState<Bookmark | undefined>()
  
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

  // 页面加载时触发自动同步
  useEffect(() => {
    const triggerAutoSync = async () => {
      try {
        await chrome.runtime.sendMessage({
          action: 'auto_sync_tab_opened'
        });
      } catch (error) {
        console.debug('自动同步触发失败:', error);
      }
    };

    // 延迟一点触发，确保页面组件已经初始化
    const timer = setTimeout(triggerAutoSync, 1000);
    
    return () => clearTimeout(timer);
  }, []); // 只在组件初始加载时执行一次

  // 监听存储变化，手动刷新所有数据（添加防抖处理和数据变化检测）
  useRuntimeMessageListener(
    (message) => message.action === 'storage_changed',
    useCallback(
      debounce((message) => {
        const { changes } = message.data || {};
        if (changes && (Array.isArray(changes) || typeof changes === 'object')) {
          // 处理数组格式的changes
          if (Array.isArray(changes)) {
            if (changes.includes('bookmarks')) {
              reloadBookmarks();
            }
            if (changes.includes('categories')) {
              reloadCategories();
            }
          } 
          // 处理对象格式的changes（WebDAV同步标记）
          else if (typeof changes === 'object') {
            // 只有真实发生变化的数据才刷新
            if (changes.bookmarks && changes.bookmarks !== false) {
              reloadBookmarks();
            }
            if (changes.categories && changes.categories !== false) {
              reloadCategories();
            }
            // 如果标记为webdav_sync但没有具体变化，则不刷新
          }
        }
      }, 300),
      [reloadBookmarks, reloadCategories]
    )
  );

  // 网络模式切换处理
  const handleNetworkModeChange = useCallback(async (mode: NetworkMode) => {
    try {
      await setNetworkMode(mode)
    } catch (error) {
      console.error('网络模式切换失败:', error);
    }
  }, [setNetworkMode])

  const handleOpenSettings = useCallback(() => {
    setSettingsModalOpen(true)
  }, [])

  const handleRefreshBackground = useCallback(async () => {
    if (settings.background.type !== 'random') {
      return
    }
    
    try {
      const currentCategory = settings.background.randomImageCategory || 'nature'
      
      const filters: BackgroundImageFilters = {
        category: currentCategory !== 'all' ? currentCategory : undefined
      }
      
      const image = await backgroundImageManager.getRandomImageFromSource('random', filters)
      
      if (!backgroundImageManager.isValidBackgroundImage(image)) {
        throw new Error('获取到的图片不适合作为背景')
      }
      
      const preloadSuccess = await backgroundImageManager.preloadImage(image)
      if (!preloadSuccess) {
        throw new Error('图片预加载失败')
      }
      
      const imageUrl = backgroundImageManager.getImageUrl(image, 'large')
      await setOnlineImageBackground(image, imageUrl)
    } catch (error) {
      console.error('刷新背景图片失败:', error);
    }
  }, [settings.background.type, settings.background.randomImageCategory, setOnlineImageBackground])

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
      const target = settings.bookmarks.behavior.openIn === 'current' ? '_self' : '_blank'
      safeOpenUrl(url, target)
    }
  }, [networkMode, settings.bookmarks.behavior.openIn])

  // 处理书签保存
  const handleBookmarkSave = useCallback(async (bookmarkData: Omit<Bookmark, 'id' | 'createdAt' | 'updatedAt' | 'position'>) => {
    try {
      await addBookmark(bookmarkData)
    } catch (error) {
      throw error
    }
  }, [addBookmark])

  // 处理书签更新
  const handleBookmarkUpdate = useCallback(async (bookmarkUrl: string, updates: Partial<Omit<Bookmark, 'createdAt' | 'updatedAt'>>) => {
    try {
      await updateBookmark(bookmarkUrl, updates)
    } catch (error) {
      throw error
    }
  }, [updateBookmark])

  // 通用右键菜单显示函数
  const showContextMenu = useCallback((
    event: React.MouseEvent,
    type: 'bookmark' | 'category',
    target: Bookmark | BookmarkCategory
  ) => {
    event.preventDefault()
    event.stopPropagation()

    if (contextMenu.visible && contextMenu.target === target) {
      return
    }

    const menuWidth = 150
    const menuHeight = 100
    const viewportWidth = window.innerWidth
    const viewportHeight = window.innerHeight

    let x = event.clientX
    let y = event.clientY

    if (x + menuWidth > viewportWidth) {
      x = viewportWidth - menuWidth - 10
    }
    if (y + menuHeight > viewportHeight) {
      y = viewportHeight - menuHeight - 10
    }
    if (x < 10) x = 10
    if (y < 10) y = 10

    if (contextMenu.visible && contextMenu.target !== target) {
      setContextMenu(prev => ({ ...prev, visible: false }))
      setTimeout(() => {
        setContextMenu({
          visible: true,
          x,
          y,
          type,
          target
        })
      }, 50)
    } else {
      setContextMenu({
        visible: true,
        x,
        y,
        type,
        target
      })
    }
  }, [contextMenu.visible, contextMenu.target])

  // 关闭右键菜单
  const hideContextMenu = useCallback(() => {
    setContextMenu({
      visible: false,
      x: 0,
      y: 0,
      type: null,
      target: null
    })
  }, [])

  // 处理书签右键菜单
  const handleBookmarkContextMenu = useCallback((bookmark: Bookmark, event: React.MouseEvent) => {
    showContextMenu(event, 'bookmark', bookmark)
  }, [showContextMenu])

  // 处理分类右键菜单
  const handleCategoryContextMenu = useCallback((category: BookmarkCategory, event: React.MouseEvent) => {
    showContextMenu(event, 'category', category)
  }, [showContextMenu])

  // 处理书签重排序
  const handleBookmarksReorder = useCallback(async (reorderedBookmarks: Bookmark[]) => {
    try {
      await reorderBookmarks(reorderedBookmarks)
    } catch (error) {
      console.error('书签重排序失败:', error);
    }
  }, [reorderBookmarks])

  // 添加分类处理
  const handleAddCategory = useCallback(() => {
    setCategoryModalMode('add')
    setEditingCategory(undefined)
    setCategoryModalOpen(true)
  }, [])

  // 编辑分类处理
  const handleEditCategory = useCallback((category: BookmarkCategory) => {
    setCategoryModalMode('edit')
    setEditingCategory(category)
    setCategoryModalOpen(true)
  }, [])

  // 删除分类处理
  const handleDeleteCategory = useCallback(async (categoryName: string) => {
    if (categories.length <= 1) {
      alert('至少需要保留一个分类')
      return
    }
    
    try {
      const result = await deleteCategory(categoryName)
      if (result.success) {
        hideContextMenu()
        if (selectedCategoryName === categoryName) {
          const remainingCategory = categories.find(cat => cat.name !== categoryName)
          const newSelectedName = remainingCategory?.name || null
          await handleCategorySelect(newSelectedName)
        }
      } else {
        console.error('删除分类失败:', result.error);
      }
    } catch (error) {
      console.error('删除分类异常:', error);
    }
  }, [deleteCategory, selectedCategoryName, hideContextMenu, categories, handleCategorySelect])

  // 关闭分类弹窗
  const handleCloseCategoryModal = useCallback(() => {
    setCategoryModalOpen(false)
    setEditingCategory(undefined)
  }, [])

  // 保存分类
  const handleSaveCategory = useCallback(async (categoryData: Omit<BookmarkCategory, 'createdAt' | 'updatedAt'>) => {
    try {
      const result = await addCategory(categoryData)
      if (result.success) {
        console.log('分类保存成功');
      } else {
        console.error('分类保存失败:', result.error);
      }
    } catch (error) {
      console.error('分类保存异常:', error);
    }
  }, [addCategory])

  // 更新分类
  const handleUpdateCategory = useCallback(async (name: string, updates: Partial<BookmarkCategory>) => {
    try {
      const result = await updateCategory(name, updates)
      if (result.success) {
        console.log('分类更新成功');
      } else {
        console.error('分类更新失败:', result.error);
      }
    } catch (error) {
      console.error('分类更新异常:', error);
    }
  }, [updateCategory])

  // 重排序分类
  const handleReorderCategories = useCallback(async (reorderedCategories: BookmarkCategory[]) => {
    try {
      const result = await reorderCategories(reorderedCategories)
      if (result.success) {
        console.log('分类重排序成功');
      } else {
        console.error('分类重排序失败:', result.error);
      }
    } catch (error) {
      console.error('分类重排序异常:', error);
    }
  }, [reorderCategories])

  // 处理删除书签
  const handleDeleteBookmark = useCallback(async (bookmark: Bookmark) => {
    if (confirm(`确定要删除书签"${bookmark.title}"吗？`)) {
      try {
        const result = await deleteBookmark(bookmark.url)
        if (result.success) {
          hideContextMenu()
        } else {
          alert('删除书签失败，请重试')
        }
      } catch (error) {
        alert('删除书签失败，请重试')
      }
    }
  }, [deleteBookmark, hideContextMenu])

  // 全局点击处理
  const handleGlobalClick = useCallback((event: React.MouseEvent) => {
    if (contextMenu.visible) {
      const target = event.target as Element
      const menuElement = target.closest('[data-context-menu="true"]')
      const sidebarElement = target.closest('[data-category-sidebar="true"]')
      
      if (!menuElement && !sidebarElement) {
        hideContextMenu()
      }
    }
  }, [contextMenu.visible, hideContextMenu])

  // 监听来自background的消息
  useEffect(() => {
    const handleMessage = (message: unknown, _sender: unknown, sendResponse: (response?: unknown) => void) => {
      if (message.action === 'get_selected_category') {
        sendResponse({ selectedCategoryName })
        return true
      }
      return false
    }

    chrome.runtime.onMessage.addListener(handleMessage)
    return () => {
      chrome.runtime.onMessage.removeListener(handleMessage)
    }
  }, [selectedCategoryName])

  // 数据变更检测 - 自动触发同步上传
  useBookmarkDataChangeDetection(bookmarks, categories, {
    enabled: !bookmarksLoading && !categoriesLoading && categoryInitialized,
    debounceDelay: 2000,
  })

  // 设置变更检测 - 自动触发同步上传
  useSettingsDataChangeDetection(settings, {
    enabled: !settingsLoading,
    debounceDelay: 3000,
  })

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

  // 计算显示的书签（使用优化的过滤逻辑）
  const displayBookmarks = bookmarks.filter(bookmark => 
    !selectedCategoryName || bookmark.categoryName === selectedCategoryName
  )

  return (
    <div
      className="min-h-screen relative overflow-hidden transition-all duration-500"
      style={backgroundStyles}
      onClick={handleGlobalClick}
    >
      {/* 主要内容区域 */}
      <div 
        className="relative z-10 flex h-screen w-full transition-all duration-300"
        style={{ 
          paddingRight: settings.bookmarks.categories.sidebarVisible === 'auto' 
            ? '0px' 
            : `${SIDEBAR_WIDTH}px` 
        }}
      >
        {/* 左侧主内容区域 */}
        <div className="flex-1 flex flex-col">
        
          {/* 头部控制区域 */}
          <header className="flex justify-between items-start p-6">
            {/* 左侧：时间日期显示 */}
            <ClockDisplay
              currentTime={currentTime}
              preferences={settings.preferences}
            />

            {/* 右侧：控制按钮组 */}
            <div className="flex items-center space-x-3">
              {/* 设置按钮 */}
              <Button
                onClick={handleOpenSettings}
                size="sm"
                variant="ghost"
                className="bg-white/10 backdrop-blur-md text-white hover:bg-white/20 border border-white/20"
                title="应用设置"
              >
                <Settings className="h-4 w-4" />
              </Button>

              {/* 网络模式切换 */}
              <NetworkSwitch
                networkMode={networkMode}
                onNetworkModeChange={handleNetworkModeChange}
              />
            </div>
          </header>

          {/* 固定位置的搜索区域 */}
          <div className="pt-16 px-4 relative z-40">
            <div className="w-full">
              <SearchBox
                preferences={settings.preferences}
              />
            </div>
          </div>

          {/* 书签网格区域 - 使用优化后的组件 */}
          <div className="flex-1 flex items-start justify-center pt-16 px-4 relative z-10">
            <div className="w-full max-w-5xl">
              {/* 只有在页面准备好且分类已初始化且不在加载状态时才显示书签网格 */}
              {isPageReady && categoryInitialized && !bookmarksLoading ? (
                <OptimizedBookmarkGridV3
                  bookmarks={bookmarks}
                  selectedCategoryName={selectedCategoryName}
                  networkMode={networkMode}
                  bookmarkSettings={settings.bookmarks}
                  onBookmarkClick={handleBookmarkClick}
                  onBookmarkContextMenu={handleBookmarkContextMenu}
                  onBookmarkReorder={handleBookmarksReorder}
                  className="min-h-[200px]"
                />
              ) : bookmarksLoading ? (
                // 书签加载状态
                <div className="flex items-center justify-center py-8">
                  <div className="text-white/50 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white/50 mx-auto mb-2"></div>
                    <div className="text-sm">加载书签中...</div>
                  </div>
                </div>
              ) : null}
              
              {/* 添加书签按钮 - 当没有书签时显示 */}
              {displayBookmarks.length === 0 && !bookmarksLoading && categoryInitialized && (
                <div className="flex flex-col items-center justify-center py-12">
                  <div className="text-white/70 text-center">
                    <div className="text-4xl mb-4">📚</div>
                    <div className="text-lg font-medium mb-4">暂无书签</div>
                    <Button
                      onClick={handleAddBookmark}
                      className="bg-white/10 backdrop-blur-md text-white hover:bg-white/20 border border-white/20"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      添加第一个书签
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 右侧分类边栏 */}
        <SimpleCategorySidebar
          categories={categories}
          selectedCategoryName={selectedCategoryName}
          onCategorySelect={handleCategorySelect}
          onAddCategory={handleAddCategory}
          onEditCategory={handleEditCategory}
          onDeleteCategory={handleDeleteCategory}
          onReorderCategories={handleReorderCategories}
          onCategoryContextMenu={handleCategoryContextMenu}
          loading={categoriesLoading}
          categorySettings={settings.bookmarks.categories}
          contextMenuVisible={contextMenu.visible && contextMenu.type === 'category'}
        />
      </div>

      {/* 右下角固定按钮组 */}
      <div 
        className="fixed bottom-6 z-30 flex flex-col space-y-3 transition-all duration-300"
        style={{ 
          right: settings.bookmarks.categories.sidebarVisible === 'auto' 
            ? '24px' 
            : `${SIDEBAR_WIDTH + 24}px` 
        }}
      >
        {/* 刷新背景按钮 */}
        {settings.background.type === 'random' && (
          <Button
            onClick={handleRefreshBackground}
            size="sm"
            className="bg-white/10 backdrop-blur-md text-white hover:bg-white/20 border border-white/20 w-12 h-12 rounded-full p-0"
            title="刷新背景图片"
          >
            <RefreshCw className="h-5 w-5" />
          </Button>
        )}

        {/* 添加书签按钮 */}
        <Button
          onClick={handleAddBookmark}
          size="sm"
          className="bg-white/10 backdrop-blur-md text-white hover:bg-white/20 border border-white/20 w-12 h-12 rounded-full p-0"
          title="添加书签"
        >
          <Plus className="h-5 w-5" />
        </Button>
      </div>

      {/* 背景图片归属信息覆盖层 */}
      <AttributionOverlay
        attribution={currentAttribution}
        config={{
          show: true,
          position: 'bottom-right',
          style: 'compact',
          autoHide: false,
          opacity: 0.8
        }}
      />

      {/* 书签弹窗 */}
      <BookmarkModal
        isOpen={bookmarkModalOpen}
        onClose={handleCloseBookmarkModal}
        mode={bookmarkModalMode}
        bookmark={editingBookmark}
        networkMode={networkMode}
        selectedCategoryName={selectedCategoryName}
        onSuccess={reloadBookmarks}
        onSave={handleBookmarkSave}
        onUpdate={handleBookmarkUpdate}
      />

      {/* 分类弹窗 */}
      <CategoryModal
        isOpen={categoryModalOpen}
        onClose={handleCloseCategoryModal}
        mode={categoryModalMode}
        category={editingCategory}
        onSave={handleSaveCategory}
        onUpdate={handleUpdateCategory}
      />

      {/* 设置弹窗 */}
      <SettingsModal
        open={settingsModalOpen}
        onOpenChange={setSettingsModalOpen}
      />

      {/* 统一右键菜单 */}
      {contextMenu.visible && contextMenu.target && (
        <div
          data-context-menu="true"
          className="fixed z-50 bg-white rounded-lg shadow-xl border border-gray-200 py-1 min-w-32 animate-in fade-in-0 zoom-in-95 duration-200"
          style={{
            left: contextMenu.x,
            top: contextMenu.y,
          }}
          onClick={(e) => e.stopPropagation()}
          onContextMenu={(e) => e.preventDefault()}
        >
          <button
            onClick={() => {
              if (contextMenu.type === 'bookmark') {
                handleEditBookmark(contextMenu.target as Bookmark)
              } else if (contextMenu.type === 'category') {
                handleEditCategory(contextMenu.target as BookmarkCategory)
              }
              hideContextMenu()
            }}
            className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2 transition-colors duration-150"
          >
            <Edit className="w-4 h-4" />
            <span>{contextMenu.type === 'bookmark' ? '编辑' : '编辑分类'}</span>
          </button>
          <button
            onClick={() => {
              if (contextMenu.type === 'bookmark') {
                handleDeleteBookmark(contextMenu.target as Bookmark)
              } else if (contextMenu.type === 'category') {
                handleDeleteCategory((contextMenu.target as BookmarkCategory).name)
              }
            }}
            disabled={contextMenu.type === 'category' && categories.length <= 1}
            className={`w-full px-4 py-2 text-left text-sm flex items-center space-x-2 transition-colors duration-150 ${
              contextMenu.type === 'category' && categories.length <= 1
                ? 'text-gray-400 cursor-not-allowed'
                : 'text-red-600 hover:bg-red-50 hover:text-red-700'
            }`}
          >
            <Trash2 className="w-4 h-4" />
            <span>{contextMenu.type === 'bookmark' ? '删除' : '删除分类'}</span>
          </button>
        </div>
      )}
    </div>
  )
}

export default OptimizedNewTabApp
