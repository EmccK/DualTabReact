/**
 * 随机图片API服务
 * 基于 dynamic-api.monknow.com 壁纸API
 */

import {
  RANDOM_IMAGE_CATEGORIES,
  RANDOM_IMAGE_THEMES,
  type RandomImageResponse,
  type RandomImageWallpaper,
  type RandomImageConfig,
  type RandomImageCategoryId,
  type RandomImageThemeId
} from '@/types/randomImage';

export class RandomImageService {
  private readonly baseURL = 'https://dynamic-api.monknow.com';
  private readonly defaultSecret = 'ReNw5eb014b92aab7IiH2wBtn5VxMAdL';
  private config: RandomImageConfig;

  constructor(config: Partial<RandomImageConfig> = {}) {
    this.config = {
      secret: this.defaultSecret,
      ...config
    };
  }

  /**
   * 更新配置
   */
  updateConfig(config: Partial<RandomImageConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * 构建请求头
   */
  private getHeaders(): HeadersInit {
    return {
      'secret': this.config.secret,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };
  }

  /**
   * 发送API请求
   */
  private async request<T>(endpoint: string, params: Record<string, any> = {}): Promise<T> {
    const url = new URL(`${this.baseURL}${endpoint}`);
    
    // 添加查询参数
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        url.searchParams.append(key, String(value));
      }
    });

    try {
      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: this.getHeaders()
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      // 检查API响应状态
      if (data.msg !== 'success') {
        throw new Error(data.msg || '请求失败');
      }

      return data;
    } catch (error) {
      if (error instanceof Error) {
        throw new RandomImageError(error.message);
      }
      throw new RandomImageError('网络请求失败，请检查网络连接');
    }
  }

  /**
   * 获取随机壁纸
   */
  async getRandomWallpaper(options: {
    categoryId?: RandomImageCategoryId;
    themeId?: RandomImageThemeId;
  } = {}): Promise<RandomImageWallpaper> {
    const { categoryId = 'all', themeId = 'all' } = options;

    const params: Record<string, any> = {};

    // 设置分类ID
    if (categoryId !== 'all') {
      const category = RANDOM_IMAGE_CATEGORIES.find(cat => cat.id === categoryId);
      if (category && category.value) {
        params.cate_id = category.value;
      }
    }

    // 设置主题
    if (themeId !== 'all') {
      const theme = RANDOM_IMAGE_THEMES.find(t => t.id === themeId);
      if (theme && theme.value) {
        params.theme = theme.value;
      }
    }

    const response = await this.request<RandomImageResponse>('/wallpaper/random', params);
    return response.data.wallpaper;
  }

  /**
   * 获取多张随机壁纸
   */
  async getRandomWallpapers(options: {
    count?: number;
    categoryId?: RandomImageCategoryId;
    themeId?: RandomImageThemeId;
  } = {}): Promise<RandomImageWallpaper[]> {
    const { count = 5, categoryId, themeId } = options;
    const wallpapers: RandomImageWallpaper[] = [];

    // 并发请求多张图片
    const promises = Array.from({ length: count }, () =>
      this.getRandomWallpaper({ categoryId, themeId })
    );

    try {
      const results = await Promise.allSettled(promises);
      
      results.forEach((result) => {
        if (result.status === 'fulfilled') {
          wallpapers.push(result.value);
        }
      });

      return wallpapers;
    } catch (error) {
      return wallpapers;
    }
  }

  /**
   * 验证API密钥是否有效
   */
  async validateSecret(secret?: string): Promise<boolean> {
    const originalSecret = this.config.secret;
    
    try {
      if (secret) {
        this.config.secret = secret;
      }
      
      await this.getRandomWallpaper();
      return true;
    } catch (error) {
      return false;
    } finally {
      // 恢复原始密钥
      this.config.secret = originalSecret;
    }
  }

  /**
   * 获取图片的最佳质量URL
   */
  getImageUrl(wallpaper: RandomImageWallpaper, quality: 'original' | 'overview' | 'blur' = 'original'): string {
    switch (quality) {
      case 'overview':
        return wallpaper.overviewUrl;
      case 'blur':
        return wallpaper.blurUrl;
      case 'original':
      default:
        return wallpaper.url;
    }
  }

  /**
   * 获取图片信息摘要
   */
  getImageInfo(wallpaper: RandomImageWallpaper): {
    id: number;
    dimensions: string;
    keywords: string[];
    category: string;
    theme: string;
    createdDate: string;
  } {
    const category = RANDOM_IMAGE_CATEGORIES.find(cat => cat.value === String(wallpaper.cateId));
    const theme = RANDOM_IMAGE_THEMES.find(t => t.value === String(wallpaper.theme));
    
    return {
      id: wallpaper.udId,
      dimensions: `${wallpaper.width}×${wallpaper.height}`,
      keywords: wallpaper.keyword ? wallpaper.keyword.split(',').map(k => k.trim()) : [],
      category: category?.name || '未知',
      theme: theme?.name || '不限',
      createdDate: new Date(wallpaper.createdAt * 1000).toLocaleDateString()
    };
  }

  /**
   * 检查图片是否适合作为背景
   */
  isValidBackgroundImage(wallpaper: RandomImageWallpaper): boolean {
    // 检查基本要求
    if (!wallpaper.url || wallpaper.width < 800 || wallpaper.height < 600) {
      return false;
    }

    // 检查图片类型
    if (!wallpaper.mimeType.startsWith('image/')) {
      return false;
    }

    return true;
  }

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
   * 获取推荐的图片设置
   */
  getRecommendedSettings(wallpaper: RandomImageWallpaper): {
    fillMode: 'cover' | 'contain';
    opacity: number;
    blur: number;
  } {
    const aspectRatio = wallpaper.width / wallpaper.height;
    
    return {
      fillMode: aspectRatio > 1.5 ? 'cover' : 'contain',
      opacity: 85, // 稍微透明以便文字可读
      blur: 0 // 默认不模糊
    };
  }
}

/**
 * 默认随机图片服务实例
 */
export const randomImageService = new RandomImageService();

/**
 * 自定义错误类
 */
class RandomImageError extends Error {
  constructor(message: string, public code?: string) {
    super(message);
    this.name = 'RandomImageError';
  }
}
