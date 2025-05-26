/**
 * 图片归属信息类型定义
 * 支持多种图片来源的统一归属信息管理
 */

/**
 * 基础归属信息接口
 */
export interface BaseAttribution {
  /** 图片ID */
  id: string;
  /** 作者/摄影师姓名 */
  authorName: string;
  /** 作者个人主页链接 */
  authorUrl?: string;
  /** 图片原始链接 */
  originalUrl?: string;
  /** 版权说明文本 */
  copyrightText?: string;
  /** 图片来源平台 */
  source: 'local' | 'upload' | 'other';
}

/**
 * 本地图片归属信息
 */
export interface LocalAttribution extends BaseAttribution {
  source: 'local' | 'upload';
  /** 文件名 */
  fileName?: string;
  /** 上传时间 */
  uploadDate?: string;
  /** 文件大小 */
  fileSize?: number;
}

/**
 * 归属信息联合类型
 */
export type Attribution = LocalAttribution;

/**
 * 归属信息显示配置
 */
export interface AttributionDisplayConfig {
  /** 是否显示归属信息 */
  show: boolean;
  /** 显示位置 */
  position: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  /** 显示样式 */
  style: 'compact' | 'full' | 'minimal';
  /** 是否自动隐藏 */
  autoHide: boolean;
  /** 自动隐藏延迟时间（毫秒） */
  autoHideDelay: number;
  /** 透明度 */
  opacity: number;
}

/**
 * 归属信息状态
 */
export interface AttributionState {
  /** 当前显示的归属信息 */
  current: Attribution | null;
  /** 是否正在显示 */
  isVisible: boolean;
  /** 是否正在加载 */
  isLoading: boolean;
  /** 错误信息 */
  error: string | null;
}
