import React, { useState, useCallback, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ImageScaler } from '@/components/ui/ImageScaler'
import { Upload, Type, Globe, Image, Settings } from 'lucide-react'
import { cn } from '@/lib/utils'
import { themeClasses } from '@/styles/theme'
import { getFaviconUrl } from '@/utils/icon-utils'
import { compressAndScaleImage } from '@/utils/icon-processing.utils'
import type { IconType } from '@/types'
import type { ImageScaleConfig } from '@/types/bookmark-style.types'

interface IconSelectorProps {
  iconType: IconType
  iconText?: string
  iconData?: string
  backgroundColor?: string
  url?: string  // 添加URL参数用于获取favicon
  imageScale?: ImageScaleConfig // 图片缩放配置
  onIconTypeChange: (type: IconType) => void
  onIconTextChange: (text: string) => void
  onIconUpload: (data: string) => void
  onImageScaleChange?: (config: ImageScaleConfig) => void
  onImageUrlChange?: (url: string) => void // 添加URL变化回调
  className?: string
}

export function IconSelector({
  iconType,
  iconText = '',
  iconData,
  backgroundColor = 'transparent',
  url = '',
  imageScale,
  onIconTypeChange,
  onIconTextChange,
  onIconUpload,
  onImageScaleChange,
  onImageUrlChange,
  className
}: IconSelectorProps) {
  const [uploadFileName, setUploadFileName] = useState<string>('')
  const [faviconError, setFaviconError] = useState<boolean>(false)
  const [showImageScaler, setShowImageScaler] = useState<boolean>(false)
  const [originalImageData, setOriginalImageData] = useState<string>('')
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
        setOriginalImageData(result)
        setShowImageScaler(true)
        // 初始化默认缩放配置
        const defaultConfig: ImageScaleConfig = {
          scale: 1,
          offsetX: 0,
          offsetY: 0,
          rotation: 0,
          backgroundColor: '#ffffff',
          backgroundOpacity: 0
        }
        onImageScaleChange?.(defaultConfig)
      }
    }
    reader.readAsDataURL(file)
  }, [onImageScaleChange])

  const handleUploadClick = useCallback(() => {
    fileInputRef.current?.click()
  }, [])

  // 处理图片缩放配置变化
  const handleImageScaleChange = useCallback((config: ImageScaleConfig) => {
    onImageScaleChange?.(config)

    // 应用缩放配置生成最终图片
    const sourceImage = originalImageData || iconData
    if (sourceImage) {
      compressAndScaleImage(sourceImage, config, 64, 64, 0.9)
        .then(scaledData => {
          onIconUpload(scaledData)
        })
        .catch(error => {
          console.error('图片缩放失败:', error)
          alert('图片缩放失败，请重试')
        })
    }
  }, [originalImageData, iconData, onIconUpload, onImageScaleChange])

  // 处理URL图片的缩放
  const handleUrlImageScale = useCallback((url: string) => {
    if (!url) return

    // 设置原始图片数据为URL
    setOriginalImageData(url)
    setShowImageScaler(true)

    // 初始化默认缩放配置
    const defaultConfig: ImageScaleConfig = {
      scale: 1,
      offsetX: 0,
      offsetY: 0,
      rotation: 0,
      backgroundColor: '#ffffff',
      backgroundOpacity: 0
    }
    onImageScaleChange?.(defaultConfig)
  }, [onImageScaleChange])

  // 完成图片编辑
  const handleImageEditComplete = useCallback(() => {
    setShowImageScaler(false)
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
              <div className="flex space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleUploadClick}
                  className={cn(themeClasses.button.secondary, "flex-1 h-9 text-xs")}
                >
                  <Upload className="w-3 h-3 mr-1" />
                  选择图片
                </Button>
                {iconData && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowImageScaler(true)}
                    className={cn(themeClasses.button.secondary, "h-9 text-xs")}
                  >
                    <Settings className="w-3 h-3" />
                  </Button>
                )}
              </div>
              {uploadFileName && (
                <p className="text-xs text-gray-600 truncate">
                  {uploadFileName}
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 图片缩放器 */}
      {showImageScaler && originalImageData && imageScale && (
        <div className="mt-4">
          <ImageScaler
            imageUrl={originalImageData}
            config={imageScale}
            onConfigChange={handleImageScaleChange}
            size={64}
            className="w-full"
          />
          <div className="flex justify-end mt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleImageEditComplete}
              className="text-xs"
            >
              完成编辑
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}