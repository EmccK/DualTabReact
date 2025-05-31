/**
 * 书签图标相关类型定义
 */

// 图标类型
export type IconType = 'official' | 'text' | 'upload';

// 图标状态
export type IconStatus = 'loading' | 'loaded' | 'error' | 'fallback';

// 文字图标配置
export interface TextIconConfig {
  text: string;
  fontSize: number;
  fontWeight: 'normal' | 'medium' | 'bold';
  textColor: string;
  backgroundColor: string;
  borderRadius: number;
  borderWidth: number;
  borderColor: string;
}

// 上传图标配置
export interface UploadIconConfig {
  imageData: string; // base64
  backgroundColor?: string;
  borderRadius: number;
  borderWidth: number;
  borderColor: string;
  objectFit: 'cover' | 'contain' | 'fill' | 'scale-down';
}

// 官方图标配置
export interface OfficialIconConfig {
  url: string;
  fallbackUrls: string[];
  currentFallbackIndex: number;
  borderRadius: number;
  borderWidth: number;
  borderColor: string;
  backgroundColor?: string; // 加载失败时的背景色
}

// 图标尺寸配置
export interface IconSize {
  width: number;
  height: number;
  minSize: number;
  maxSize: number;
}

// 图标背景样式
export interface IconBackground {
  color?: string;
  gradient?: {
    type: 'linear' | 'radial';
    colors: string[];
    direction?: number; // 角度 0-360
  };
  opacity: number; // 0-1
}

// 图标边框样式
export interface IconBorder {
  width: number; // 0-5px
  color: string;
  style: 'solid' | 'dashed' | 'dotted';
  radius: number; // 0-20px
}

// 图标阴影样式
export interface IconShadow {
  enabled: boolean;
  color: string;
  blur: number; // 0-20px
  offsetX: number; // -10 to 10px
  offsetY: number; // -10 to 10px
  opacity: number; // 0-1
}

// 完整图标样式配置
export interface IconStyleConfig {
  size: IconSize;
  background: IconBackground;
  border: IconBorder;
  shadow: IconShadow;
}

// 图标组件通用Props
export interface BaseIconProps {
  size: number;
  borderRadius: number;
  className?: string;
  style?: React.CSSProperties;
  onLoad?: () => void;
  onError?: (error: Error) => void;
}

// 图标加载状态
export interface IconLoadState {
  status: IconStatus;
  errorCount: number;
  lastErrorTime?: number;
  retryAfter?: number;
}
