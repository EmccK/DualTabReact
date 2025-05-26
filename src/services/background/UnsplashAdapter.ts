/**
 * Unsplash服务适配器
 * 将UnsplashService适配到BackgroundImageService接口
 */

import { BackgroundImageService } from './BackgroundImageService';
import { unsplashService } from '@/services/unsplash';
import type {
  BackgroundImage,
  BackgroundImageMetadata,
  BackgroundImageFilters,
  BackgroundImageSource
} from '@/types/background';
import type { UnsplashPhoto, UnsplashCategoryId } from '@/services/unsplash';

export class UnsplashAdapter extends BackgroundImageService {
  readonly source: BackgroundImageSource = 'unsplash';

  /**
   * 获取随机图片
   */
  async getRandomImage(filters?: BackgroundImageFilters): Promise<BackgroundImage> {
    const categoryId = this.mapCategoryToId(filters?.category);
    const photos = await unsplashService.getPhotosByCategory(categoryId, 1, 1);
    
    if (photos.length === 0) {
      throw this.createError('No images found', 'NO_IMAGES');
    }
    
    return this.convertToBackgroundImage(photos[0]);
  }

  /**
   * 获取多张随机图片
   */
  async getRandomImages(count: number, filters?: BackgroundImageFilters): Promise<BackgroundImage[]> {
    const categoryId = this.mapCategoryToId(filters?.category);
    const photos = await unsplashService.getPhotosByCategory(categoryId, 1, count);
    
    return photos.map(photo => this.convertToBackgroundImage(photo));
  }

  /**
   * 搜索图片
   */
  async searchImages(query: string, filters?: BackgroundImageFilters): Promise<BackgroundImage[]> {
    const searchResult = await unsplashService.searchPhotos({
      query,
      page: filters?.page || 1,
      perPage: filters?.perPage || 20,
      orientation: filters?.orientation
    });
    
    return searchResult.results.map(photo => this.convertToBackgroundImage(photo));
  }

  /**
   * 获取图片元数据
   */
  async getImageMetadata(imageId: string): Promise<BackgroundImageMetadata> {
    // Unsplash API不直接支持通过ID获取图片详情
    // 这里返回一个基本的元数据结构
    throw this.createError('Unsplash API does not support getting image by ID directly', 'NOT_SUPPORTED');
  }

  /**
   * 获取图片URL
   */
  getImageUrl(image: BackgroundImage, quality: 'original' | 'large' | 'medium' | 'small' = 'original'): string {
    const metadata = image as any;
    const urls = metadata.urls;
    
    if (!urls) {
      return image.url;
    }
    
    switch (quality) {
      case 'small':
        return urls.small || urls.thumb || image.url;
      case 'medium':
        return urls.regular || urls.small || image.url;
      case 'large':
        return urls.full || urls.regular || image.url;
      case 'original':
      default:
        return urls.raw || urls.full || image.url;
    }
  }

  /**
   * 转换UnsplashPhoto到BackgroundImage
   */
  protected convertToBackgroundImage(photo: UnsplashPhoto): BackgroundImage {
    return {
      id: photo.id,
      url: photo.urls.regular,
      width: photo.width,
      height: photo.height,
      description: photo.description || photo.alt_description || undefined,
      keywords: photo.tags?.map(tag => tag.title) || [],
      author: {
        name: photo.user.name,
        username: photo.user.username,
        profileUrl: photo.user.links.html,
        avatarUrl: photo.user.profile_image?.medium
      },
      source: 'unsplash',
      createdAt: new Date(photo.created_at).getTime(),
      updatedAt: new Date(photo.updated_at).getTime(),
      // 保存原始Unsplash数据
      ...{
        urls: photo.urls,
        user: photo.user,
        links: photo.links,
        slug: photo.slug,
        color: photo.color,
        blur_hash: photo.blur_hash
      }
    } as BackgroundImage;
  }

  /**
   * 映射分类名称到Unsplash分类ID
   */
  private mapCategoryToId(categoryName?: string): UnsplashCategoryId {
    if (!categoryName) return 'all';
    
    // 简单的映射逻辑
    const categoryMap: Record<string, UnsplashCategoryId> = {
      '全部': 'all',
      '自然': 'nature',
      '建筑': 'architecture',
      '抽象': 'abstract',
      '极简': 'minimal',
      '太空': 'space',
      '海洋': 'ocean',
      '山脉': 'mountains',
      '森林': 'forest',
      '城市': 'city',
      '科技': 'technology',
      '纹理': 'texture'
    };
    
    return categoryMap[categoryName] || categoryName as UnsplashCategoryId || 'all';
  }
}

// 导出单例实例
export const unsplashAdapter = new UnsplashAdapter();
