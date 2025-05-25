import { useCallback, useState } from 'react';

export interface ImageUploadError {
  type: 'size' | 'format' | 'count' | 'processing';
  message: string;
}

export interface ImageUploadOptions {
  maxSize?: number; // 最大文件大小，单位：bytes，默认5MB
  maxCount?: number; // 最大图片数量，默认20
  allowedTypes?: string[]; // 允许的文件类型
  quality?: number; // 压缩质量，0-1，默认0.8
  maxWidth?: number; // 最大宽度，默认1920
  maxHeight?: number; // 最大高度，默认1080
}

const DEFAULT_OPTIONS: Required<ImageUploadOptions> = {
  maxSize: 5 * 1024 * 1024, // 5MB
  maxCount: 20,
  allowedTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
  quality: 0.8,
  maxWidth: 1920,
  maxHeight: 1080,
};

/**
 * 图片上传处理Hook
 * 提供图片文件处理、压缩、格式转换等功能
 */
export function useImageUpload(options: ImageUploadOptions = {}) {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // 验证文件
  const validateFile = useCallback((file: File, currentCount: number): ImageUploadError | null => {
    // 检查文件类型
    if (!opts.allowedTypes.includes(file.type)) {
      return {
        type: 'format',
        message: `不支持的文件格式: ${file.type}。支持的格式: ${opts.allowedTypes.join(', ')}`,
      };
    }

    // 检查文件大小
    if (file.size > opts.maxSize) {
      const maxSizeMB = (opts.maxSize / (1024 * 1024)).toFixed(1);
      return {
        type: 'size',
        message: `文件大小超出限制。最大允许: ${maxSizeMB}MB`,
      };
    }

    // 检查数量限制
    if (currentCount >= opts.maxCount) {
      return {
        type: 'count',
        message: `图片数量已达到上限: ${opts.maxCount}`,
      };
    }

    return null;
  }, [opts]);

  // 压缩图片
  const compressImage = useCallback(
    (file: File): Promise<{ data: string; size: number }> => {
      return new Promise((resolve, reject) => {
        const img = new Image();
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          reject(new Error('无法创建Canvas上下文'));
          return;
        }

        img.onload = () => {
          // 计算压缩后的尺寸
          let { width, height } = img;
          const maxWidth = opts.maxWidth;
          const maxHeight = opts.maxHeight;

          if (width > maxWidth || height > maxHeight) {
            const ratio = Math.min(maxWidth / width, maxHeight / height);
            width *= ratio;
            height *= ratio;
          }

          // 设置canvas尺寸
          canvas.width = width;
          canvas.height = height;

          // 绘制图片
          ctx.drawImage(img, 0, 0, width, height);

          // 转换为base64
          const compressedData = canvas.toDataURL('image/jpeg', opts.quality);
          
          // 计算压缩后大小（base64编码大约增加33%）
          const compressedSize = Math.ceil((compressedData.length * 3) / 4);

          resolve({
            data: compressedData,
            size: compressedSize,
          });
        };

        img.onerror = () => {
          reject(new Error('图片加载失败'));
        };

        // 读取文件
        const reader = new FileReader();
        reader.onload = (e) => {
          if (typeof e.target?.result === 'string') {
            img.src = e.target.result;
          }
        };
        reader.onerror = () => {
          reject(new Error('文件读取失败'));
        };
        reader.readAsDataURL(file);
      });
    },
    [opts.quality, opts.maxWidth, opts.maxHeight]
  );

  // 处理单个文件
  const processFile = useCallback(
    async (file: File, currentCount: number) => {
      // 验证文件
      const validationError = validateFile(file, currentCount);
      if (validationError) {
        throw validationError;
      }

      try {
        // 压缩图片
        const { data, size } = await compressImage(file);

        return {
          name: file.name,
          data,
          size,
          type: 'image/jpeg', // 统一转换为JPEG格式
          originalSize: file.size,
          originalType: file.type,
        };
      } catch (error) {
        throw {
          type: 'processing',
          message: `图片处理失败: ${error instanceof Error ? error.message : '未知错误'}`,
        } as ImageUploadError;
      }
    },
    [validateFile, compressImage]
  );

  // 处理多个文件
  const processFiles = useCallback(
    async (files: FileList | File[], currentCount: number = 0) => {
      const fileArray = Array.from(files);
      setIsProcessing(true);
      setUploadProgress(0);

      const results: Array<{
        success: boolean;
        file?: {
          name: string;
          data: string;
          size: number;
          type: string;
          originalSize: number;
          originalType: string;
        };
        error?: ImageUploadError;
        fileName: string;
      }> = [];

      try {
        for (let i = 0; i < fileArray.length; i++) {
          const file = fileArray[i];
          
          try {
            const processedFile = await processFile(file, currentCount + results.filter(r => r.success).length);
            results.push({
              success: true,
              file: processedFile,
              fileName: file.name,
            });
          } catch (error) {
            results.push({
              success: false,
              error: error as ImageUploadError,
              fileName: file.name,
            });
          }

          // 更新进度
          setUploadProgress(((i + 1) / fileArray.length) * 100);
        }

        return results;
      } finally {
        setIsProcessing(false);
        setUploadProgress(0);
      }
    },
    [processFile]
  );

  // 从拖拽事件中提取文件
  const getFilesFromDropEvent = useCallback((event: DragEvent): File[] => {
    const files: File[] = [];
    
    if (event.dataTransfer?.items) {
      // 使用DataTransferItemList
      for (let i = 0; i < event.dataTransfer.items.length; i++) {
        const item = event.dataTransfer.items[i];
        if (item.kind === 'file') {
          const file = item.getAsFile();
          if (file && opts.allowedTypes.includes(file.type)) {
            files.push(file);
          }
        }
      }
    } else if (event.dataTransfer?.files) {
      // 回退到DataTransfer.files
      for (let i = 0; i < event.dataTransfer.files.length; i++) {
        const file = event.dataTransfer.files[i];
        if (opts.allowedTypes.includes(file.type)) {
          files.push(file);
        }
      }
    }

    return files;
  }, [opts.allowedTypes]);

  // 格式化文件大小
  const formatFileSize = useCallback((bytes: number): string => {
    if (bytes === 0) return '0 B';
    
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  }, []);

  return {
    // 状态
    isProcessing,
    uploadProgress,
    
    // 配置
    options: opts,
    
    // 方法
    processFile,
    processFiles,
    validateFile,
    getFilesFromDropEvent,
    formatFileSize,
  };
}
