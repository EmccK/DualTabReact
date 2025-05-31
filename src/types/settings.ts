/**
 * 应用设置类型定义
 */

export interface AppPreferences {
  searchEngine: 'google' | 'baidu' | 'bing';
  timeFormat: '12h' | '24h';
  openInNewTab: boolean;
}

export interface BookmarkSettings {
  // 显示设置
  display: {
    styleType: 'card' | 'icon';       // 书签样式类型：卡片式或图标式
    borderRadius: number;             // 圆角大小 0-100px
    showDescriptions: boolean;        // 显示描述信息
  };
  
  // 行为设置
  behavior: {
    openIn: 'current' | 'new';        // 打开方式
    hoverScale: number;               // 悬停缩放比例 1.0-1.2
  };
  
  // 分类设置
  categories: {
    sidebarVisible: 'always' | 'auto'; // 边栏显示模式
  };
}

export interface BackgroundSettings {
  type: 'gradient' | 'random';
  
  // 渐变设置
  gradient: {
    type: 'linear' | 'radial' | 'conic';
    direction: number; // 角度 0-360 (线性渐变) 或径向渐变的起始角度
    colors: Array<{
      color: string;
      position: number; // 0-100
    }>;
    centerX?: number; // 径向渐变中心点 X 坐标 0-100
    centerY?: number; // 径向渐变中心点 Y 坐标 0-100
    shape?: 'circle' | 'ellipse'; // 径向渐变形状
    size?: 'closest-side' | 'closest-corner' | 'farthest-side' | 'farthest-corner'; // 径向渐变大小
  };
  
  
  // 随机图片设置
  randomImageCategory?: string;
  randomImageTheme?: string;
  
  // 显示效果设置
  display: {
    fillMode: 'cover' | 'contain' | 'stretch' | 'center';
    opacity: number; // 0-100
    blur: number; // 0-20px
    brightness: number; // 0-200%
  };
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
    openInNewTab: false,
  },
  bookmarks: {
    display: {
      styleType: 'card',            // 默认使用卡片样式
      borderRadius: 12,             // 默认圆角
      showDescriptions: true,
    },
    behavior: {
      openIn: 'current',
      hoverScale: 1.05,
    },
    categories: {
      sidebarVisible: 'always',
    },
  },
  background: {
    type: 'gradient',
    gradient: {
      type: 'linear',
      direction: 135,
      colors: [
        { color: '#667eea', position: 0 },
        { color: '#764ba2', position: 100 }
      ],
      centerX: 50,
      centerY: 50,
      shape: 'ellipse',
      size: 'farthest-corner',
    },
    display: {
      fillMode: 'cover',
      opacity: 100,
      blur: 0,
      brightness: 100,
    },
  },
  sync: {
    webdavEnabled: false,
    autoSync: false,
    syncInterval: 30,
  },
};
