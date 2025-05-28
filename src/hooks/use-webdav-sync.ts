/**
 * WebDAV同步功能Hook
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import type { 
  SyncProgress, 
  SyncHistory, 
  SyncConflict,
  WebDAVConnectionSettings 
} from '../types/webdav';
import type { Bookmark, BookmarkCategory } from '../types';
import type { AppSettings } from '../types/settings';
import { 
  WebDAVClient,
  WebDAVDataOperations,
  WebDAVSyncService,
  WebDAVSyncScheduler 
} from '../services/webdav';

interface UseWebDAVSyncOptions {
  settings: WebDAVConnectionSettings;
  getLocalData: () => Promise<{
    bookmarks: Bookmark[];
    categories: BookmarkCategory[];
    settings: AppSettings;
  }>;
  onSyncComplete?: (success: boolean, error?: string) => void;
}

export function useWebDAVSync({ 
  settings, 
  getLocalData, 
  onSyncComplete 
}: UseWebDAVSyncOptions) {
  const [syncProgress, setSyncProgress] = useState<SyncProgress | null>(null);
  const [syncHistory, setSyncHistory] = useState<SyncHistory[]>([]);
  const [conflicts, setConflicts] = useState<SyncConflict[]>([]);
  const [isAutoSyncEnabled, setIsAutoSyncEnabled] = useState(false);

  const syncServiceRef = useRef<WebDAVSyncService | null>(null);
  const schedulerRef = useRef<WebDAVSyncScheduler | null>(null);

  // 初始化同步服务
  const initializeSyncService = useCallback(() => {
    if (!settings.enabled) return;

    const client = new WebDAVClient(settings.config);
    const dataOps = new WebDAVDataOperations(client);
    syncServiceRef.current = new WebDAVSyncService(dataOps);

    // 初始化调度器
    schedulerRef.current = new WebDAVSyncScheduler(
      settings.syncInterval || 30,
      getLocalData
    );
  }, [settings, getLocalData]);

  // 手动同步
  const manualSync = useCallback(async () => {
    if (!syncServiceRef.current) {
      initializeSyncService();
    }

    if (!syncServiceRef.current) {
      throw new Error('同步服务未初始化');
    }

    try {
      const localData = await getLocalData();
      
      await syncServiceRef.current.startSync(
        localData.bookmarks,
        localData.categories,
        localData.settings
      );

      // 更新状态
      setSyncProgress(syncServiceRef.current.getSyncProgress());
      setSyncHistory(syncServiceRef.current.getSyncHistory());
      setConflicts(syncServiceRef.current.getConflictQueue());

      onSyncComplete?.(true);
    } catch (error: any) {
      onSyncComplete?.(false, error.message);
    }
  }, [initializeSyncService, getLocalData, onSyncComplete]);

  // 切换自动同步
  const toggleAutoSync = useCallback(() => {
    const newEnabled = !isAutoSyncEnabled;
    setIsAutoSyncEnabled(newEnabled);

    if (newEnabled && schedulerRef.current && syncServiceRef.current) {
      schedulerRef.current.start(syncServiceRef.current);
    } else if (schedulerRef.current) {
      schedulerRef.current.stop();
    }
  }, [isAutoSyncEnabled]);

  // 解决冲突
  const resolveConflict = useCallback(async (
    index: number, 
    resolution: 'local' | 'remote' | 'skip'
  ) => {
    if (!syncServiceRef.current) return;

    try {
      await syncServiceRef.current.resolveConflict(index, resolution);
      setConflicts(syncServiceRef.current.getConflictQueue());
    } catch (error) {
      console.error('解决冲突失败:', error);
    }
  }, []);

  // 清空冲突队列
  const clearConflicts = useCallback(() => {
    if (syncServiceRef.current) {
      syncServiceRef.current.clearConflictQueue();
      setConflicts([]);
    }
  }, []);


  // 获取同步统计信息
  const getSyncStats = useCallback(() => {
    const totalSyncs = syncHistory.length;
    const successfulSyncs = syncHistory.filter(h => h.status === 'success').length;
    const failedSyncs = syncHistory.filter(h => h.status === 'error').length;
    const lastSync = syncHistory[0];

    return {
      totalSyncs,
      successfulSyncs,
      failedSyncs,
      successRate: totalSyncs > 0 ? (successfulSyncs / totalSyncs) * 100 : 0,
      lastSync,
      hasConflicts: conflicts.length > 0,
      conflictCount: conflicts.length,
    };
  }, [syncHistory, conflicts]);

  // 初始化
  useEffect(() => {
    if (settings.enabled) {
      initializeSyncService();
      
      // 如果启用了自动同步，启动调度器
      if (settings.autoSync && schedulerRef.current && syncServiceRef.current) {
        schedulerRef.current.start(syncServiceRef.current);
        setIsAutoSyncEnabled(true);
      }
    }

    return () => {
      // 清理资源
      if (schedulerRef.current) {
        schedulerRef.current.stop();
      }
    };
  }, [settings, initializeSyncService]);

  // 定期更新状态
  useEffect(() => {
    if (!syncServiceRef.current) return;

    const updateInterval = setInterval(() => {
      const currentProgress = syncServiceRef.current?.getSyncProgress();
      const currentHistory = syncServiceRef.current?.getSyncHistory();
      const currentConflicts = syncServiceRef.current?.getConflictQueue();

      if (currentProgress) setSyncProgress(currentProgress);
      if (currentHistory) setSyncHistory(currentHistory);
      if (currentConflicts) setConflicts(currentConflicts);
    }, 1000);

    return () => clearInterval(updateInterval);
  }, []);

  return {
    syncProgress,
    syncHistory,
    conflicts,
    isAutoSyncEnabled,
    manualSync,
    toggleAutoSync,
    resolveConflict,
    clearConflicts,
    getSyncStats,
  };
}
