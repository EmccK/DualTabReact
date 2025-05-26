/**
 * 背景图片服务抽象接口
 * 为不同的图片API提供统一的接口
 */

import type {
  BackgroundImage,
  BackgroundImageMetadata,
  BackgroundImageFilters,
  BackgroundImageError,
  BackgroundImageSource
} from '@/types/background';

export abstract class BackgroundImageService {
  abstract readonly source: BackgroundImageSource;
  
  /**
   * 获取随机图片
   */
  abstract getRandomImage(filters?: BackgroundImageFilters): Promise<BackgroundImage>;
  
  /**
   * 获取多张随机图片
   */
  abstract getRandomImages(count: number, filters?: BackgroundImageFilters): Promise<BackgroundImage[]>;
  
  /**
   * 搜索图片
   */
  abstract searchImages(query: string, filters?: BackgroundImageFilters): Promise<BackgroundImage[]>;
  
  /**
   * 获取图片元数据
   */
  abstract getImageMetadata(imageId: string): Promise<BackgroundImageMetadata>;
  
  /**
   * 获取图片URL（不同质量）
   */
  abstract getImageUrl(image: BackgroundImage, quality?: 'original' | 'large' | 'medium' | 'small'): string;
  
  /**
   * 预加载图片
   */
  async preloadImage(imageUrl: string): Promise<boolean> {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve(true);
      img.onerror = () => resolve(false);
      img.src = imageUrl;
    });
  }
  
  /**
   * 验证图片是否适合作为背景
   */
  isValidBackgroundImage(image: BackgroundImage): boolean {
    return image.width >= 800 && image.height >= 600;
  }
  
  /**
   * 获取推荐的显示设置
   */
  getRecommendedSettings(image: BackgroundImage): {
    fillMode: 'cover' | 'contain';
    opacity: number;
    blur: number;
  } {
    const aspectRatio = image.width / image.height;
    
    return {
      fillMode: aspectRatio > 1.5 ? 'cover' : 'contain',
      opacity: 85,
      blur: 0
    };
  }
  
  /**
   * 转换为统一的BackgroundImage格式
   */
  protected abstract convertToBackgroundImage(rawData: any): BackgroundImage;
  
  /**
   * 处理API错误
   */
  protected createError(message: string, code: string = 'UNKNOWN_ERROR'): BackgroundImageError {
    return {
      code,
      message,
      source: this.source
    };
  }
}
