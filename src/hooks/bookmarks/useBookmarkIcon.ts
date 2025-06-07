/**
 * 书签图标处理Hook - 简化版本
 * 重定向到新的统一Hook，保持向后兼容
 */

import { useIconLoader } from '@/components/icon';
import { 
  generateTextIconConfig,
  generateUploadIconConfig,
  generateOfficialIconConfig,
  validateImageFile,
  fileToBase64,
  compressImage
} from '@/utils/icon-processing.utils';
import type { Bookmark, NetworkMode } from '@/types';
import type { IconType } from '@/types/bookmark-icon.types';

interface UseBookmarkIconProps {
  bookmark: Bookmark;
  networkMode: NetworkMode;
  size?: number;
  borderRadius?: number;
}

interface UseBookmarkIconReturn {
  // 状态
  iconType: IconType;
  isLoading: boolean;
  hasError: boolean;
  
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
  // 使用新的统一Hook
  const { isLoading, hasError, clearError } = useIconLoader({
    bookmark,
    networkMode,
    size,
    enabled: true,
  });

  // 获取图标类型
  const iconType: IconType = bookmark.iconType || 'official';

  // 生成配置（兼容旧接口）
  const textConfig = generateTextIconConfig(bookmark, size, borderRadius);
  const uploadConfig = generateUploadIconConfig(bookmark, borderRadius);
  const officialConfig = generateOfficialIconConfig(bookmark, networkMode, size, borderRadius);

  // 兼容旧的方法接口
  const handleLoad = () => {
    clearError();
  };

  const handleError = (error: Error) => {
  };

  const updateIconType = () => {
    // 这里应该更新书签数据，但由于这是Hook，我们只记录
  };

  const uploadImage = async (file: File) => {
    try {
      const validation = validateImageFile(file);
      if (!validation.valid) {
        throw new Error(validation.error);
      }

      const imageData = await fileToBase64(file);
      await compressImage(imageData);
    } catch (error) {
      throw error;
    }
  };

  const updateTextConfig = () => {
  };

  const resetIcon = () => {
  };

  return {
    iconType,
    isLoading,
    hasError,
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
