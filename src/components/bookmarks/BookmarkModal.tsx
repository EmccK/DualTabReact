import React, { useState, useCallback, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { IconSelector } from './IconSelector'
import ColorPicker from './settings/ColorPicker'
import type { Bookmark, IconType, NetworkMode } from '@/types'
import { useBookmarks, useCategories } from '@/hooks'
import { themeClasses } from '@/styles/theme'
import { Bookmark as BookmarkIcon, Edit, Globe, Wifi } from 'lucide-react'

interface BookmarkModalProps {
  isOpen: boolean
  onClose: () => void
  mode: 'add' | 'edit'
  bookmark?: Bookmark
  networkMode: NetworkMode
  selectedCategoryId?: string | null
  onSuccess?: () => void
}

export function BookmarkModal({
  isOpen,
  onClose,
  mode,
  bookmark,
  networkMode,
  selectedCategoryId,
  onSuccess
}: BookmarkModalProps) {
  // 表单状态
  const [formData, setFormData] = useState({
    name: '',
    externalUrl: '',
    internalUrl: '',
    description: '',
    iconType: 'official' as IconType,
    iconText: '',
    iconData: '',
    backgroundColor: 'transparent',
    categoryId: '' as string
  })

  const [activeTab, setActiveTab] = useState<'external' | 'internal'>('external')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const { addBookmark, updateBookmark } = useBookmarks()
  const { categories } = useCategories()

  // 获取当前活动的URL（根据当前选择的标签页）
  const getActiveUrl = useCallback(() => {
    if (activeTab === 'external') {
      return formData.externalUrl || ''
    } else {
      return formData.internalUrl || ''
    }
  }, [activeTab, formData.externalUrl, formData.internalUrl])

  // 初始化表单数据
  useEffect(() => {
    if (mode === 'edit' && bookmark) {
      setFormData({
        name: bookmark.name || '',
        externalUrl: bookmark.externalUrl || '',
        internalUrl: bookmark.internalUrl || '',
        description: bookmark.description || '',
        iconType: bookmark.iconType || 'official',
        iconText: bookmark.iconText || '',
        iconData: bookmark.iconData || '',
        backgroundColor: bookmark.backgroundColor || 'transparent',
        categoryId: bookmark.categoryId || ''
      })
    } else {
      // 重置表单，新书签默认分配到当前选中的分类
      setFormData({
        name: '',
        externalUrl: '',
        internalUrl: '',
        description: '',
        iconType: 'official',
        iconText: '',
        iconData: '',
        backgroundColor: 'transparent',
        categoryId: selectedCategoryId || ''
      })
    }
  }, [mode, bookmark, isOpen, selectedCategoryId])  // 表单字段更新处理
  const handleInputChange = useCallback((field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }, [])

  const handleIconTypeChange = useCallback((iconType: IconType) => {
    setFormData(prev => ({ ...prev, iconType }))
  }, [])

  const handleIconTextChange = useCallback((iconText: string) => {
    setFormData(prev => ({ ...prev, iconText }))
  }, [])

  const handleIconUpload = useCallback((iconData: string) => {
    setFormData(prev => ({ ...prev, iconData }))
  }, [])

  const handleColorChange = useCallback((backgroundColor: string) => {
    setFormData(prev => ({ ...prev, backgroundColor }))
  }, [])

  const handleCategoryChange = useCallback((categoryId: string) => {
    setFormData(prev => ({ ...prev, categoryId }))
  }, [])

  // 表单验证
  const validateForm = useCallback(() => {
    if (!formData.name.trim()) {
      alert('请输入书签名称')
      return false
    }

    if (!formData.externalUrl.trim() && !formData.internalUrl.trim()) {
      alert('请至少输入一个网址')
      return false
    }

    return true
  }, [formData])

  // 提交处理
  const handleSubmit = useCallback(async () => {
    if (!validateForm()) return

    setIsSubmitting(true)
    try {
      const bookmarkData: Partial<Bookmark> = {
        name: formData.name.trim(),
        title: formData.name.trim(), // 保持title与name同步
        url: formData.externalUrl.trim() || formData.internalUrl.trim(),
        externalUrl: formData.externalUrl.trim() || undefined,
        internalUrl: formData.internalUrl.trim() || undefined,
        description: formData.description.trim() || undefined,
        iconType: formData.iconType,
        iconText: formData.iconType === 'text' ? formData.iconText.trim() : undefined,
        iconData: formData.iconType === 'upload' ? formData.iconData : undefined,
        backgroundColor: formData.backgroundColor !== 'transparent' ? formData.backgroundColor : undefined,
        categoryId: formData.categoryId || undefined,
      }

      if (mode === 'add') {
        await addBookmark(bookmarkData as Omit<Bookmark, 'id' | 'position'>)
      } else if (mode === 'edit' && bookmark) {
        await updateBookmark(bookmark.id, bookmarkData)
      }

      onClose()
      onSuccess?.()
    } catch (error) {
      console.error('保存书签失败:', error)
      alert('保存书签失败，请重试')
    } finally {
      setIsSubmitting(false)
    }
  }, [formData, validateForm, mode, bookmark, addBookmark, updateBookmark, onClose, onSuccess])

  const handleCancel = useCallback(() => {
    onClose()
  }, [onClose])

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className={`max-w-2xl max-h-[85vh] overflow-y-auto ${themeClasses.modal.container}`}>
        <DialogHeader className={themeClasses.modal.header}>
          <DialogTitle className="flex items-center space-x-3 text-lg font-semibold text-gray-800 pb-3">
            {mode === 'add' ? (
              <>
                <div className="w-7 h-7 rounded-lg bg-[#4F46E5] flex items-center justify-center">
                  <BookmarkIcon className="w-4 h-4 text-white" />
                </div>
                <span>添加书签</span>
              </>
            ) : (
              <>
                <div className="w-7 h-7 rounded-lg bg-[#4F46E5] flex items-center justify-center">
                  <Edit className="w-4 h-4 text-white" />
                </div>
                <span>编辑书签</span>
              </>
            )}
          </DialogTitle>
          <DialogDescription className="text-sm text-gray-600">
            {mode === 'add' 
              ? '创建一个新的书签，可以设置内外网地址、图标和分类。' 
              : '修改书签的信息，包括地址、图标和分类设置。'
            }
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* 基本信息区域 - 并排布局 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* 书签名称 */}
            <div className="space-y-1">
              <Label htmlFor="bookmark-name" className="text-sm font-medium text-gray-700 flex items-center space-x-1">
                <span>名称</span>
                <span className="text-[#4F46E5]">*</span>
              </Label>
              <Input
                id="bookmark-name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="网站名称"
                className={themeClasses.input.base}
              />
            </div>

            {/* 描述 */}
            <div className="space-y-1">
              <Label htmlFor="description" className="text-sm font-medium text-gray-700">描述</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="简短描述（选填）"
                className={themeClasses.input.base}
              />
            </div>
          </div>

          {/* 网址标签页 - 紧凑布局 */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700">网站地址</Label>
            <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'external' | 'internal')} className="w-full">
              <TabsList className={`${themeClasses.tabs.container} h-9`}>
                <TabsTrigger 
                  value="external" 
                  className={`${themeClasses.tabs.trigger} flex items-center space-x-2 text-xs px-3`}
                >
                  <Globe className="w-3 h-3" />
                  <span>外网</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="internal"
                  className={`${themeClasses.tabs.trigger} flex items-center space-x-2 text-xs px-3`}
                >
                  <Wifi className="w-3 h-3" />
                  <span>内网</span>
                </TabsTrigger>
              </TabsList>              
              
              <TabsContent value="external" className="mt-2" tabIndex={-1}>
                <Input
                  type="url"
                  value={formData.externalUrl}
                  onChange={(e) => handleInputChange('externalUrl', e.target.value)}
                  placeholder="https://example.com"
                  className={themeClasses.input.base}
                  tabIndex={activeTab === 'external' ? 0 : -1}
                />
              </TabsContent>
              
              <TabsContent value="internal" className="mt-2" tabIndex={-1}>
                <Input
                  type="url"
                  value={formData.internalUrl}
                  onChange={(e) => handleInputChange('internalUrl', e.target.value)}
                  placeholder="http://192.168.1.100"
                  className={themeClasses.input.base}
                  tabIndex={activeTab === 'internal' ? 0 : -1}
                />
              </TabsContent>
            </Tabs>
          </div>

          {/* 自定义设置区域 - 水平布局 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* 图标选择器 */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">图标</Label>
              <IconSelector
                iconType={formData.iconType}
                iconText={formData.iconText}
                iconData={formData.iconData}
                backgroundColor={formData.backgroundColor}
                url={getActiveUrl()}
                onIconTypeChange={handleIconTypeChange}
                onIconTextChange={handleIconTextChange}
                onIconUpload={handleIconUpload}
              />
            </div>

            {/* 颜色和分类 */}
            <div className="space-y-3">
              {/* 颜色选择器 */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">背景颜色</Label>
                <ColorPicker
                  value={formData.backgroundColor}
                  onChange={handleColorChange}
                  type="background"
                />
              </div>

              {/* 分类选择器 */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">分类</Label>
                <select
                  value={formData.categoryId}
                  onChange={(e) => handleCategoryChange(e.target.value)}
                  className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4F46E5] focus:border-transparent transition-colors text-sm`}
                >
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.icon} {category.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className={`${themeClasses.modal.footer} pt-3`}>
          <div className="flex space-x-3 w-full">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={isSubmitting}
              className={themeClasses.button.secondary}
            >
              取消
            </Button>
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className={themeClasses.button.primary}
            >
              {isSubmitting ? (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>保存中...</span>
                </div>
              ) : (
                mode === 'add' ? '添加书签' : '保存更改'
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}