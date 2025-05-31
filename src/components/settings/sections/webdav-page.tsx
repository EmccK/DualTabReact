/**
 * WebDAV设置页面主组件
 */

import React from 'react';
import { WebDAVSettings } from './webdav-settings';
import { useWebDAVConfig } from '../../../hooks/use-webdav-config';
import { useWebDAVSync } from '../../../hooks/use-webdav-sync';
import type { Bookmark, BookmarkCategory } from '../../../types';
import type { AppSettings } from '../../../types/settings';

interface WebDAVPageProps {
  getLocalData: () => Promise<{
    bookmarks: Bookmark[];
    categories: BookmarkCategory[];
    settings: AppSettings;
  }>;
  onDataUpdated?: (data: {
    bookmarks: Bookmark[];
    categories: BookmarkCategory[];
    settings: AppSettings;
  }) => void;
}

export function WebDAVPage({ getLocalData, onDataUpdated }: WebDAVPageProps) {
  const {
    settings,
    isLoading,
    saveSettings,
    testConnection,
    resetSettings,
    mergeRemoteConfig,
  } = useWebDAVConfig();

  const {
    syncProgress,
    manualSync,
  } = useWebDAVSync({
    settings,
    getLocalData,
    onDataUpdated: async (data) => {
      // 处理WebDAV配置同步
      if (data.settings?.webdav_config) {
        try {
          console.log('检测到远程WebDAV配置，开始合并...');
          await mergeRemoteConfig(data.settings.webdav_config);
          console.log('WebDAV配置合并完成');
        } catch (error) {
          console.error('WebDAV配置合并失败:', error);
        }
      }
      
      // 调用原始的数据更新回调
      onDataUpdated?.(data);
    },
    onSyncComplete: (success, error) => {
      if (success) {
        console.log('同步完成');
      } else {
        console.error('同步失败:', error);
      }
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-2"></div>
          <p className="text-gray-500">加载WebDAV设置中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold mb-2">WebDAV云同步</h2>
        <p className="text-sm text-gray-600">
          通过WebDAV协议将您的书签和设置同步到云端，支持多设备数据共享
        </p>
      </div>

      <WebDAVSettings
        settings={settings}
        onSettingsChange={saveSettings}
        onTestConnection={testConnection}
        onManualSync={manualSync}
        syncProgress={syncProgress}
      />
    </div>
  );
}
