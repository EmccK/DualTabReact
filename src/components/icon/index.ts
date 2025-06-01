/**
 * 图标组件统一入口
 * 导出所有图标相关的组件和Hook
 */

// 主要组件
export { default as BookmarkIcon } from './BookmarkIcon';
export { default as IconSelector } from './IconSelector';

// Hook
export { default as useIconLoader } from '../../hooks/useIconLoader';

// 重新导出类型定义
export type { IconType } from '../../types/bookmark-icon.types';

// 工具函数 (重新导出常用的)
export {
  extractDomain,
  isInternalDomain,
  getBookmarkIconUrl,
  generateDefaultIconColor,
} from '../../utils/icon-utils';

export {
  validateImageFile,
  fileToBase64,
  compressImage,
} from '../../utils/icon-processing.utils';

// 常量 (重新导出常用的)
export {
  ICON_TYPES,
  ICON_TYPE_LABELS,
  PRESET_BACKGROUND_COLORS,
} from '../../constants/icon.constants';
