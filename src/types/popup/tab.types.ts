/**
 * Popup 标签页相关类型定义
 */

// 当前标签页信息
export interface CurrentTabInfo {
  id?: number;
  url?: string;
  title?: string;
  favIconUrl?: string;
  active: boolean;
  windowId: number;
}

// 标签页检测结果
export interface TabDetectionResult {
  success: boolean;
  data?: CurrentTabInfo;
  error?: string;
}

// 快速书签表单数据
export interface QuickBookmarkFormData {
  name: string;
  url: string;
  description?: string;
  categoryId: string;
  useCurrentTabInfo: boolean;
}

// 表单验证结果
export interface FormValidationResult {
  isValid: boolean;
  errors: {
    name?: string;
    url?: string;
    categoryId?: string;
  };
}
