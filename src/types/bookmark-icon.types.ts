/**
 * 书签图标相关类型定义
 * 统一所有图标相关的类型接口
 */

import type { ImageScaleConfig } from './bookmark-style.types';

// 图标类型 - 统一定义
export type IconType = 'official' | 'text' | 'upload';

// 图标状态
export type IconStatus = 'loading' | 'loaded' | 'error' | 'fallback';

// 图标加载状态
export interface IconLoadState {
  status: IconStatus;
  errorCount: number;
  lastErrorTime?: number;
}

// 基础图标属性
export interface BaseIconProps {
  size: number;
  borderRadius: number;
  className?: string;
  style?: React.CSSProperties;
  onLoad?: () => void;
  onError?: (error: Error) => void;
}

// 图标背景配置
export interface IconBackground {
  color?: string;
  opacity?: number;
  gradient?: {
    type: 'linear' | 'radial';
    colors: string[];
    direction?: number; // 角度，仅用于线性渐变
  };
}

// 图标边框配置
export interface IconBorder {
  width: number;
  color: string;
  style: 'solid' | 'dashed' | 'dotted';
  radius: number;
}

// 文字图标配置
export interface TextIconConfig {
  text: string;
  fontSize?: number;
  fontWeight?: string;
  textColor: string;
  backgroundColor: string;
  borderRadius: number;
  borderWidth: number;
  borderColor: string;
}

// 上传图标配置
export interface UploadIconConfig {
  imageData: string;
  backgroundColor?: string;
  borderRadius: number;
  borderWidth: number;
  borderColor: string;
  objectFit?: 'cover' | 'contain' | 'fill' | 'scale-down';
}

// 官方图标配置
export interface OfficialIconConfig {
  url: string;
  fallbackUrls: string[];
  currentFallbackIndex: number;
  borderRadius: number;
  borderWidth: number;
  borderColor: string;
  backgroundColor?: string;
}

// 图标配置联合类型
export type IconConfig = TextIconConfig | UploadIconConfig | OfficialIconConfig;

// 图标组件通用属性
export interface IconComponentProps extends BaseIconProps {
  iconType: IconType;
  config: IconConfig;
  fallbackText?: string;
}

// 图标选择器相关类型
export interface IconSelectorData {
  iconType: IconType;
  iconText?: string;
  iconData?: string;
  iconColor?: string;
  imageScale?: ImageScaleConfig;
}

// 图标预加载配置
export interface IconPreloadConfig {
  urls: string[];
  size: number;
  priority: 'high' | 'medium' | 'low';
}

// 图标缓存条目
export interface IconCacheEntry {
  url: string;
  timestamp: number;
  size: number;
  domain: string;
  quality: 'high' | 'medium' | 'low';
}

// 图标缓存统计
export interface IconCacheStats {
  totalEntries: number;
  totalSize: number;
  hitRate: number;
  oldestEntry: number;
  newestEntry: number;
}

// 图标质量检测结果
export interface IconQualityResult {
  score: number; // 0-100
  width: number;
  height: number;
  format: string;
  hasTransparency: boolean;
  isValid: boolean;
  recommendation: 'high' | 'medium' | 'low' | 'reject';
}

// 图标服务配置
export interface IconServiceConfig {
  name: string;
  url: string;
  priority: number;
  timeout: number;
  supportsSizes: boolean;
  maxSize: number;
}

// 图标错误类型
export interface IconError {
  type: 'network' | 'format' | 'size' | 'timeout' | 'unknown';
  message: string;
  url?: string;
  timestamp: number;
}

// 导出所有类型的命名空间
export namespace IconTypes {
  export type Type = IconType;
  export type Status = IconStatus;
  export type LoadState = IconLoadState;
  export type Background = IconBackground;
  export type Border = IconBorder;
  export type TextConfig = TextIconConfig;
  export type UploadConfig = UploadIconConfig;
  export type OfficialConfig = OfficialIconConfig;
  export type Config = IconConfig;
  export type ComponentProps = IconComponentProps;
  export type SelectorData = IconSelectorData;
  export type PreloadConfig = IconPreloadConfig;
  export type CacheEntry = IconCacheEntry;
  export type CacheStats = IconCacheStats;
  export type QualityResult = IconQualityResult;
  export type ServiceConfig = IconServiceConfig;
  export type Error = IconError;
}
