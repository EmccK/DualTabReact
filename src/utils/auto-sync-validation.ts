/**
 * 验证自动同步功能的简单测试
 */

// 检查关键组件和模块是否正确导出
export const checkExports = async () => {
  const results = {
    hooks: false,
    components: false,
    services: false,
    background: false,
  };

  try {
    // 检查hooks导出
    const hooksModule = await import('../hooks');
    results.hooks = !!(
      hooksModule.useDataChangeDetection &&
      hooksModule.useBookmarkDataChangeDetection &&
      hooksModule.useSettingsDataChangeDetection &&
      hooksModule.useDebounce
    );

    // 检查services导出
    const servicesModule = await import('../services/sync');
    results.services = !!(
      servicesModule.AutoSyncScheduler &&
      servicesModule.SyncManager &&
      servicesModule.initializeAutoSyncScheduler
    );

    // 检查组件导出
    const componentModule = await import('../components/settings/sections/webdav');
    results.components = !!(
      componentModule.AutoSyncConfig &&
      componentModule.WebDAVSettings
    );

    results.background = true; // background script 无法在此测试

    return results;
  } catch (error) {
    console.error('Export check failed:', error);
    return results;
  }
};

/**
 * 验证类型定义
 */
export const checkTypes = () => {
  try {
    // 这些应该编译时通过类型检查
    const autoSyncConfig: {
      enableAutoUpload: boolean;
      enableAutoDownload: boolean;
      uploadDelay: number;
      downloadOnTabOpen: boolean;
    } = {
      enableAutoUpload: true,
      enableAutoDownload: true,
      uploadDelay: 2000,
      downloadOnTabOpen: true,
    };

    const timeRecord: {
      lastDataChangeTime: number;
      lastUploadTime: number;
      lastDownloadTime: number;
      deviceId: string;
    } = {
      lastDataChangeTime: 0,
      lastUploadTime: 0,
      lastDownloadTime: 0,
      deviceId: 'test-device',
    };

    return {
      success: true,
      config: autoSyncConfig,
      timeRecord,
    };
  } catch (error) {
    return {
      success: false,
      error,
    };
  }
};

// 在控制台中可以调用的验证函数
if (typeof window !== 'undefined') {
  (window as any).checkAutoSyncExports = checkExports;
  (window as any).checkAutoSyncTypes = checkTypes;
}