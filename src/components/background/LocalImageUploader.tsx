import React, { useCallback, useState, useRef, DragEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { 
  Upload, 
  X, 
  Image as ImageIcon, 
  FileImage, 
  AlertCircle,
  Trash2,
  Eye
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useImageUpload, type ImageUploadError } from '@/hooks/useImageUpload';
import type { LocalBackgroundImage } from '@/types/settings';

interface LocalImageUploaderProps {
  images: LocalBackgroundImage[];
  currentImageId?: string;
  onImageAdd: (imageData: {
    name: string;
    data: string;
    size: number;
    type: string;
  }) => Promise<string>;
  onImageRemove: (imageId: string) => Promise<void>;
  onImageSelect: (imageId: string) => Promise<void>;
  maxImages?: number;
  className?: string;
}

/**
 * 本地图片上传器组件
 * 支持拖拽上传、批量处理、预览和管理
 */
export function LocalImageUploader({
  images,
  currentImageId,
  onImageAdd,
  onImageRemove,
  onImageSelect,
  maxImages = 20,
  className,
}: LocalImageUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);
  const [errors, setErrors] = useState<Array<{ fileName: string; error: ImageUploadError }>>([]);

  const {
    isProcessing,
    uploadProgress,
    processFiles,
    getFilesFromDropEvent,
    formatFileSize,
  } = useImageUpload({
    maxCount: maxImages,
    maxSize: 5 * 1024 * 1024, // 5MB
    quality: 0.8,
    maxWidth: 1920,
    maxHeight: 1080,
  });

  // 处理文件选择
  const handleFileSelect = useCallback(
    async (files: FileList | File[]) => {
      setErrors([]);
      
      try {
        const results = await processFiles(files, images.length);
        const newErrors: Array<{ fileName: string; error: ImageUploadError }> = [];

        // 处理成功的文件
        for (const result of results) {
          if (result.success && result.file) {
            try {
              await onImageAdd(result.file);
            } catch (error) {
              newErrors.push({
                fileName: result.fileName,
                error: {
                  type: 'processing',
                  message: '保存失败',
                },
              });
            }
          } else if (result.error) {
            newErrors.push({
              fileName: result.fileName,
              error: result.error,
            });
          }
        }

        if (newErrors.length > 0) {
          setErrors(newErrors);
        }
      } catch (error) {
        console.error('File processing error:', error);
      }
    },
    [images.length, processFiles, onImageAdd]
  );

  // 处理文件输入变化
  const handleInputChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const files = event.target.files;
      if (files && files.length > 0) {
        handleFileSelect(files);
      }
      // 清空input值，允许重复选择同一文件
      event.target.value = '';
    },
    [handleFileSelect]
  );

  // 处理拖拽事件
  const handleDrag = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDragIn = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  }, []);

  const handleDragOut = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  }, []);

  const handleDrop = useCallback(
    (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);

      const files = getFilesFromDropEvent(e.nativeEvent);
      if (files.length > 0) {
        handleFileSelect(files);
      }
    },
    [getFilesFromDropEvent, handleFileSelect]
  );

  // 打开文件选择器
  const openFileSelector = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  // 处理图片删除
  const handleImageRemove = useCallback(
    async (imageId: string) => {
      try {
        await onImageRemove(imageId);
      } catch (error) {
        console.error('Failed to remove image:', error);
      }
    },
    [onImageRemove]
  );

  // 处理图片选择
  const handleImageSelect = useCallback(
    async (imageId: string) => {
      try {
        await onImageSelect(imageId);
      } catch (error) {
        console.error('Failed to select image:', error);
      }
    },
    [onImageSelect]
  );

  // 清除错误
  const clearErrors = useCallback(() => {
    setErrors([]);
  }, []);

  // 计算总大小
  const totalSize = images.reduce((sum, img) => sum + img.size, 0);
  const canUpload = images.length < maxImages;

  return (
    <div className={cn('space-y-4', className)}>
      {/* 上传区域 */}
      <div className="space-y-2">
        <Label className="text-sm font-medium text-gray-700">
          本地图片 ({images.length}/{maxImages})
        </Label>
        
        {canUpload && (
          <div
            className={cn(
              'relative border-2 border-dashed rounded-lg p-6 transition-all duration-200',
              dragActive
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-300 hover:border-gray-400',
              isProcessing && 'pointer-events-none opacity-60'
            )}
            onDragEnter={handleDragIn}
            onDragLeave={handleDragOut}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <div className="text-center space-y-3">
              <div className="flex justify-center">
                <Upload className="w-8 h-8 text-gray-400" />
              </div>
              
              <div className="space-y-1">
                <p className="text-sm font-medium text-gray-700">
                  拖拽图片到此处，或
                  <Button
                    type="button"
                    variant="link"
                    className="px-1 h-auto text-blue-600 hover:text-blue-700"
                    onClick={openFileSelector}
                    disabled={isProcessing}
                  >
                    点击选择
                  </Button>
                </p>
                <p className="text-xs text-gray-500">
                  支持 JPEG、PNG、WebP、GIF 格式，最大 5MB
                </p>
              </div>
              
              {isProcessing && (
                <div className="space-y-2">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-600">
                    处理中... {Math.round(uploadProgress)}%
                  </p>
                </div>
              )}
            </div>
            
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              multiple
              onChange={handleInputChange}
              className="hidden"
              disabled={isProcessing}
            />
          </div>
        )}
        
        {!canUpload && (
          <div className="text-center py-4 px-6 bg-gray-50 border border-gray-200 rounded-lg">
            <p className="text-sm text-gray-600">
              已达到图片数量上限 ({maxImages} 张)
            </p>
          </div>
        )}
      </div>

      {/* 错误信息 */}
      {errors.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium text-red-600 flex items-center gap-1">
              <AlertCircle className="w-4 h-4" />
              上传错误
            </Label>
            <Button
              variant="ghost"
              size="sm"
              onClick={clearErrors}
              className="h-6 px-2 text-xs"
            >
              清除
            </Button>
          </div>
          <div className="space-y-1">
            {errors.map((error, index) => (
              <p key={index} className="text-xs text-red-600 bg-red-50 px-2 py-1 rounded">
                <span className="font-medium">{error.fileName}:</span> {error.error.message}
              </p>
            ))}
          </div>
        </div>
      )}

      {/* 图片列表 */}
      {images.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium text-gray-700">
              已上传的图片
            </Label>
            <p className="text-xs text-gray-500">
              总大小: {formatFileSize(totalSize)}
            </p>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            {images.map((image) => (
              <div
                key={image.id}
                className={cn(
                  'relative group bg-white border-2 rounded-lg overflow-hidden transition-all duration-200',
                  currentImageId === image.id
                    ? 'border-blue-500 ring-2 ring-blue-500/20'
                    : 'border-gray-200 hover:border-gray-300'
                )}
              >
                {/* 图片预览 */}
                <div className="aspect-video relative overflow-hidden">
                  <img
                    src={image.data}
                    alt={image.name}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                  
                  {/* 选中标识 */}
                  {currentImageId === image.id && (
                    <div className="absolute top-2 left-2">
                      <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                        <Eye className="w-4 h-4 text-white" />
                      </div>
                    </div>
                  )}
                  
                  {/* 操作按钮 */}
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="destructive"
                      size="sm"
                      className="w-6 h-6 p-0"
                      onClick={() => handleImageRemove(image.id)}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
                
                {/* 图片信息 */}
                <div 
                  className="p-2 cursor-pointer hover:bg-gray-50"
                  onClick={() => handleImageSelect(image.id)}
                >
                  <p className="text-xs font-medium text-gray-700 truncate" title={image.name}>
                    {image.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {formatFileSize(image.size)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {images.length === 0 && !canUpload && (
        <div className="text-center py-8 text-gray-500">
          <ImageIcon className="w-12 h-12 mx-auto mb-2 opacity-30" />
          <p className="text-sm">暂无本地图片</p>
        </div>
      )}
    </div>
  );
}
