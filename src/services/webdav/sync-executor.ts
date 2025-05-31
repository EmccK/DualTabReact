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
      
      // 如果时间差小于3分钟，认为可能存在并发修改
      // 缩短到3分钟，减少误报，但仍能捕获真正的并发场景
      if (timeDiff < 3 * 60000) {
        console.log(`${item.name}: 检测到潜在冲突`, {
          localTime: item.localModified.toISOString(),
          remoteTime: item.remoteModified.toISOString(),
          timeDiff: timeDiff / 1000 + '秒'
        });
        
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
   * 执行同步操作 - 带重试和冲突检测
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
      // 上传前先检查远程是否有新变化（防止并发覆盖）
      console.log('执行上传操作 - 检查并发冲突');
      return await this.safeUpload(item, localData);
    } else if (shouldDownload) {
      // 仅下载
      console.log('执行下载操作');
      const downloadedData = await this.downloadData(item);
      console.log('下载完成，数据:', {
        type: item.type,
        isArray: Array.isArray(downloadedData),
        length: downloadedData?.length,
        data: downloadedData
      });
      return downloadedData;
    }

    console.log('跳过同步操作');
    return localData;
  }

  /**
   * 安全上传 - 上传前再次检查远程状态
   */
  private async safeUpload(item: SyncItem, localData: any): Promise<any> {
    try {
      // 上传前再次获取远程文件时间
      const currentRemoteTime = await this.dataOps.getFileLastModified(this.getFileName(item.type));
      
      // 检查是否有其他设备在同步期间更新了文件
      if (currentRemoteTime && item.remoteModified) {
        const timeDiff = currentRemoteTime.getTime() - item.remoteModified.getTime();
        
        if (timeDiff > 1000) { // 如果远程文件在1秒内有更新
          console.log(`${item.name}: 检测到并发上传，远程文件已更新`, {
            原始远程时间: item.remoteModified.toISOString(),
            当前远程时间: currentRemoteTime.toISOString(),
            时间差: timeDiff / 1000 + '秒'
          });
          
          // 下载最新的远程数据而不是上传本地数据
          console.log(`${item.name}: 改为下载最新远程数据`);
          return await this.downloadData(item);
        }
      }
      
      // 没有并发冲突，正常上传
      await this.uploadData(item, localData);
      return localData;
      
    } catch (error) {
      console.warn(`${item.name}: 安全上传检查失败，使用常规上传:`, error);
      // 如果检查失败，回退到常规上传
      await this.uploadData(item, localData);
      return localData;
    }
  }

  /**
   * 根据类型获取文件名
   */
  private getFileName(type: string): string {
    switch (type) {
      case 'bookmark': return 'bookmarks.json';
      case 'category': return 'categories.json';
      case 'settings': return 'settings.json';
      default: return `${type}.json`;
    }
  }

  /**
   * 判断是否需要上传
   */
  private shouldUpload(item: SyncItem): boolean {
    if (item.direction === 'download') return false;
    
    // 如果远程没有文件，需要上传
    if (!item.remoteModified) {
      console.log(`${item.name}: 没有远程文件，需要上传`);
      return true;
    }
    
    // 如果本地更新，需要上传
    if (item.localModified && item.remoteModified) {
      const shouldUpload = item.localModified > item.remoteModified;
      console.log(`${item.name}: 时间比较上传决策`, {
        localModified: item.localModified.toISOString(),
        remoteModified: item.remoteModified.toISOString(),
        shouldUpload
      });
      return shouldUpload;
    }
    
    const result = item.direction === 'upload' || item.direction === 'bidirectional';
    console.log(`${item.name}: 方向决策上传`, { direction: item.direction, result });
    return result;
  }

  /**
   * 判断是否需要下载
   */
  private shouldDownload(item: SyncItem): boolean {
    if (item.direction === 'upload') return false;
    
    // 如果没有远程文件，不能下载
    if (!item.remoteModified) {
      console.log(`${item.name}: 没有远程文件，跳过下载`);
      return false;
    }
    
    // 如果远程有更新，需要下载
    if (item.localModified && item.remoteModified) {
      const shouldDownload = item.remoteModified > item.localModified;
      console.log(`${item.name}: 时间比较下载决策`, {
        localModified: item.localModified.toISOString(),
        remoteModified: item.remoteModified.toISOString(),
        shouldDownload
      });
      return shouldDownload;
    }
    
    // 对于纯下载方向，只有在有远程文件时才下载
    const result = item.direction === 'download';
    console.log(`${item.name}: 方向决策下载`, { direction: item.direction, result });
    return result;
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
