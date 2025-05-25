/**
 * Unsplash API服务
 * 提供图片获取、搜索、分类等功能
 * 符合Unsplash API使用条款和最佳实践
 */

export interface UnsplashPhoto {
  id: string;
  slug: string;
  created_at: string;
  updated_at: string;
  width: number;
  height: number;
  color: string;
  blur_hash: string;
  description: string | null;
  alt_description: string | null;
  urls: {
    raw: string;
    full: string;
    regular: string;
    small: string;
    thumb: string;
    small_s3: string;
  };
  links: {
    self: string;
    html: string;
    download: string;
    download_location: string;
  };
  user: {
    id: string;
    username: string;
    name: string;
    portfolio_url: string | null;
    bio: string | null;
    location: string | null;
    links: {
      self: string;
      html: string;
      photos: string;
      likes: string;
      portfolio: string;
      following: string;
      followers: string;
    };
    profile_image: {
      small: string;
      medium: string;
      large: string;
    };
    instagram_username: string | null;
    twitter_username: string | null;
  };
  tags?: Array<{
    type: string;
    title: string;
  }>;
}

export interface UnsplashCollection {
  id: string;
  title: string;
  description: string | null;
  published_at: string;
  updated_at: string;
  curated: boolean;
  featured: boolean;
  total_photos: number;
  private: boolean;
  share_key: string;
  cover_photo: UnsplashPhoto;
  preview_photos: UnsplashPhoto[];
  user: UnsplashPhoto['user'];
  links: {
    self: string;
    html: string;
    photos: string;
    related: string;
  };
}

export interface UnsplashSearchResponse {
  total: number;
  total_pages: number;
  results: UnsplashPhoto[];
}

export interface UnsplashError {
  errors: string[];
}

/**
 * Unsplash API配置
 */
export interface UnsplashConfig {
  apiKey?: string;
  perPage?: number;
  quality?: 'raw' | 'full' | 'regular' | 'small' | 'thumb';
}

/**
 * 预定义的图片分类
 */
export const UNSPLASH_CATEGORIES = [
  { id: 'all', name: '全部', query: '' },
  { id: 'nature', name: '自然风景', query: 'nature landscape' },
  { id: 'architecture', name: '建筑', query: 'architecture building' },
  { id: 'abstract', name: '抽象艺术', query: 'abstract art pattern' },
  { id: 'minimal', name: '极简主义', query: 'minimal clean simple' },
  { id: 'space', name: '太空宇宙', query: 'space universe galaxy' },
  { id: 'ocean', name: '海洋', query: 'ocean sea water' },
  { id: 'mountains', name: '山脉', query: 'mountains peaks landscape' },
  { id: 'forest', name: '森林', query: 'forest trees woods' },
  { id: 'city', name: '城市', query: 'city urban skyline' },
  { id: 'technology', name: '科技', query: 'technology digital tech' },
  { id: 'texture', name: '纹理材质', query: 'texture material surface' }
] as const;

export type UnsplashCategoryId = typeof UNSPLASH_CATEGORIES[number]['id'];

/**
 * Unsplash API服务类
 */
export class UnsplashService {
  private readonly baseURL = 'https://api.unsplash.com';
  private readonly defaultApiKey = 'demo-key'; // 演示密钥，有限制
  private config: UnsplashConfig;

  constructor(config: UnsplashConfig = {}) {
    this.config = {
      perPage: 20,
      quality: 'regular',
      ...config
    };
  }

