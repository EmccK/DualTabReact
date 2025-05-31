/**
 * 设置数据迁移工具
 * 用于在版本升级时清理过时的设置项并应用新的默认值
 */

import type { AppSettings } from '@/types/settings';
import { DEFAULT_SETTINGS } from '@/types/settings';

/**
 * 当前版本号
 * 每次有重大设置变更时应该更新这个版本号
 */
export const CURRENT_SETTINGS_VERSION = '2.0.0';

/**
 * 迁移设置数据
 * @param oldSettings 旧的设置数据
 * @returns 迁移后的新设置数据
 */
export function migrateSettings(oldSettings: any): AppSettings {
  // 如果没有版本信息，说明是老版本，需要迁移
  const currentVersion = oldSettings._version || '1.0.0';
  
  console.log(`开始设置迁移: ${currentVersion} -> ${CURRENT_SETTINGS_VERSION}`);
  
  // 基于默认设置创建新的设置对象
  const newSettings: AppSettings = {
    ...DEFAULT_SETTINGS,
    // 添加版本标识
    _version: CURRENT_SETTINGS_VERSION,
  } as AppSettings & { _version: string };

  // 迁移应用偏好设置
  if (oldSettings.preferences) {
    newSettings.preferences = {
      // 保留现有的搜索引擎设置
      searchEngine: oldSettings.preferences.searchEngine || DEFAULT_SETTINGS.preferences.searchEngine,
      // 保留现有的时间格式设置
      timeFormat: oldSettings.preferences.timeFormat || DEFAULT_SETTINGS.preferences.timeFormat,
      // 保留现有的新标签页打开设置
      openInNewTab: oldSettings.preferences.openInNewTab || DEFAULT_SETTINGS.preferences.openInNewTab,
      
      // 移除的设置项：
      // - autoFocusSearch: 始终启用自动聚焦
      // - dateFormat: 始终使用中文格式
      // - showSeconds: 始终显示秒数
    };
  }

  // 迁移书签设置
  if (oldSettings.bookmarks) {
    // 显示设置 - 保持不变
    if (oldSettings.bookmarks.display) {
      newSettings.bookmarks.display = {
        ...DEFAULT_SETTINGS.bookmarks.display,
        ...oldSettings.bookmarks.display,
      };
    }

    // 行为设置 - 移除一些选项
    if (oldSettings.bookmarks.behavior) {
      newSettings.bookmarks.behavior = {
        // 保留现有的打开方式设置
        openIn: oldSettings.bookmarks.behavior.openIn || DEFAULT_SETTINGS.bookmarks.behavior.openIn,
        // 保留现有的悬停缩放设置
        hoverScale: oldSettings.bookmarks.behavior.hoverScale || DEFAULT_SETTINGS.bookmarks.behavior.hoverScale,
        
        // 移除的设置项（这些功能现在始终启用）：
        // - enableDrag: 始终启用拖拽排序
        // - enableHover: 始终启用悬停效果
        // - clickAnimation: 始终启用点击动画
      };
    }

    // 网格设置 - 保持不变
    if (oldSettings.bookmarks.grid) {
      newSettings.bookmarks.grid = {
        ...DEFAULT_SETTINGS.bookmarks.grid,
        ...oldSettings.bookmarks.grid,
      };
    }

    // 分类设置 - 移除布局和样式选项
    if (oldSettings.bookmarks.categories) {
      newSettings.bookmarks.categories = {
        // 保留现有的边栏显示模式设置
        sidebarVisible: oldSettings.bookmarks.categories.sidebarVisible || DEFAULT_SETTINGS.bookmarks.categories.sidebarVisible,
        
        // 移除的设置项（使用固定值）：
        // - sidebarWidth: 现在使用固定宽度 160px
        // - layout: 始终为 'sidebar' (右侧边栏)
        // - style: 始终为 'simple' (简单样式)
        // - showEmpty: 始终为 true (显示空分类)
        // - enableSort: 始终为 true (启用分类排序)
        // - tabPosition: 移除，因为始终使用边栏布局
      };
    }
  }

  // 背景设置 - 保持不变
  if (oldSettings.background) {
    newSettings.background = {
      ...DEFAULT_SETTINGS.background,
      ...oldSettings.background,
    };
  }

  // 同步设置 - 保持不变
  if (oldSettings.sync) {
    newSettings.sync = {
      ...DEFAULT_SETTINGS.sync,
      ...oldSettings.sync,
    };
  }

  console.log('设置迁移完成', {
    从: currentVersion,
    到: CURRENT_SETTINGS_VERSION,
    移除的功能: [
      '自动聚焦搜索框设置 (始终启用)',
      '日期格式设置 (始终使用中文)',
      '显示秒数设置 (始终显示)',
      '拖拽排序设置 (始终启用)',
      '悬停效果设置 (始终启用)',
      '点击动画设置 (始终启用)',
      '分类布局位置设置 (始终为右侧)',
      '分类标签样式设置 (始终为简单)',
      '显示空分类设置 (始终显示)',
      '启用分类排序设置 (始终启用)',
      '标签页位置设置 (始终使用右侧边栏)',
      '边栏宽度设置 (现在使用固定宽度 160px)',
    ]
  });

  return newSettings;
}

