/**
 * 应用设置类型定义
 */

export interface AppPreferences {
  searchEngine: 'google' | 'baidu' | 'bing';
  timeFormat: '12h' | '24h';
  dateFormat: 'zh-CN' | 'en-US';
  autoFocusSearch: boolean;
  openInNewTab: boolean;
  showSeconds: boolean;
}

export interface BookmarkSettings {
  // 显示设置
  display: {
    iconSize: number;           // 图标大小 16-48px
    showTitle: boolean;         // 显示书签标题
    itemsPerRow: 'auto' | number; // 每行书签数量，auto为自适应
    cardSpacing: number;        // 卡片间距 4-16px
    cardPadding: number;        // 卡片内边距 8-24px
    showFavicons: boolean;      // 显示网站图标
    showDescriptions: boolean;  // 显示描述信息
  };
  
  // 行为设置
  behavior: {
    openIn: 'current' | 'new';  // 打开方式
    enableDrag: boolean;        // 拖拽排序
    enableHover: boolean;       // 悬停效果
    hoverScale: number;         // 悬停缩放比例 1.0-1.2
    clickAnimation: boolean;    // 点击动画效果
  };
  
  // 网格布局设置
  grid: {
    columns: 'auto' | number;   // 列数设置，auto为响应式
    aspectRatio: string;        // 纵横比 '1/1', '4/3', '16/9'
    responsive: boolean;        // 响应式布局
    minCardWidth: number;       // 最小卡片宽度 80-200px
    maxCardWidth: number;       // 最大卡片宽度 120-300px
  };
  
  // 分类设置
  categories: {
    layout: 'tabs' | 'sidebar'; // 分类布局位置
    style: 'simple' | 'badge';  // 标签样式
    showEmpty: boolean;         // 显示空分类
    enableSort: boolean;        // 分类排序
    tabPosition: 'top' | 'bottom'; // 标签位置（当layout为tabs时）
    sidebarWidth: number;       // 边栏宽度 200-400px
    sidebarVisible: 'always' | 'auto'; // 边栏显示模式
  };
}

export interface LocalBackgroundImage {
  id: string;
  name: string;
  data: string; // base64 encoded image data
  size: number;
  type: string;
  uploadTime: number;
}

export interface UnsplashSettings {
  category: string;
  refreshInterval: number; // hours
  showAttribution: boolean;
  apiKey?: string;
  collections: string[];
  featured: boolean;
  orientation?: 'landscape' | 'portrait' | 'squarish';
}

export interface BackgroundDisplaySettings {
  fillMode: 'cover' | 'contain' | 'fill' | 'repeat';
  opacity: number; // 0-100
  blur: number; // 0-20px
  brightness: number; // 0-200%
  contrast: number; // 0-200%
  saturation: number; // 0-200%
  overlay: boolean;
  overlayColor: string;
  overlayOpacity: number; // 0-100
}

export interface BackgroundSettings {
  type: 'color' | 'gradient' | 'local' | 'unsplash';
  
  // 纯色背景设置
  color: string;
  colorHistory: string[]; // 最近使用的颜色
  
  // 渐变背景设置
  gradient: {
    type: 'linear' | 'radial';
    direction: number; // 线性渐变角度 0-360
    colors: Array<{
      color: string;
      position: number; // 0-100
    }>;
    radialPosition: {
      x: number; // 0-100
      y: number; // 0-100
    };
  };
  gradientPresets: Array<{
    id: string;
    name: string;
    gradient: BackgroundSettings['gradient'];
  }>;
  
  // 本地图片设置
  localImages: LocalBackgroundImage[];
  currentLocalImage?: string; // 当前选中的本地图片ID
  
  // Unsplash设置
  unsplash: UnsplashSettings;
  currentUnsplashImage?: {
    id: string;
    url: string;
    author: string;
    authorUrl: string;
    downloadUrl: string;
  };
  
  // 显示效果设置
  display: BackgroundDisplaySettings;
}

export interface SyncSettings {
  webdavEnabled: boolean;
  autoSync: boolean;
  syncInterval: number;
  lastSyncTime?: string;
  serverUrl?: string;
  username?: string;
  basePath?: string;
}

