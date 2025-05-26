/**
 * 统一背景图片管理服务
 * 管理多个图片源的适配器
 */

import { BackgroundImageService } from './BackgroundImageService';
import { RandomImageAdapter } from './RandomImageAdapter';
import { UnsplashAdapter } from './UnsplashAdapter';
import type {
  BackgroundImage,
  BackgroundImageMetadata,
  BackgroundImageFilters,
  BackgroundImageSource
} from '@/types/background';

export class BackgroundImageManager {
  private adapters: Map<BackgroundImageSource, BackgroundImageService> = new Map();
  private defaultSource: BackgroundImageSource = 'random';

  constructor() {
    // 注册适配器
    this.registerAdapter('random', new RandomImageAdapter());
    this.registerAdapter('unsplash', new UnsplashAdapter());
  }

  /**
   * 注册新的图片源适配器
   */
  registerAdapter(source: BackgroundImageSource, adapter: BackgroundImageService) {
    this.adapters.set(source, adapter);
  }

  /**
   * 获取指定源的适配器
   */
  getAdapter(source: BackgroundImageSource): BackgroundImageService {
    const adapter = this.adapters.get(source);
    if (!adapter) {
      throw new Error(`No adapter found for source: ${source}`);
    }
    return adapter;
  }

  /**
   * 设置默认图片源
   */
  setDefaultSource(source: BackgroundImageSource) {
    if (!this.adapters.has(source)) {
      throw new Error(`Source ${source} is not registered`);
    }
    this.defaultSource = source;
  }

  /**
   * 获取默认图片源
   */
  getDefaultSource(): BackgroundImageSource {
    return this.defaultSource;
  }

  /**
   * 获取所有可用的图片源
   */
  getAvailableSources(): BackgroundImageSource[] {
    return Array.from(this.adapters.keys());
  }

  /**
   * 从默认源获取随机图片
   */
  async getRandomImage(filters?: BackgroundImageFilters): Promise<BackgroundImage> {
    const adapter = this.getAdapter(this.defaultSource);
    return adapter.getRandomImage(filters);
  }

  /**
   * 从指定源获取随机图片
   */
  async getRandomImageFromSource(
    source: BackgroundImageSource, 
    filters?: BackgroundImageFilters
  ): Promise<BackgroundImage> {
    const adapter = this.getAdapter(source);
    return adapter.getRandomImage(filters);
  }

  /**
   * 从默认源获取多张随机图片
   */
  async getRandomImages(count: number, filters?: BackgroundImageFilters): Promise<BackgroundImage[]> {
    const adapter = this.getAdapter(this.defaultSource);
    return adapter.getRandomImages(count, filters);
  }

  /**
   * 从指定源获取多张随机图片
   */
  async getRandomImagesFromSource(
    source: BackgroundImageSource,
    count: number, 
    filters?: BackgroundImageFilters
  ): Promise<BackgroundImage[]> {
    const adapter = this.getAdapter(source);
    return adapter.getRandomImages(count, filters);
  }

  /**
   * 从默认源搜索图片
   */
  async searchImages(query: string, filters?: BackgroundImageFilters): Promise<BackgroundImage[]> {
    const adapter = this.getAdapter(this.defaultSource);
    return adapter.searchImages(query, filters);
  }

  /**
   * 从指定源搜索图片
   */
  async searchImagesFromSource(
    source: BackgroundImageSource,
    query: string, 
    filters?: BackgroundImageFilters
  ): Promise<BackgroundImage[]> {
    const adapter = this.getAdapter(source);
    return adapter.searchImages(query, filters);
  }

  /**
   * 获取图片URL
   */
  getImageUrl(
    image: BackgroundImage, 
    quality?: 'original' | 'large' | 'medium' | 'small'
  ): string {
    const adapter = this.getAdapter(image.source);
    return adapter.getImageUrl(image, quality);
  }

  /**
   * 预加载图片
   */
  async preloadImage(image: BackgroundImage): Promise<boolean> {
    const adapter = this.getAdapter(image.source);
    const imageUrl = adapter.getImageUrl(image, 'medium');
    return adapter.preloadImage(imageUrl);
  }

  /**
   * 验证图片是否适合作为背景
   */
  isValidBackgroundImage(image: BackgroundImage): boolean {
    const adapter = this.getAdapter(image.source);
    return adapter.isValidBackgroundImage(image);
  }

  /**
   * 获取推荐的显示设置
   */
  getRecommendedSettings(image: BackgroundImage): {
    fillMode: 'cover' | 'contain';
    opacity: number;
    blur: number;
  } {
    const adapter = this.getAdapter(image.source);
    return adapter.getRecommendedSettings(image);
  }

  /**
   * 跨源搜索图片（从多个源获取结果）
   */
  async searchImagesFromMultipleSources(
    query: string,
    sources: BackgroundImageSource[] = this.getAvailableSources(),
    filters?: BackgroundImageFilters
  ): Promise<BackgroundImage[]> {
    const promises = sources.map(async (source) => {
      try {
        const adapter = this.getAdapter(source);
        return await adapter.searchImages(query, { ...filters, perPage: 5 });
      } catch (error) {
        console.warn(`Failed to search from ${source}:`, error);
        return [];
      }
    });

    const results = await Promise.allSettled(promises);
    const allImages: BackgroundImage[] = [];

    results.forEach((result) => {
      if (result.status === 'fulfilled') {
        allImages.push(...result.value);
      }
    });

    return allImages;
  }

  /**
   * 获取混合随机图片（从多个源获取）
   */
  async getMixedRandomImages(
    count: number,
    sources: BackgroundImageSource[] = this.getAvailableSources(),
    filters?: BackgroundImageFilters
  ): Promise<BackgroundImage[]> {
    const imagesPerSource = Math.ceil(count / sources.length);
    const promises = sources.map(async (source) => {
      try {
        const adapter = this.getAdapter(source);
        return await adapter.getRandomImages(imagesPerSource, filters);
      } catch (error) {
        console.warn(`Failed to get images from ${source}:`, error);
        return [];
      }
    });

    const results = await Promise.allSettled(promises);
    const allImages: BackgroundImage[] = [];

    results.forEach((result) => {
      if (result.status === 'fulfilled') {
        allImages.push(...result.value);
      }
    });

    // 随机排序并限制数量
    return allImages.sort(() => Math.random() - 0.5).slice(0, count);
  }
}

// 导出单例实例
export const backgroundImageManager = new BackgroundImageManager();
