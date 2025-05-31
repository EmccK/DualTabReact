/**
 * 新版书签样式类型定义
 */

// 书签样式类型
export type BookmarkStyleType = 'card' | 'icon';

// 书签设置
export interface BookmarkStyleSettings {
  styleType: BookmarkStyleType;  // 样式类型：卡片式或图标式
  borderRadius: number;          // 圆角大小 (0-20px)
}

// 书签项目接口
export interface BookmarkItem {
  id: string;
  title: string;
  url: string;
  iconType: 'text' | 'image' | 'favicon';
  iconText?: string;             // 文字图标内容（不限字符数）
  iconImage?: string;            // 图片图标URL
  iconColor?: string;            // 图标背景色
}

// 书签卡片属性
export interface BookmarkCardProps {
  bookmark: BookmarkItem;
  settings: BookmarkStyleSettings;
  onClick?: (bookmark: BookmarkItem) => void;
  onContextMenu?: (bookmark: BookmarkItem, event: React.MouseEvent) => void;
  className?: string;
}
