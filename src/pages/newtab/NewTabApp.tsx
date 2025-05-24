import React, { useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { BookmarkGrid, BookmarkModal } from '@/components/bookmarks'
import { NetworkSwitch } from '@/components/network'
import { CategorySidebar, CategoryModal } from '@/components/categories'
import { useClock, useBookmarks, useNetworkMode, useCategories } from '@/hooks'
import { Plus, RefreshCw, Settings, Cloud, Droplets, TestTube } from 'lucide-react'
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
  
  // 分类筛选状态
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null)
  
  // 分类弹窗状态
  const [categoryModalOpen, setCategoryModalOpen] = useState(false)
  const [categoryModalMode, setCategoryModalMode] = useState<'add' | 'edit'>('add')
  const [editingCategory, setEditingCategory] = useState<BookmarkCategory | undefined>()
  
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
  }, [])  // 书签弹窗处理函数
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

  // 处理书签右键菜单
  const handleBookmarkContextMenu = useCallback((bookmark: Bookmark, event: React.MouseEvent) => {
    event.preventDefault()
    handleEditBookmark(bookmark)
  }, [handleEditBookmark])

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

  // 分类选择处理
  const handleCategorySelect = useCallback((categoryId: string | null) => {
    setSelectedCategoryId(categoryId)
  }, [])

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
  const handleDeleteCategory = useCallback(async (categoryId: string) => {
    try {
      const result = await deleteCategory(categoryId)
      if (result.success) {
        console.log('分类删除成功')
        // 如果删除的是当前选中的分类，切换到全部
        if (selectedCategoryId === categoryId) {
          setSelectedCategoryId(null)
        }
      } else {
        console.error('分类删除失败:', result.error)
      }
    } catch (error) {
      console.error('分类删除失败:', error)
    }
  }, [deleteCategory, selectedCategoryId])

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 relative overflow-hidden">
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
            </Button>            {/* WebDAV同步 */}
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
          </div>            {/* 书签网格区域 */}
            <div className="w-full max-w-5xl">
              <BookmarkGrid
                bookmarks={bookmarks}
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
        <div className="w-80 p-6">
          <CategorySidebar
            categories={categories}
            selectedCategoryId={selectedCategoryId}
            onCategorySelect={handleCategorySelect}
            onAddCategory={handleAddCategory}
            onEditCategory={handleEditCategory}
            onDeleteCategory={handleDeleteCategory}
            onReorderCategories={handleReorderCategories}
            isGlassEffect={isGlassEffect}
            loading={categoriesLoading}
          />
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

      {/* 书签弹窗 */}
      <BookmarkModal
        isOpen={bookmarkModalOpen}
        onClose={handleCloseBookmarkModal}
        mode={bookmarkModalMode}
        bookmark={editingBookmark}
        networkMode={networkMode}
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
    </div>
  )
}

export default NewTabApp