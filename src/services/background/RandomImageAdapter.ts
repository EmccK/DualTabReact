/**
 * 随机图片服务适配器
 * 将RandomImageService适配到BackgroundImageService接口
 */

import { BackgroundImageService } from './BackgroundImageService';
import { randomImageService } from '@/services/randomImage';
import type {
  BackgroundImage,
  BackgroundImageMetadata,
  BackgroundImageFilters,
  BackgroundImageSource
} from '@/types/background';
import type {
  RandomImageWallpaper,
  RandomImageCategoryId,
  RandomImageThemeId
} from '@/types/randomImage';
import { RANDOM_IMAGE_CATEGORIES, RANDOM_IMAGE_THEMES } from '@/types/randomImage';

export class RandomImageAdapter extends BackgroundImageService {
  readonly source: BackgroundImageSource = 'random';

  /**
   * 获取随机图片
   */
  async getRandomImage(filters?: BackgroundImageFilters): Promise<BackgroundImage> {
    const categoryId = this.mapCategoryToId(filters?.category);
    const themeId = this.mapThemeToId(filters?.theme);
    
    const wallpaper = await randomImageService.getRandomWallpaper({
      categoryId,
      themeId
    });
    
    return this.convertToBackgroundImage(wallpaper);
  }

  /**
   * 获取多张随机图片
   */
  async getRandomImages(count: number, filters?: BackgroundImageFilters): Promise<BackgroundImage[]> {
    const categoryId = this.mapCategoryToId(filters?.category);
    const themeId = this.mapThemeToId(filters?.theme);
    
    const wallpapers = await randomImageService.getRandomWallpapers({
      count,
      categoryId,
      themeId
    });
    
    return wallpapers.map(wallpaper => this.convertToBackgroundImage(wallpaper));
  }

  /**
   * 搜索图片（随机图片API不支持搜索，返回随机结果）
   */
  async searchImages(query: string, filters?: BackgroundImageFilters): Promise<BackgroundImage[]> {
    // 随机图片API不支持搜索，基于query猜测分类
    const categoryId = this.guessCategory(query) || this.mapCategoryToId(filters?.category);
    const themeId = this.mapThemeToId(filters?.theme);
    
    const wallpapers = await randomImageService.getRandomWallpapers({
      count: filters?.perPage || 10,
      categoryId,
      themeId
    });
    
    return wallpapers.map(wallpaper => this.convertToBackgroundImage(wallpaper));
  }

  /**
   * 获取图片元数据
   */
  async getImageMetadata(imageId: string): Promise<BackgroundImageMetadata> {
    // 随机图片API不支持通过ID获取特定图片
    // 这里返回一个模拟的元数据
    throw this.createError('Random image API does not support getting image by ID', 'NOT_SUPPORTED');
  }

  /**
   * 获取图片URL
   */
  getImageUrl(image: BackgroundImage, quality: 'original' | 'large' | 'medium' | 'small' = 'original'): string {
    // 随机图片API提供的URL结构
    const metadata = image as any;
    
    switch (quality) {
      case 'small':
        return metadata.overviewUrl || image.url;
      case 'medium':
        return metadata.overviewUrl || image.url;
      case 'large':
        return image.url;
      case 'original':
      default:
        return image.url;
    }
  }

  /**
   * 转换RandomImageWallpaper到BackgroundImage
   */
  protected convertToBackgroundImage(wallpaper: RandomImageWallpaper): BackgroundImage {
    const imageInfo = randomImageService.getImageInfo(wallpaper);
    
    return {
      id: wallpaper.udId.toString(),
      url: wallpaper.url,
      width: wallpaper.width,
      height: wallpaper.height,
      description: wallpaper.keyword || undefined,
      keywords: imageInfo.keywords,
      category: imageInfo.category,
      theme: imageInfo.theme,
      source: 'random',
      createdAt: wallpaper.createdAt * 1000, // 转换为毫秒
      updatedAt: wallpaper.updatedAt * 1000,
      // 保存原始数据以便后续使用
      ...{
        overviewUrl: wallpaper.overviewUrl,
        blurUrl: wallpaper.blurUrl,
        mimeType: wallpaper.mimeType,
        colorId: wallpaper.colorId,
        cateId: wallpaper.cateId
      }
    } as BackgroundImage;
  }

  /**
   * 映射分类名称到ID
   */
  private mapCategoryToId(categoryName?: string): RandomImageCategoryId {
    if (!categoryName) return 'all';
    
    const category = RANDOM_IMAGE_CATEGORIES.find(
      cat => cat.name === categoryName || cat.id === categoryName
    );
    
    return category?.id || 'all';
  }

  /**
   * 映射主题名称到ID
   */
  private mapThemeToId(themeName?: string): RandomImageThemeId {
    if (!themeName) return 'all';
    
    const theme = RANDOM_IMAGE_THEMES.find(
      t => t.name === themeName || t.id === themeName
    );
    
    return theme?.id || 'all';
  }

  /**
   * 根据搜索关键词猜测分类
   */
  private guessCategory(query: string): RandomImageCategoryId | null {
    const lowerQuery = query.toLowerCase();
    
    // 简单的关键词匹配
    if (lowerQuery.includes('nature') || lowerQuery.includes('自然') || lowerQuery.includes('landscape')) {
      return 'nature';
    }
    if (lowerQuery.includes('anime') || lowerQuery.includes('动漫') || lowerQuery.includes('cartoon')) {
      return 'anime';
    }
    if (lowerQuery.includes('people') || lowerQuery.includes('人物') || lowerQuery.includes('person')) {
      return 'people';
    }
    if (lowerQuery.includes('animal') || lowerQuery.includes('动物') || lowerQuery.includes('pet')) {
      return 'animal';
    }
    if (lowerQuery.includes('building') || lowerQuery.includes('建筑') || lowerQuery.includes('architecture')) {
      return 'architecture';
    }
    
    return null;
  }
}

// 导出单例实例
export const randomImageAdapter = new RandomImageAdapter();
