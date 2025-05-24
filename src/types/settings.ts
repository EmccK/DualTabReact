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
  defaultView: 'grid' | 'list';
  itemsPerRow: number;
  showFavicons: boolean;
  enableDragSort: boolean;
  cardSize: 'small' | 'medium' | 'large';
  showDescriptions: boolean;
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
    defaultView: 'grid',
    itemsPerRow: 6,
    showFavicons: true,
    enableDragSort: true,
    cardSize: 'medium',
    showDescriptions: true,
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
