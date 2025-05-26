/**
 * 随机图片API类型定义
 * 基于 dynamic-api.monknow.com API
 */

export interface RandomImageWallpaper {
  udId: number;
  url: string;
  width: number;
  height: number;
  mimeType: string;
  keyword: string;
  colorId: number;
  cateId: number;
  theme: number;
  overviewUrl: string;
  blurUrl: string;
  createdAt: number;
  updatedAt: number;
}

export interface RandomImageResponse {
  data: {
    wallpaper: RandomImageWallpaper;
  };
  msg: string;
}

export interface RandomImageCategory {
  id: string;
  name: string;
  value: string;
}

export interface RandomImageTheme {
  id: string;
  name: string;
  value: string;
}

export interface RandomImageConfig {
  secret: string;
  cateId?: string;
  theme?: string;
}

export interface RandomImageError {
  message: string;
  code?: string;
}

// 预定义的分类
export const RANDOM_IMAGE_CATEGORIES: RandomImageCategory[] = [
  { id: 'all', name: '全部', value: '' },
  { id: 'nature', name: '自然', value: '8' },
  { id: 'anime', name: '动漫', value: '9' },
  { id: 'people', name: '人物', value: '11' },
  { id: 'animal', name: '动物', value: '12' },
  { id: 'architecture', name: '建筑', value: '13' }
];

// 预定义的主题
export const RANDOM_IMAGE_THEMES: RandomImageTheme[] = [
  { id: 'all', name: '不限', value: '' },
  { id: 'day', name: '白天', value: '1' },
  { id: 'night', name: '晚上', value: '2' }
];

export type RandomImageCategoryId = typeof RANDOM_IMAGE_CATEGORIES[number]['id'];
export type RandomImageThemeId = typeof RANDOM_IMAGE_THEMES[number]['id'];
