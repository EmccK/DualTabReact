import React, { useState, useCallback, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { BookmarkGrid, BookmarkModal } from '@/components/bookmarks'
import { NetworkSwitch } from '@/components/network'
import { CategorySidebar, CategoryModal } from '@/components/categories'
import { useClock, useBookmarks, useNetworkMode, useCategories } from '@/hooks'
import { Plus, RefreshCw, Settings, Cloud, Droplets, TestTube, Edit, Trash2 } from 'lucide-react'
import type { Bookmark, NetworkMode, BookmarkCategory } from '@/types'
import { createTestBookmarks } from '@/utils/test-data'
import { safeOpenUrl } from '@/utils/url-utils'
import './newtab.css'

function NewTabApp() {
  const currentTime = useClock()
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

  // 开发测试：创建测试书签数据
  const handleCreateTestBookmarks = useCallback(async () => {
    try {
      await createTestBookmarks()
      reloadBookmarks() // 重新加载书签数据
      console.log('测试书签数据创建成功')
    } catch (error) {
      console.error('创建测试书签数据失败:', error)
    }
  }, [reloadBookmarks])

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
      
      // 如果不是在菜单内部点击，则关闭菜单
      if (!menuElement) {
        hideContextMenu()
      }
    }
  }, [contextMenu.visible, hideContextMenu])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 relative overflow-hidden" onClick={handleGlobalClick}>
      {/* 背景图片容器 */}
      {backgroundImage && (
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-opacity duration-500"
          style={{ backgroundImage: `url(${backgroundImage})` }}
        />
      )}
      
      {/* 主要内容区域 - 使用flex布局 */}
      <div className="relative z-10 flex h-screen">
        {/* 左侧主内容区域 */}
        <div className="flex-1 flex flex-col">
        
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
              {/* 开发测试按钮 */}
              <Button
                onClick={handleCreateTestBookmarks}
                size="sm"
                variant="ghost"
                className={`${isGlassEffect ? 'bg-white/10 backdrop-blur-md' : 'bg-black/20'} text-white hover:bg-white/20 border border-white/20`}
                title="创建测试书签数据"
              >
                <TestTube className="h-4 w-4" />
              </Button>

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
              <NetworkSwitch
                networkMode={networkMode}
                onNetworkModeChange={handleNetworkModeChange}
                isGlassEffect={isGlassEffect}
              />
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
            <div className="w-full max-w-5xl">
              <BookmarkGrid
                bookmarks={bookmarks}
                categories={categories}
                networkMode={networkMode}
                isGlassEffect={isGlassEffect}
                loading={bookmarksLoading}
                error={bookmarksError}
                selectedCategoryId={selectedCategoryId}
                onBookmarkClick={handleBookmarkClick}
                onBookmarkContextMenu={handleBookmarkContextMenu}
                onAddBookmarkClick={handleAddBookmark}
                onBookmarksReorder={handleBookmarksReorder}
              />
            </div>
          </div>
        </div>

        {/* 右侧分类边栏 */}
        <div className="w-80">
          <CategorySidebar
            categories={categories}
            selectedCategoryId={selectedCategoryId}
            onCategorySelect={handleCategorySelect}
            onAddCategory={handleAddCategory}
            onEditCategory={handleEditCategory}
            onDeleteCategory={handleDeleteCategory}
            onReorderCategories={handleReorderCategories}
            onCategoryContextMenu={handleCategoryContextMenu}
            isGlassEffect={isGlassEffect}
            loading={categoriesLoading}
          />
        </div>
      </div>

      {/* 右下角固定按钮组 - 调整位置避开分类边栏 */}
      <div className="fixed bottom-6 right-80 mr-6 flex flex-col space-y-3">
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

      {/* 书签弹窗 */}
      <BookmarkModal
        isOpen={bookmarkModalOpen}
        onClose={handleCloseBookmarkModal}
        mode={bookmarkModalMode}
        bookmark={editingBookmark}
        networkMode={networkMode}
        selectedCategoryId={selectedCategoryId}
        onSuccess={reloadBookmarks}
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
