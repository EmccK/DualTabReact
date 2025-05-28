/**
 * WebDAV同步执行器
 */

import type {
  SyncItem,
  SyncConflict,
  SyncDirection,
} from '../../types/webdav';
import type { WebDAVDataOperations } from './data-operations';

export class WebDAVSyncExecutor {
  constructor(private dataOps: WebDAVDataOperations) {}

  /**
   * 执行同步项目
   */
  async executeSyncItem(
    item: SyncItem,
    localData: any,
    onProgress?: (item: SyncItem) => void
  ): Promise<{ 
    success: boolean; 
    conflict?: SyncConflict; 
    updatedData?: any;
  }> {
    item.status = 'syncing';
    onProgress?.(item);

    try {
      // 检查是否存在冲突
      const conflict = this.detectConflict(item);
      if (conflict) {
        item.status = 'conflict';
        return { success: false, conflict };
      }

      // 根据同步方向执行操作
      const result = await this.performSync(item, localData);
      
      item.status = 'success';
      onProgress?.(item);
      
      return { success: true, updatedData: result };
    } catch (error: any) {
      item.status = 'error';
      item.error = error.message;
      onProgress?.(item);
      
      return { success: false };
    }
  }

  /**
   * 检测同步冲突
   */
  private detectConflict(item: SyncItem): SyncConflict | null {
    // 如果本地和远程都有修改时间，且都比较新，则可能存在冲突
    if (item.localModified && item.remoteModified) {
      const timeDiff = Math.abs(
        item.localModified.getTime() - item.remoteModified.getTime()
      );
      
      // 如果时间差小于1分钟，认为可能同时修改
      if (timeDiff < 60000) {
        return {
          item,
          localData: null, // 需要外部传入
          remoteData: null, // 需要外部传入
          type: 'modified',
        };
      }
    }

    return null;
  }

  /**
   * 执行同步操作
   */
  private async performSync(item: SyncItem, localData: any): Promise<any> {
    const shouldUpload = this.shouldUpload(item);
    const shouldDownload = this.shouldDownload(item);

    console.log('同步决策:', {
      item: item.name,
      shouldUpload,
      shouldDownload,
      direction: item.direction,
      hasRemoteModified: !!item.remoteModified,
    });

    if (shouldUpload && shouldDownload) {
      // 双向同步：优先上传本地数据
      console.log('执行双向同步 - 上传本地数据');
      await this.uploadData(item, localData);
      return localData;
    } else if (shouldUpload) {
      // 仅上传
      console.log('执行上传操作');
      await this.uploadData(item, localData);
      return localData;
    } else if (shouldDownload) {
      // 仅下载
      console.log('执行下载操作');
      return await this.downloadData(item);
    }

    console.log('跳过同步操作');
    return localData;
  }

  /**
   * 判断是否需要上传
   */
  private shouldUpload(item: SyncItem): boolean {
    if (item.direction === 'download') return false;
    
    // 如果远程没有文件，需要上传
    if (!item.remoteModified) return true;
    
    // 如果本地更新，需要上传
    if (item.localModified && item.remoteModified) {
      return item.localModified > item.remoteModified;
    }
    
    return item.direction === 'upload' || item.direction === 'bidirectional';
  }

  /**
   * 判断是否需要下载
   */
  private shouldDownload(item: SyncItem): boolean {
    if (item.direction === 'upload') return false;
    
    // 如果远程有更新，需要下载
    if (item.localModified && item.remoteModified) {
      return item.remoteModified > item.localModified;
    }
    
    return item.direction === 'download' || item.direction === 'bidirectional';
  }

  /**
   * 上传数据
   */
  private async uploadData(item: SyncItem, data: any): Promise<void> {
    switch (item.type) {
      case 'bookmark':
        await this.dataOps.uploadBookmarks(data);
        break;
      case 'category':
        await this.dataOps.uploadCategories(data);
        break;
      case 'settings':
        await this.dataOps.uploadSettings(data);
        break;
    }
  }

  /**
   * 下载数据
   */
  private async downloadData(item: SyncItem): Promise<any> {
    switch (item.type) {
      case 'bookmark':
        return await this.dataOps.downloadBookmarks();
      case 'category':
        return await this.dataOps.downloadCategories();
      case 'settings':
        return await this.dataOps.downloadSettings();
      default:
        return null;
    }
  }
}
