/**
 * 同步设置分组 - 集成WebDAV功能
 */

import React from 'react';
import { WebDAVPage } from './webdav-page';
import type { SyncSettings as SyncSettingsType } from '@/types/settings';
import type { Bookmark, BookmarkCategory } from '@/types';
import type { AppSettings } from '@/types/settings';

interface SyncSettingsProps {
  settings: SyncSettingsType;
  onUpdate: (updates: Partial<SyncSettingsType>) => void;
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

/**
 * 同步设置分组
 * 现在使用新的WebDAV功能组件
 */
export function SyncSettings({ settings, onUpdate, getLocalData, onDataUpdated }: SyncSettingsProps) {
  return (
    <div className="space-y-6">
      <WebDAVPage getLocalData={getLocalData} onDataUpdated={onDataUpdated} />
    </div>
  );
}