/**
 * 检查是否需要迁移
 * @param settings 当前设置数据
 * @returns 是否需要迁移
 */
export function needsMigration(settings: any): boolean {
  // 检查版本号
  const currentVersion = settings._version || '1.0.0';
  
  // 检查是否有被移除的设置项
  const hasRemovedSettings = 
    settings.preferences?.autoFocusSearch !== undefined ||
    settings.preferences?.dateFormat !== undefined ||
    settings.preferences?.showSeconds !== undefined ||
    settings.bookmarks?.behavior?.enableDrag !== undefined ||
    settings.bookmarks?.behavior?.enableHover !== undefined ||
    settings.bookmarks?.behavior?.clickAnimation !== undefined ||
    settings.bookmarks?.categories?.layout !== undefined ||
    settings.bookmarks?.categories?.style !== undefined ||
    settings.bookmarks?.categories?.showEmpty !== undefined ||
    settings.bookmarks?.categories?.enableSort !== undefined;

  return currentVersion !== CURRENT_SETTINGS_VERSION || hasRemovedSettings;
}

/**
 * 创建迁移报告
 * @param oldSettings 旧设置
 * @param newSettings 新设置
 * @returns 迁移报告
 */
export function createMigrationReport(oldSettings: any, newSettings: AppSettings): {
  removed: string[];
  changed: string[];
  preserved: string[];
} {
  const removed: string[] = [];
  const changed: string[] = [];
  const preserved: string[] = [];

  // 检查移除的设置项
  if (oldSettings.preferences?.autoFocusSearch !== undefined) {
    removed.push('应用偏好 → 自动聚焦搜索框 (现在始终启用)');
  }
  if (oldSettings.preferences?.dateFormat !== undefined) {
    removed.push('应用偏好 → 日期格式 (现在始终使用中文格式)');
  }
  if (oldSettings.preferences?.showSeconds !== undefined) {
    removed.push('应用偏好 → 显示秒数 (现在始终显示秒数)');
  }
  if (oldSettings.bookmarks?.behavior?.enableDrag !== undefined) {
    removed.push('书签管理 → 启用拖拽排序 (现在始终可以拖拽排序)');
  }
  if (oldSettings.bookmarks?.behavior?.enableHover !== undefined) {
    removed.push('书签管理 → 悬停效果 (现在悬停效果始终启用)');
  }
  if (oldSettings.bookmarks?.behavior?.clickAnimation !== undefined) {
    removed.push('书签管理 → 点击动画 (现在点击动画始终启用)');
  }
  if (oldSettings.bookmarks?.categories?.layout !== undefined) {
    removed.push('书签管理 → 分类布局位置 (现在始终位于右侧)');
  }
  if (oldSettings.bookmarks?.categories?.style !== undefined) {
    removed.push('书签管理 → 分类标签样式 (现在始终为简单样式)');
  }
  if (oldSettings.bookmarks?.categories?.showEmpty !== undefined) {
    removed.push('书签管理 → 显示空分类 (现在始终显示空分类)');
  }
  if (oldSettings.bookmarks?.categories?.enableSort !== undefined) {
    removed.push('书签管理 → 启用分类排序 (现在始终启用分类排序)');
  }
  if (oldSettings.bookmarks?.categories?.sidebarWidth !== undefined) {
    removed.push('书签管理 → 边栏宽度 (现在使用固定宽度 160px)');
  }
  if (oldSettings.bookmarks?.categories?.tabPosition !== undefined) {
    removed.push('书签管理 → 标签页位置 (现在始终使用右侧边栏布局)');
  }

  // 检查保留的设置项
  if (oldSettings.preferences?.searchEngine === newSettings.preferences.searchEngine) {
    preserved.push('应用偏好 → 默认搜索引擎');
  }
  if (oldSettings.preferences?.timeFormat === newSettings.preferences.timeFormat) {
    preserved.push('应用偏好 → 时间格式');
  }
  if (oldSettings.preferences?.openInNewTab === newSettings.preferences.openInNewTab) {
    preserved.push('应用偏好 → 新标签页打开搜索结果');
  }

  return { removed, changed, preserved };
}
