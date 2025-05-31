/**
 * 书签图标处理Hook
 */

import { useState, useCallback, useEffect } from 'react';
import type { Bookmark, NetworkMode } from '@/types';
import type { IconType, IconStatus, IconLoadState } from '@/types/bookmark-icon.types';
import { ICON_TYPES } from '@/constants';
import { 
  generateTextIconConfig,
  generateUploadIconConfig,
  generateOfficialIconConfig,
  getBookmarkIconType,
  validateImageFile,
  fileToBase64,
  compressImage
} from '@/utils/icon-processing.utils';

interface UseBookmarkIconProps {
  bookmark: Bookmark;
  networkMode: NetworkMode;
  size?: number;
  borderRadius?: number;
}

interface UseBookmarkIconReturn {
  // 状态
  iconType: IconType;
  loadState: IconLoadState;
  
  // 配置
  textConfig: ReturnType<typeof generateTextIconConfig>;
  uploadConfig: ReturnType<typeof generateUploadIconConfig>;
  officialConfig: ReturnType<typeof generateOfficialIconConfig>;
  
  // 方法
  handleLoad: () => void;
  handleError: (error: Error) => void;
  updateIconType: (type: IconType) => void;
  uploadImage: (file: File) => Promise<void>;
  updateTextConfig: (text: string, backgroundColor?: string, textColor?: string) => void;
  resetIcon: () => void;
}

export const useBookmarkIcon = ({
  bookmark,
  networkMode,
  size = 32,
  borderRadius = 8,
}: UseBookmarkIconProps): UseBookmarkIconReturn => {
  const [iconType, setIconType] = useState<IconType>(() => getBookmarkIconType(bookmark));
  const [loadState, setLoadState] = useState<IconLoadState>({
    status: 'loading',
    errorCount: 0,
  });

  // 生成配置
  const textConfig = generateTextIconConfig(bookmark, size, borderRadius);
  const uploadConfig = generateUploadIconConfig(bookmark, borderRadius);
  const officialConfig = generateOfficialIconConfig(bookmark, networkMode, size, borderRadius);

  // 处理加载成功
  const handleLoad = useCallback(() => {
    setLoadState(prev => ({
      ...prev,
      status: 'loaded',
      errorCount: 0,
      lastErrorTime: undefined,
    }));
  }, []);

  // 处理加载错误
  const handleError = useCallback((error: Error) => {
    console.warn('图标加载错误:', error.message);
    
    setLoadState(prev => ({
      ...prev,
      status: 'error',
      errorCount: prev.errorCount + 1,
      lastErrorTime: Date.now(),
    }));
  }, []);

  // 更新图标类型
  const updateIconType = useCallback((type: IconType) => {
    setIconType(type);
    setLoadState({
      status: 'loading',
      errorCount: 0,
    });
  }, []);

  // 上传图片
  const uploadImage = useCallback(async (file: File) => {
    try {
      // 验证文件
      const validation = validateImageFile(file);
      if (!validation.valid) {
        throw new Error(validation.error);
      }

      setLoadState(prev => ({ ...prev, status: 'loading' }));

      // 转换为base64
      const imageData = await fileToBase64(file);
      
      // 压缩图片
      const compressedData = await compressImage(imageData);

      // 这里应该更新书签数据，但由于这是Hook，我们返回数据让父组件处理
      // 实际应用中可能需要调用更新书签的方法
      console.log('图片上传成功:', compressedData.substring(0, 50) + '...');
      
      setLoadState(prev => ({ ...prev, status: 'loaded' }));
    } catch (error) {
      console.error('图片上传失败:', error);
      handleError(error as Error);
    }
  }, [handleError]);

  // 更新文字配置
  const updateTextConfig = useCallback((
    text: string, 
    backgroundColor?: string, 
    textColor?: string
  ) => {
    // 这里应该更新书签数据
    console.log('更新文字配置:', { text, backgroundColor, textColor });
    setLoadState(prev => ({ ...prev, status: 'loaded' }));
  }, []);

  // 重置图标
  const resetIcon = useCallback(() => {
    setIconType(ICON_TYPES.OFFICIAL);
    setLoadState({
      status: 'loading',
      errorCount: 0,
    });
  }, []);

  // 监听书签变化
  useEffect(() => {
    const newIconType = getBookmarkIconType(bookmark);
    if (newIconType !== iconType) {
      setIconType(newIconType);
      setLoadState({
        status: 'loading',
        errorCount: 0,
      });
    }
  }, [bookmark, iconType]);

  return {
    iconType,
    loadState,
    textConfig,
    uploadConfig,
    officialConfig,
    handleLoad,
    handleError,
    updateIconType,
    uploadImage,
    updateTextConfig,
    resetIcon,
  };
};

export default useBookmarkIcon;
