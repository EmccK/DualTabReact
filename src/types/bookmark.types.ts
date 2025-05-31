/**
 * 新的书签显示类型模块导出
 * 扩展原有类型系统
 */

export * from './bookmark-display.types';
export * from './bookmark-icon.types';  
export * from './bookmark-settings.types';

// 重新导出原有类型以保持兼容性
export type { Bookmark, BookmarkCategory, NetworkMode } from './index';
