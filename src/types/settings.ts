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
  };
}

export interface BackgroundSettings {
  type: 'unsplash' | 'local' | 'solid';
  unsplashCategory: string;
  refreshInterval: number;
  showAttribution: boolean;
  solidColor: string;
  blurLevel: number;
  opacity: number;
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
    },
  },
  background: {
    type: 'unsplash',
    unsplashCategory: 'nature',
    refreshInterval: 24,
    showAttribution: true,
    solidColor: '#4F46E5',
    blurLevel: 0,
    opacity: 100,
  },
  sync: {
    webdavEnabled: false,
    autoSync: false,
    syncInterval: 30,
  },
};
