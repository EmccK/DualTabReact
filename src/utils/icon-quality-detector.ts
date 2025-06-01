/**
 * 图标质量检测工具 - 简化版本
 * 提供基本的图标质量评估功能
 */

interface QualityResult {
  score: number; // 0-100
  width: number;
  height: number;
  isValid: boolean;
  recommendation: 'good' | 'acceptable' | 'poor';
}

/**
 * 检测图标质量
 */
export const detectIconQuality = (img: HTMLImageElement): QualityResult => {
  const { width, height } = img;
  
  // 基本有效性检查
  const isValid = width > 1 && height > 1;
  
  if (!isValid) {
    return {
      score: 0,
      width,
      height,
      isValid: false,
      recommendation: 'poor',
    };
  }

  // 简化的质量评分
  let score = 50; // 基础分

  // 尺寸评分
  if (width >= 32 && height >= 32) {
    score += 30;
  } else if (width >= 16 && height >= 16) {
    score += 20;
  } else {
    score += 10;
  }

  // 比例评分
  const aspectRatio = width / height;
  if (aspectRatio >= 0.8 && aspectRatio <= 1.2) {
    score += 20; // 接近正方形
  } else {
    score += 10;
  }

  // 限制分数范围
  score = Math.min(100, Math.max(0, score));

  // 推荐等级
  let recommendation: 'good' | 'acceptable' | 'poor';
  if (score >= 80) {
    recommendation = 'good';
  } else if (score >= 60) {
    recommendation = 'acceptable';
  } else {
    recommendation = 'poor';
  }

  return {
    score,
    width,
    height,
    isValid,
    recommendation,
  };
};

/**
 * 异步检测图标URL的质量
 */
export const detectUrlIconQuality = (url: string): Promise<QualityResult> => {
  return new Promise((resolve) => {
    const img = new Image();
    
    img.onload = () => {
      const result = detectIconQuality(img);
      resolve(result);
    };
    
    img.onerror = () => {
      resolve({
        score: 0,
        width: 0,
        height: 0,
        isValid: false,
        recommendation: 'poor',
      });
    };
    
    // 设置超时
    setTimeout(() => {
      resolve({
        score: 0,
        width: 0,
        height: 0,
        isValid: false,
        recommendation: 'poor',
      });
    }, 5000);
    
    img.src = url;
  });
};

/**
 * 批量检测多个图标URL的质量
 */
export const batchDetectIconQuality = async (urls: string[]): Promise<QualityResult[]> => {
  const promises = urls.map(url => detectUrlIconQuality(url));
  return Promise.all(promises);
};

export default {
  detectIconQuality,
  detectUrlIconQuality,
  batchDetectIconQuality,
};
