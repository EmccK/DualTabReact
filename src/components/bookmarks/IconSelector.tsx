import React, { useState, useCallback, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Upload, Type, Globe, Image } from 'lucide-react'
import { cn } from '@/lib/utils'
import { themeClasses } from '@/styles/theme'
import { getFaviconUrl } from '@/utils/icon-utils'
import type { IconType } from '@/types'

interface IconSelectorProps {
  iconType: IconType
  iconText?: string
  iconData?: string
  backgroundColor?: string
  url?: string  // 添加URL参数用于获取favicon
  onIconTypeChange: (type: IconType) => void
  onIconTextChange: (text: string) => void
  onIconUpload: (data: string) => void
  className?: string
}

export function IconSelector({
  iconType,
  iconText = '',
  iconData,
  backgroundColor = 'transparent',
  url = '',
  onIconTypeChange,
  onIconTextChange,
  onIconUpload,
  className
}: IconSelectorProps) {
  const [uploadFileName, setUploadFileName] = useState<string>('')
  const [faviconError, setFaviconError] = useState<boolean>(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleIconTypeSelect = useCallback((type: IconType) => {
    onIconTypeChange(type)
  }, [onIconTypeChange])

  const handleIconTextChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    onIconTextChange(e.target.value)
  }, [onIconTextChange])

  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      alert('请选择图片文件')
      return
    }

    if (file.size > 2 * 1024 * 1024) {
      alert('图片文件大小不能超过2MB')
      return
    }

    setUploadFileName(file.name)

    const reader = new FileReader()
    reader.onload = (event) => {
      const result = event.target?.result as string
      if (result) {
        onIconUpload(result)
      }
    }
    reader.readAsDataURL(file)
  }, [onIconUpload])

  const handleUploadClick = useCallback(() => {
    fileInputRef.current?.click()
  }, [])

  // 当URL改变时重置favicon错误状态
  useEffect(() => {
    setFaviconError(false)
  }, [url])

  // 渲染图标预览
  const renderIconPreview = () => {
    const previewStyle = {
      backgroundColor: backgroundColor === 'transparent' ? '#f8fafc' : backgroundColor,
      color: backgroundColor === 'transparent' ? '#475569' : '#ffffff'
    }

    switch (iconType) {
      case 'official':
        // 如果有URL，显示实际的favicon，否则显示默认图标
        if (url && !faviconError) {
          const faviconUrl = getFaviconUrl(url, 64); // 使用64px获取更清晰的图标
          return (
            <div className="w-16 h-16 rounded-xl overflow-hidden border shadow-lg bg-white flex items-center justify-center">
              <img 
                src={faviconUrl} 
                alt="网站图标" 
                className="w-12 h-12 object-contain"
                onError={() => setFaviconError(true)}
                onLoad={() => setFaviconError(false)}
              />
            </div>
          );
        } else {
          return (
            <div 
              className={cn("w-16 h-16 rounded-xl flex items-center justify-center", themeClasses.iconSelector.preview)}
              style={previewStyle}
            >
              <Globe className="w-8 h-8 text-gray-400" />
            </div>
          );
        }
      case 'text':
        return (
          <div 
            className="w-16 h-16 rounded-xl flex items-center justify-center font-bold text-2xl shadow-lg border border-white/20"
            style={previewStyle}
          >
            {iconText ? iconText.charAt(0).toUpperCase() : 'A'}
          </div>
        )
      case 'upload':
        return iconData ? (
          <div className="w-16 h-16 rounded-xl overflow-hidden border shadow-lg">
            <img 
              src={iconData} 
              alt="上传的图标" 
              className="w-full h-full object-cover"
            />
          </div>
        ) : (
          <div 
            className={cn("w-16 h-16 rounded-xl flex items-center justify-center", themeClasses.iconSelector.preview)}
            style={previewStyle}
          >
            <Image className="w-8 h-8 text-gray-400" />
          </div>
        )
      default:
        return null
    }
  }

  return (
    <div className={cn("space-y-3", className)}>
      {/* 图标类型选择 - 紧凑的水平布局 */}
      <div className="flex space-x-2">
        <Button
          type="button"
          variant={iconType === 'official' ? 'default' : 'outline'}
          onClick={() => handleIconTypeSelect('official')}
          className={cn(
            "h-12 flex-col space-y-1 flex-1",
            iconType === 'official' 
              ? themeClasses.iconSelector.button.active
              : themeClasses.iconSelector.button.inactive
          )}
        >
          <Globe className="w-4 h-4" />
          <span className="text-xs">官方</span>
        </Button>

        <Button
          type="button"
          variant={iconType === 'text' ? 'default' : 'outline'}
          onClick={() => handleIconTypeSelect('text')}
          className={cn(
            "h-12 flex-col space-y-1 flex-1",
            iconType === 'text' 
              ? themeClasses.iconSelector.button.active
              : themeClasses.iconSelector.button.inactive
          )}
        >
          <Type className="w-4 h-4" />
          <span className="text-xs">文字</span>
        </Button>

        <Button
          type="button"
          variant={iconType === 'upload' ? 'default' : 'outline'}
          onClick={() => handleIconTypeSelect('upload')}
          className={cn(
            "h-12 flex-col space-y-1 flex-1",
            iconType === 'upload' 
              ? themeClasses.iconSelector.button.active
              : themeClasses.iconSelector.button.inactive
          )}
        >
          <Upload className="w-4 h-4" />
          <span className="text-xs">上传</span>
        </Button>
      </div>

      {/* 图标预览和设置 - 水平布局 */}
      <div className="flex items-center space-x-3">
        <div className="flex-shrink-0">
          {renderIconPreview()}
        </div>
        
        <div className="flex-1 min-w-0">
          {iconType === 'text' && (
            <Input
              value={iconText}
              onChange={handleIconTextChange}
              placeholder="输入1-2个字符"
              maxLength={2}
              className={`${themeClasses.input.base} h-9`}
            />
          )}

          {iconType === 'upload' && (
            <div className="space-y-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
              <Button
                type="button"
                variant="outline"
                onClick={handleUploadClick}
                className={cn(themeClasses.button.secondary, "w-full h-9 text-xs")}
              >
                <Upload className="w-3 h-3 mr-1" />
                选择图片
              </Button>
              {uploadFileName && (
                <p className="text-xs text-gray-600 truncate">
                  {uploadFileName}
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}