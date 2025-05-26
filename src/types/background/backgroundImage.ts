/**
 * 通用背景图片接口定义
 * 用于抽象不同的图片API源
 */

export interface BackgroundImage {
  id: string;
  url: string;
  width: number;
  height: number;
  description?: string;
  keywords?: string[];
  category?: string;
  theme?: string;
  author?: BackgroundImageAuthor;
  source: BackgroundImageSource;
  createdAt?: number;
  updatedAt?: number;
}

export interface BackgroundImageAuthor {
  name: string;
  username?: string;
  profileUrl?: string;
  avatarUrl?: string;
}

export interface BackgroundImageUrls {
  original: string;
  large?: string;
  medium?: string;
  small?: string;
  thumbnail?: string;
  blur?: string;
}

export type BackgroundImageSource = 'unsplash' | 'random' | 'local' | 'custom';

export interface BackgroundImageMetadata {
  id: string;
  urls: BackgroundImageUrls;
  description?: string;
  keywords?: string[];
  category?: string;
  theme?: string;
  author?: BackgroundImageAuthor;
  source: BackgroundImageSource;
  dimensions: {
    width: number;
    height: number;
  };
  createdAt?: number;
  updatedAt?: number;
}

// API响应的通用接口
export interface BackgroundImageApiResponse<T = any> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
}

// 搜索/筛选参数
export interface BackgroundImageFilters {
  category?: string;
  theme?: string;
  orientation?: 'landscape' | 'portrait' | 'square';
  query?: string;
  page?: number;
  perPage?: number;
}

// 统一的错误类型
export interface BackgroundImageError {
  code: string;
  message: string;
  source: BackgroundImageSource;
}
