import type { Attribution } from '@/types/attribution';

/**
 * 归属信息格式化工具函数
 */

/**
 * 格式化作者名称显示
 * @param attribution - 归属信息对象
 * @returns 格式化后的作者名称
 */
export function formatAuthorName(attribution: Attribution): string {
  if (!attribution) return '';
  
  return attribution.authorName || '未知作者';
}

/**
 * 格式化版权说明文本
 * @param attribution - 归属信息对象
 * @returns 格式化后的版权说明
 */
export function formatCopyrightText(attribution: Attribution): string {
  if (!attribution) return '';
  
  switch (attribution.source) {
    case 'local':
    case 'upload':
      return attribution.copyrightText || '本地图片';
    
    default:
      return attribution.copyrightText || '';
  }
}


/**
 * 检查归属信息是否完整
 * @param attribution - 归属信息对象
 * @returns 是否包含必要的归属信息
 */
export function isAttributionComplete(attribution: Attribution | null): boolean {
  if (!attribution) return false;
  
  // 基础检查：必须有作者名称
  if (!attribution.authorName) return false;
  
  return true;
}

/**
 * 创建简化的归属信息显示文本
 * @param attribution - 归属信息对象
 * @returns 简化的显示文本
 */
export function createCompactAttributionText(attribution: Attribution): string {
  if (!attribution) return '';
  
  switch (attribution.source) {
    case 'local':
    case 'upload':
      return '本地图片';
    default:
      return attribution.authorName || '';
  }
}