  /**
   * 更新配置
   */
  updateConfig(config: Partial<UnsplashConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * 获取API密钥
   */
  private getApiKey(): string {
    return this.config.apiKey || this.defaultApiKey;
  }

  /**
   * 构建请求头
   */
  private getHeaders(): HeadersInit {
    return {
      'Authorization': `Client-ID ${this.getApiKey()}`,
      'Accept-Version': 'v1',
      'Content-Type': 'application/json'
    };
  }

  /**
   * 发送API请求
   */
  private async request<T>(endpoint: string, params: Record<string, any> = {}): Promise<T> {
    const url = new URL(`${this.baseURL}${endpoint}`);
    
    // 添加查询参数
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        url.searchParams.append(key, String(value));
      }
    });

    try {
      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: this.getHeaders()
      });

      if (!response.ok) {
        const error: UnsplashError = await response.json().catch(() => ({
          errors: [`HTTP ${response.status}: ${response.statusText}`]
        }));
        throw new Error(error.errors?.[0] || `API请求失败: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('网络请求失败，请检查网络连接');
    }
  }

  /**
   * 获取随机图片
   */
  async getRandomPhotos(options: {
    query?: string;
    count?: number;
    orientation?: 'landscape' | 'portrait' | 'squarish';
  } = {}): Promise<UnsplashPhoto[]> {
    const { query, count = this.config.perPage, orientation } = options;

    const params: Record<string, any> = {
      count: Math.min(count || 20, 30), // Unsplash限制最多30张
    };

    if (query) {
      params.query = query;
    }
    if (orientation) {
      params.orientation = orientation;
    }

    const photos = await this.request<UnsplashPhoto | UnsplashPhoto[]>('/photos/random', params);
    return Array.isArray(photos) ? photos : [photos];
  }

  /**
   * 搜索图片
   */
  async searchPhotos(options: {
    query: string;
    page?: number;
    perPage?: number;
    orientation?: 'landscape' | 'portrait' | 'squarish';
    orderBy?: 'relevant' | 'latest';
  }): Promise<UnsplashSearchResponse> {
    const { 
      query, 
      page = 1, 
      perPage = this.config.perPage, 
      orientation,
      orderBy = 'relevant'
    } = options;

    const params: Record<string, any> = {
      query,
      page,
      per_page: Math.min(perPage || 20, 50), // Unsplash限制最多50张
      order_by: orderBy
    };

    if (orientation) {
      params.orientation = orientation;
    }

    return this.request<UnsplashSearchResponse>('/search/photos', params);
  }

  /**
   * 获取精选图片集合
   */
  async getFeaturedCollections(page = 1, perPage = 10): Promise<UnsplashCollection[]> {
    const params = {
      page,
      per_page: Math.min(perPage, 30)
    };

    return this.request<UnsplashCollection[]>('/collections/featured', params);
  }

  /**
   * 获取指定集合中的图片
   */
  async getCollectionPhotos(
    collectionId: string, 
    page = 1, 
    perPage = this.config.perPage
  ): Promise<UnsplashPhoto[]> {
    const params = {
      page,
      per_page: Math.min(perPage || 20, 50)
    };

    return this.request<UnsplashPhoto[]>(`/collections/${collectionId}/photos`, params);
  }

  /**
   * 触发下载统计（符合Unsplash API要求）
   * 当用户下载图片时必须调用此方法
   */
  async trackDownload(downloadLocation: string): Promise<void> {
    try {
      await fetch(downloadLocation, {
        method: 'GET',
        headers: this.getHeaders()
      });
    } catch (error) {
      console.warn('下载统计失败:', error);
      // 不抛出错误，避免影响用户体验
    }
  }

  /**
   * 获取图片下载URL
   * 返回适合的质量版本URL
   */
  getImageUrl(photo: UnsplashPhoto, quality?: UnsplashConfig['quality']): string {
    const targetQuality = quality || this.config.quality || 'regular';
    return photo.urls[targetQuality] || photo.urls.regular;
  }

  /**
   * 检查API密钥是否有效
   */
  async validateApiKey(apiKey?: string): Promise<boolean> {
    const originalKey = this.config.apiKey;
    
    try {
      if (apiKey) {
        this.config.apiKey = apiKey;
      }
      
      // 尝试获取一张随机图片来验证API密钥
      await this.getRandomPhotos({ count: 1 });
      return true;
    } catch (error) {
      return false;
    } finally {
      // 恢复原始密钥
      this.config.apiKey = originalKey;
    }
  }

  /**
   * 根据分类获取图片
   */
  async getPhotosByCategory(
    categoryId: UnsplashCategoryId,
    page = 1,
    perPage = this.config.perPage
  ): Promise<UnsplashPhoto[]> {
    const category = UNSPLASH_CATEGORIES.find(cat => cat.id === categoryId);
    
    if (!category || categoryId === 'all') {
      // 获取随机图片
      return this.getRandomPhotos({ count: perPage });
    }

    // 搜索特定分类的图片
    const searchResult = await this.searchPhotos({
      query: category.query,
      page,
      perPage,
      orientation: 'landscape', // 背景图片优先横向
      orderBy: 'relevant'
    });

    return searchResult.results;
  }
}

/**
 * 默认Unsplash服务实例
 */
export const unsplashService = new UnsplashService();