export interface AppSettings {
  preferences: AppPreferences;
  bookmarks: BookmarkSettings;
  background: BackgroundSettings;
  sync: SyncSettings;
}

export interface SettingsContextType {
  settings: AppSettings;
  updateSettings: <T extends keyof AppSettings>(
    section: T,
    updates: Partial<AppSettings[T]>
  ) => Promise<void>;
  resetSettings: (section?: keyof AppSettings) => Promise<void>;
  isLoading: boolean;
  isDirty: boolean;
}

export const DEFAULT_SETTINGS: AppSettings = {
  preferences: {
    searchEngine: 'google',
    timeFormat: '24h',
    dateFormat: 'zh-CN',
    autoFocusSearch: true,
    openInNewTab: false,
    showSeconds: true,
  },
  bookmarks: {
    display: {
      iconSize: 32,
      showTitle: true,
      itemsPerRow: 'auto',
      cardSpacing: 8,
      cardPadding: 16,
      showFavicons: true,
      showDescriptions: true,
    },
    behavior: {
      openIn: 'current',
      enableDrag: true,
      enableHover: true,
      hoverScale: 1.05,
      clickAnimation: true,
    },
    grid: {
      columns: 'auto',
      aspectRatio: '1/1',
      responsive: true,
      minCardWidth: 120,
      maxCardWidth: 200,
    },
    categories: {
      layout: 'sidebar',
      style: 'badge',
      showEmpty: false,
      enableSort: true,
      tabPosition: 'top',
      sidebarWidth: 280,
      sidebarVisible: 'always',
    },
  },
  background: {
    type: 'gradient',
    color: '#4F46E5',
    colorHistory: ['#4F46E5', '#EC4899', '#10B981', '#F59E0B'],
    gradient: {
      type: 'linear',
      direction: 135,
      colors: [
        { color: '#667eea', position: 0 },
        { color: '#764ba2', position: 100 }
      ],
      radialPosition: { x: 50, y: 50 }
    },
    gradientPresets: [
      {
        id: 'ocean-blue',
        name: '海洋蓝',
        gradient: {
          type: 'linear',
          direction: 135,
          colors: [
            { color: '#667eea', position: 0 },
            { color: '#764ba2', position: 100 }
          ],
          radialPosition: { x: 50, y: 50 }
        }
      },
      {
        id: 'sunset-orange',
        name: '日落橙',
        gradient: {
          type: 'linear',
          direction: 45,
          colors: [
            { color: '#f093fb', position: 0 },
            { color: '#f5576c', position: 100 }
          ],
          radialPosition: { x: 50, y: 50 }
        }
      },
      {
        id: 'forest-green',
        name: '森林绿',
        gradient: {
          type: 'linear',
          direction: 225,
          colors: [
            { color: '#43e97b', position: 0 },
            { color: '#38d9a9', position: 100 }
          ],
          radialPosition: { x: 50, y: 50 }
        }
      },
      {
        id: 'royal-purple',
        name: '皇家紫',
        gradient: {
          type: 'linear',
          direction: 90,
          colors: [
            { color: '#667eea', position: 0 },
            { color: '#764ba2', position: 50 },
            { color: '#f093fb', position: 100 }
          ],
          radialPosition: { x: 50, y: 50 }
        }
      },
      {
        id: 'cosmic-radial',
        name: '宇宙径向',
        gradient: {
          type: 'radial',
          direction: 0,
          colors: [
            { color: '#667eea', position: 0 },
            { color: '#764ba2', position: 60 },
            { color: '#f093fb', position: 100 }
          ],
          radialPosition: { x: 30, y: 40 }
        }
      }
    ],
    localImages: [],
    unsplash: {
      category: 'nature',
      refreshInterval: 24,
      showAttribution: true,
      collections: [],
      featured: true,
      orientation: 'landscape',
    },
    display: {
      fillMode: 'cover',
      opacity: 100,
      blur: 0,
      brightness: 100,
      contrast: 100,
      saturation: 100,
      overlay: false,
      overlayColor: '#000000',
      overlayOpacity: 20,
    },
  },
  sync: {
    webdavEnabled: false,
    autoSync: false,
    syncInterval: 30,
  },
};
