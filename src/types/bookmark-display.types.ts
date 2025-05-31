/**
 * 书签显示相关类型定义
 */

// 书签显示样式类型
export type BookmarkDisplayStyle = 'detailed' | 'compact';

// 书签卡片尺寸配置
export interface BookmarkCardSize {
  width: number;
  height: number;
  iconSize: number;
  padding: number;
  spacing: number;
}

// 书签显示配置
export interface BookmarkDisplayConfig {
  style: BookmarkDisplayStyle;
  showTitle: boolean;
  showDescription: boolean;
  showIcon: boolean;
  iconPosition: 'top' | 'left' | 'center';
  textAlignment: 'left' | 'center' | 'right';
  borderRadius: number; // 0-20px
  cardSize: BookmarkCardSize;
}

// 书签卡片状态
export interface BookmarkCardState {
  isHovered: boolean;
  isClicked: boolean;
  isDragging: boolean;
  isDragOver: boolean;
  isLoading: boolean;
  hasError: boolean;
}

// 书签卡片样式计算结果
export interface BookmarkCardStyles {
  container: React.CSSProperties;
  icon: React.CSSProperties;
  title: React.CSSProperties;
  description: React.CSSProperties;
  background: React.CSSProperties;
}

// 响应式断点
export interface ResponsiveBreakpoints {
  sm: number;  // 640px
  md: number;  // 768px
  lg: number;  // 1024px
  xl: number;  // 1280px
  xxl: number; // 1536px
}

// 网格布局配置
export interface BookmarkGridConfig {
  columns: number | 'auto';
  gap: number;
  containerWidth: number;
  containerHeight: number;
  itemsPerRow: number;
}
