import React, { useState, useCallback, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { BookmarkGridV3, BookmarkModal } from '@/components/bookmarks'
import { NetworkSwitch } from '@/components/network'
import { CategoryModal, SimpleCategorySidebar } from '@/components/categories'
import { SettingsModal } from '@/components/settings'
import { SearchBox } from '@/components/search'
import { ClockDisplay } from '@/components/clock'
import { AttributionOverlay } from '@/components/background'
import { useClock, useBookmarks, useNetworkMode, useCategories, useSettings, useBackground } from '@/hooks'
import { backgroundImageManager } from '@/services/background'
import type { BackgroundImageFilters } from '@/types/background'
import { Plus, RefreshCw, Settings, Edit, Trash2 } from 'lucide-react'
import type { Bookmark, NetworkMode, BookmarkCategory } from '@/types'
import { safeOpenUrl } from '@/utils/url-utils'
import './newtab.css'

const SIDEBAR_WIDTH = 160 // 固定边栏宽度

function NewTabApp() {
  // 设置管理Hook - 最优先加载
  const { settings, updateSettings, isLoading: settingsLoading } = useSettings()
  
  // 背景管理Hook
  const { backgroundStyles, currentAttribution, setOnlineImageBackground } = useBackground()
  
  // 使用设置数据的其他Hooks
  const { currentTime } = useClock(settings.preferences)
  const { networkMode, setNetworkMode, loading: networkLoading } = useNetworkMode()
  // 毛玻璃效果始终启用
  const isGlassEffect = true
  
  // 书签弹窗状态
  const [bookmarkModalOpen, setBookmarkModalOpen] = useState(false)
  const [bookmarkModalMode, setBookmarkModalMode] = useState<'add' | 'edit'>('add')
  const [editingBookmark, setEditingBookmark] = useState<Bookmark | undefined>()
  
  // 书签管理Hook
  const {
    bookmarks,
    loading: bookmarksLoading,
    error: bookmarksError,
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
    error: categoriesError,
    addCategory,
    updateCategory,
    deleteCategory,
    reorderCategories,
    reload: reloadCategories
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

  // 网络模式切换处理
  const handleNetworkModeChange = useCallback(async (mode: NetworkMode) => {
    try {
      await setNetworkMode(mode)
      console.log(`网络模式已切换到: ${mode}`)
    } catch (error) {
      console.error('网络模式切换失败:', error)
    }
  }, [setNetworkMode])


  const handleOpenSettings = useCallback(() => {
    setSettingsModalOpen(true)
  }, [])

  const handleRefreshBackground = useCallback(async () => {
    console.log('刷新背景图片')
    
    // 只有在随机图片模式下才刷新
    if (settings.background.type !== 'random') {
      console.log('当前不是随机图片模式，跳过刷新')
      return
    }
    
    try {
      // 从设置中获取当前的分类设置，默认为'nature'
      const currentCategory = settings.background.randomImageCategory || 'nature'
      
      const filters: BackgroundImageFilters = {
        category: currentCategory !== 'all' ? currentCategory : undefined
      }
      
      // 获取随机图片
      const image = await backgroundImageManager.getRandomImageFromSource('random', filters)
      
      // 验证图片
      if (!backgroundImageManager.isValidBackgroundImage(image)) {
        throw new Error('获取到的图片不适合作为背景')
      }
      
      // 预加载图片
      const preloadSuccess = await backgroundImageManager.preloadImage(image)
      if (!preloadSuccess) {
        throw new Error('图片预加载失败')
      }
      
      // 设置为背景
      const imageUrl = backgroundImageManager.getImageUrl(image, 'large')
      await setOnlineImageBackground(image, imageUrl)
      
      console.log('背景图片刷新成功:', image.id)
    } catch (error) {
      console.error('刷新背景图片失败:', error)
      // 可以在这里显示错误提示给用户
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
      // 根据设置中的打开方式决定target参数
      const target = settings.bookmarks.behavior.openIn === 'current' ? '_self' : '_blank'
      safeOpenUrl(url, target)
    }
  }, [networkMode, settings.bookmarks.behavior.openIn])

  // 处理书签保存
  const handleBookmarkSave = useCallback(async (bookmarkData: Omit<Bookmark, 'id' | 'createdAt' | 'updatedAt' | 'position'>) => {
    try {
      await addBookmark(bookmarkData)
    } catch (error) {
      console.error('添加书签失败:', error)
      throw error
    }
  }, [addBookmark])

  // 处理书签更新
  const handleBookmarkUpdate = useCallback(async (bookmarkId: string, updates: Partial<Omit<Bookmark, 'id' | 'createdAt' | 'updatedAt'>>) => {
    try {
      await updateBookmark(bookmarkId, updates)
    } catch (error) {
      console.error('更新书签失败:', error)
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

    // 如果是同一个目标，直接返回
    if (contextMenu.visible && contextMenu.target === target) {
      return
    }

    // 计算菜单位置
    const menuWidth = 150
    const menuHeight = 100
    const viewportWidth = window.innerWidth
    const viewportHeight = window.innerHeight

    let x = event.clientX
    let y = event.clientY

    // 边界检查
    if (x + menuWidth > viewportWidth) {
      x = viewportWidth - menuWidth - 10
    }
    if (y + menuHeight > viewportHeight) {
      y = viewportHeight - menuHeight - 10
    }
    if (x < 10) x = 10
    if (y < 10) y = 10

    // 如果当前有菜单显示且是不同目标，先关闭再显示新的
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
      // 直接显示菜单
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
      console.log('书签重排序成功')
    } catch (error) {
      console.error('书签重排序失败:', error)
    }
  }, [reorderBookmarks])


  // 分类选择处理 - 确保始终有分类被选中
  const handleCategorySelect = useCallback((categoryId: string | null) => {
    // 如果传入null或者选择的分类不存在，选择第一个分类
    if (!categoryId || !categories.find(cat => cat.id === categoryId)) {
      const firstCategory = categories.length > 0 ? categories[0] : null
      setSelectedCategoryId(firstCategory?.id || null)
    } else {
      setSelectedCategoryId(categoryId)
    }
  }, [categories])

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

  // 删除分类处理 - 只有一个分类时不可删除
  const handleDeleteCategory = useCallback(async (categoryId: string) => {
    // 只有一个分类时不可删除
    if (categories.length <= 1) {
      alert('至少需要保留一个分类')
      return
    }
    
    try {
      const result = await deleteCategory(categoryId)
      if (result.success) {
        console.log('分类删除成功')
        hideContextMenu()
        // 如果删除的是当前选中的分类，切换到第一个可用分类
        if (selectedCategoryId === categoryId) {
          const remainingCategory = categories.find(cat => cat.id !== categoryId)
          setSelectedCategoryId(remainingCategory?.id || null)
        }
      } else {
        console.error('分类删除失败:', result.error)
      }
    } catch (error) {
      console.error('分类删除失败:', error)
    }
  }, [deleteCategory, selectedCategoryId, hideContextMenu, categories])

  // 关闭分类弹窗
  const handleCloseCategoryModal = useCallback(() => {
    setCategoryModalOpen(false)
    setEditingCategory(undefined)
  }, [])

  // 保存分类
  const handleSaveCategory = useCallback(async (categoryData: Omit<BookmarkCategory, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const result = await addCategory(categoryData)
      if (result.success) {
        console.log('分类添加成功')
      } else {
        console.error('分类添加失败:', result.error)
      }
    } catch (error) {
      console.error('分类添加失败:', error)
    }
  }, [addCategory])

  // 更新分类
  const handleUpdateCategory = useCallback(async (id: string, updates: Partial<BookmarkCategory>) => {
    try {
      const result = await updateCategory(id, updates)
      if (result.success) {
        console.log('分类更新成功')
      } else {
        console.error('分类更新失败:', result.error)
      }
    } catch (error) {
      console.error('分类更新失败:', error)
    }
  }, [updateCategory])

  // 重排序分类
  const handleReorderCategories = useCallback(async (reorderedCategories: BookmarkCategory[]) => {
    try {
      const result = await reorderCategories(reorderedCategories)
      if (result.success) {
        console.log('分类重排序成功')
      } else {
        console.error('分类重排序失败:', result.error)
      }
    } catch (error) {
      console.error('分类重排序失败:', error)
    }
  }, [reorderCategories])

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
      // 检查是否点击在右键菜单内部
      const target = event.target as Element
      const menuElement = target.closest('[data-context-menu="true"]')
      
      // 检查是否点击在分类边栏内部
      const sidebarElement = target.closest('[data-category-sidebar="true"]')
      
      // 如果不是在菜单内部或边栏内部点击，则关闭菜单
      if (!menuElement && !sidebarElement) {
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
    <div 
      className="min-h-screen relative overflow-hidden transition-all duration-500" 
      style={backgroundStyles}
      onClick={handleGlobalClick}
    >
      {/* 渐变/图片背景层 - 由背景样式自动处理 */}
      
      {/* 主要内容区域 - 使用flex布局，右侧留出动态边栏空间 */}
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
              {/* 现代化搜索框 */}
              <SearchBox
                preferences={settings.preferences}
              />
            </div>
          </div>

          {/* 书签网格区域 */}
          <div className="flex-1 flex items-start justify-center pt-16 px-4 relative z-10">
            <div className="w-full max-w-5xl">
              <BookmarkGridV3
                bookmarks={bookmarks.filter(bookmark => 
                  !selectedCategoryId || bookmark.categoryId === selectedCategoryId
                )}
                networkMode={networkMode}
                bookmarkSettings={settings.bookmarks}
                onBookmarkClick={handleBookmarkClick}
                onBookmarkContextMenu={handleBookmarkContextMenu}
                onBookmarkReorder={handleBookmarksReorder}
                className="min-h-[200px]"
              />
              
              {/* 添加书签按钮 - 当没有书签时显示 */}
              {bookmarks.filter(bookmark => 
                !selectedCategoryId || bookmark.categoryId === selectedCategoryId
              ).length === 0 && !bookmarksLoading && (
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
          selectedCategoryId={selectedCategoryId}
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

      {/* 右下角固定按钮组 - 根据边栏设置动态调整位置 */}
      <div 
        className="fixed bottom-6 z-30 flex flex-col space-y-3 transition-all duration-300"
        style={{ 
          right: settings.bookmarks.categories.sidebarVisible === 'auto' 
            ? '24px' 
            : `${SIDEBAR_WIDTH + 24}px` 
        }}
      >
        {/* 刷新背景按钮 - 只在随机图片模式下显示 */}
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
        selectedCategoryId={selectedCategoryId}
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
        onDataUpdated={async (syncedData) => {
          console.log('接收到同步数据更新，正在重新加载应用状态...', {
            bookmarks: syncedData.bookmarks.length,
            categories: syncedData.categories.length,
          });
          
          // 同时重新加载书签和分类数据
          await Promise.all([
            reloadBookmarks(),
            reloadCategories()
          ]);
          
          // 重要：同步后重置选中的分类，因为categoryId可能已经改变
          if (syncedData.categories && syncedData.categories.length > 0) {
            console.log('重置选中分类为第一个分类:', syncedData.categories[0]);
            setSelectedCategoryId(syncedData.categories[0].id);
          } else {
            setSelectedCategoryId(null);
          }
          
          console.log('应用状态重新加载完成');
          // 注意：设置数据会通过useSettings自动更新，不需要手动处理
        }}
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
                handleDeleteCategory((contextMenu.target as BookmarkCategory).id)
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

export default NewTabApp
