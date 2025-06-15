/**
 * 新版书签样式类型定义
 */

import type { IconType } from './index';

// 书签样式类型
export type BookmarkStyleType = 'card' | 'icon';

// 书签设置
export interface BookmarkStyleSettings {
  styleType: BookmarkStyleType;  // 样式类型：卡片式或图标式
  borderRadius: number;          // 圆角大小 (0-20px)
  hoverScale: number;            // 悬停缩放比例 (1.0-1.2)
}

// 图片缩放配置
export interface ImageScaleConfig {
  scale: number;                 // 缩放比例 (0.1-3.0)
  offsetX: number;               // X轴偏移 (-100 到 100)
  offsetY: number;               // Y轴偏移 (-100 到 100)
  rotation?: number;             // 旋转角度 (0-360)
  backgroundColor?: string;      // 背景颜色
  backgroundOpacity?: number;    // 背景透明度 (0-100)
}

// 书签项目接口
export interface BookmarkItem {
  id: string;                    // 唯一标识符
  title: string;
  url: string;
  description?: string;          // 书签描述信息
  iconType: IconType;            // 使用统一的IconType
  iconText?: string;             // 文字图标内容（不限字符数）
  iconImage?: string;            // 图片图标URL
  iconData?: string;             // 上传图片的base64数据
  iconColor?: string;            // 图标背景色
  imageScale?: ImageScaleConfig; // 图片缩放配置
  originalIconImage?: string;    // 原始图片数据（用于重新编辑）
}

// 书签卡片属性
export interface BookmarkCardProps {
  bookmark: BookmarkItem;
  settings: BookmarkStyleSettings;
  showDescriptions?: boolean;
  onClick?: (bookmark: BookmarkItem) => void;
  onContextMenu?: (bookmark: BookmarkItem, event: React.MouseEvent) => void;
  className?: string;
}
