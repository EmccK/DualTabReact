import type { Attribution, UnsplashAttribution } from '@/types/attribution';

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
    case 'unsplash':
      const unsplashAttr = attribution as UnsplashAttribution;
      return `Photo by ${unsplashAttr.authorName} on Unsplash`;
    
    case 'local':
    case 'upload':
      return attribution.copyrightText || '本地图片';
    
    default:
      return attribution.copyrightText || '';
  }
}

/**
 * 生成带UTM参数的Unsplash链接
 * @param attribution - Unsplash归属信息
 * @param linkType - 链接类型
 * @returns 带UTM参数的完整URL
 */
export function generateUnsplashUrl(
  attribution: UnsplashAttribution,
  linkType: 'profile' | 'photo' | 'download' = 'profile'
): string {
  if (attribution.source !== 'unsplash') return '';
  
  const utmParams = new URLSearchParams({
    utm_source: attribution.utmSource || 'dualtab',
    utm_medium: attribution.utmMedium || 'referral',
    utm_campaign: attribution.utmCampaign || 'api-credit'
  });
  
  let baseUrl = '';
  switch (linkType) {
    case 'profile':
      baseUrl = attribution.userProfileUrl;
      break;
    case 'photo':
      baseUrl = attribution.imageUrl;
      break;
    case 'download':
      baseUrl = attribution.downloadUrl;
      break;
  }
  
  if (!baseUrl) return '';
  
  // 如果URL已经包含查询参数，使用&连接，否则使用?
  const separator = baseUrl.includes('?') ? '&' : '?';
  return `${baseUrl}${separator}${utmParams.toString()}`;
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
  
  // Unsplash图片的额外检查
  if (attribution.source === 'unsplash') {
    const unsplashAttr = attribution as UnsplashAttribution;
    return !!(unsplashAttr.username && unsplashAttr.userProfileUrl);
  }
  
  return true;
}

/**
 * 创建Unsplash归属信息对象
 * @param unsplashData - Unsplash API返回的图片数据
 * @returns UnsplashAttribution对象
 */
export function createUnsplashAttribution(unsplashData: any): UnsplashAttribution {
  const user = unsplashData.user || {};
  
  return {
    id: unsplashData.id,
    source: 'unsplash',
    authorName: user.name || user.username || '未知作者',
    username: user.username || '',
    userProfileUrl: user.links?.html || '',
    downloadUrl: unsplashData.links?.download || '',
    imageUrl: unsplashData.links?.html || '',
    originalUrl: unsplashData.urls?.regular || unsplashData.urls?.full || '',
    copyrightText: `Photo by ${user.name || user.username} on Unsplash`,
    utmSource: 'dualtab',
    utmMedium: 'referral',
    utmCampaign: 'api-credit'
  };
}

/**
 * 创建简化的归属信息显示文本
 * @param attribution - 归属信息对象
 * @returns 简化的显示文本
 */
export function createCompactAttributionText(attribution: Attribution): string {
  if (!attribution) return '';
  
  switch (attribution.source) {
    case 'unsplash':
      return `by ${attribution.authorName}`;
    case 'local':
    case 'upload':
      return '本地图片';
    default:
      return attribution.authorName || '';
  }
}
