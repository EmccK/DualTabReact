/**
 * 书签设置相关类型定义
 */

import type { BookmarkDisplayStyle } from './bookmark-display.types';
import type { IconType, IconStyleConfig } from './bookmark-icon.types';

// 显示样式设置
export interface DisplayStyleSettings {
  currentStyle: BookmarkDisplayStyle;
  availableStyles: BookmarkDisplayStyle[];
  customStyleEnabled: boolean;
}

// 图标样式设置
export interface IconStyleSettings {
  defaultIconType: IconType;
  iconStyle: IconStyleConfig;
  fallbackEnabled: boolean;
  cacheEnabled: boolean;
  maxCacheSize: number; // MB
  cacheExpiry: number; // hours
}

// 布局设置
export interface LayoutSettings {
  cardSpacing: number; // 4-24px
  cardPadding: number; // 8-32px
  borderRadius: number; // 0-20px
  aspectRatio: string; // '1/1', '4/3', '16/9', 'auto'
  minCardWidth: number; // 80-300px
  maxCardWidth: number; // 120-400px
}

// 动画设置
export interface AnimationSettings {
  enabled: boolean;
  hoverScale: number; // 1.0-1.3
  clickScale: number; // 0.8-1.0
  transitionDuration: number; // 100-500ms
  easing: 'ease' | 'ease-in' | 'ease-out' | 'ease-in-out' | 'linear';
}

// 交互设置
export interface InteractionSettings {
  openInNewTab: boolean;
  rightClickEnabled: boolean;
  dragAndDropEnabled: boolean;
  keyboardNavigationEnabled: boolean;
  tooltipEnabled: boolean;
  tooltipDelay: number; // ms
}

// 可访问性设置
export interface AccessibilitySettings {
  highContrastMode: boolean;
  reducedMotion: boolean;
  screenReaderEnabled: boolean;
  focusIndicatorEnabled: boolean;
  altTextEnabled: boolean;
}

// 性能设置
export interface PerformanceSettings {
  lazyLoadingEnabled: boolean;
  imageOptimizationEnabled: boolean;
  virtualScrollingEnabled: boolean;
  maxVisibleItems: number;
  debounceDelay: number; // ms
}

// 书签外观设置（整合）
export interface BookmarkAppearanceSettings {
  display: DisplayStyleSettings;
  icon: IconStyleSettings;
  layout: LayoutSettings;
  animation: AnimationSettings;
  interaction: InteractionSettings;
  accessibility: AccessibilitySettings;
  performance: PerformanceSettings;
}

// 设置项元数据
export interface SettingItem<T = any> {
  key: string;
  label: string;
  description?: string;
  type: 'boolean' | 'number' | 'string' | 'select' | 'color' | 'slider' | 'custom';
  defaultValue: T;
  min?: number;
  max?: number;
  step?: number;
  options?: Array<{ label: string; value: T }>;
  validation?: (value: T) => boolean | string;
  disabled?: boolean;
  group?: string;
}

// 设置分组
export interface SettingGroup {
  id: string;
  label: string;
  description?: string;
  icon?: React.ReactNode;
  order: number;
  items: SettingItem[];
}

// 设置面板配置
export interface SettingsPanelConfig {
  groups: SettingGroup[];
  searchEnabled: boolean;
  resetEnabled: boolean;
  exportEnabled: boolean;
  importEnabled: boolean;
}
