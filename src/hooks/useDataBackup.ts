/**
 * 数据备份与恢复相关的React Hook
 */

import { useState, useCallback } from 'react';
import type { BackupData, OperationResult } from '../types';
import { backupData, restoreFromBackup } from '../utils/storage';

/**
 * 数据备份与恢复Hook
 */
export function useDataBackup() {
  const [backing, setBacking] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 创建备份
  const createBackup = useCallback(async (): Promise<OperationResult<BackupData>> => {
    setBacking(true);
    setError(null);
    
    try {
      const result = await backupData();
      if (!result.success) {
        setError(result.error || '备份失败');
      }
      return result;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : '未知错误';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setBacking(false);
    }
  }, []);

  // 恢复备份
  const restoreBackup = useCallback(async (backup: BackupData): Promise<OperationResult<void>> => {
    setRestoring(true);
    setError(null);
    
    try {
      const result = await restoreFromBackup(backup);
      if (!result.success) {
        setError(result.error || '恢复失败');
      }
      return result;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : '未知错误';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setRestoring(false);
    }
  }, []);

  // 导出备份为JSON
  const exportBackup = useCallback(async (): Promise<OperationResult<string>> => {
    const result = await createBackup();
    if (result.success && result.data) {
      try {
        const json = JSON.stringify(result.data, null, 2);
        return { success: true, data: json };
      } catch (err) {
        return { success: false, error: '导出JSON失败' };
      }
    }
    return { success: false, error: result.error };
  }, [createBackup]);

  // 从JSON导入备份
  const importBackup = useCallback(async (jsonString: string): Promise<OperationResult<void>> => {
    try {
      const backup = JSON.parse(jsonString) as BackupData;
      return await restoreBackup(backup);
    } catch (err) {
      return { success: false, error: '解析JSON失败' };
    }
  }, [restoreBackup]);

  // 下载备份文件
  const downloadBackup = useCallback(async (): Promise<OperationResult<void>> => {
    const result = await exportBackup();
    if (result.success && result.data) {
      try {
        const blob = new Blob([result.data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `dualtab-backup-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        return { success: true };
      } catch (err) {
        return { success: false, error: '下载文件失败' };
      }
    }
    return { success: false, error: result.error };
  }, [exportBackup]);

  // 从文件恢复备份
  const restoreFromFile = useCallback(async (file: File): Promise<OperationResult<void>> => {
    try {
      const text = await file.text();
      return await importBackup(text);
    } catch (err) {
      return { success: false, error: '读取文件失败' };
    }
  }, [importBackup]);

  return {
    backing,
    restoring,
    error,
    createBackup,
    restoreBackup,
    exportBackup,
    importBackup,
    downloadBackup,
    restoreFromFile
  };
}
