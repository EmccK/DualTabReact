/**
 * WebDAV同步核心逻辑模块
 * 处理数据上传、下载、冲突检测和解决
 */

import { WebDAVClient } from './client';
import type { 
  WebDAVConfig, 
  SyncResult, 
  SyncDataPackage, 
  SyncMetadata,
  DeviceInfo,
  ConflictResolution 
} from './types';
import { 
  SYNC_FILES, 
  ERROR_MESSAGES, 
  SUCCESS_MESSAGES, 
  DEBUG_ENABLED 
} from './constants';
import { 
  createSyncDataPackage, 
  createDeviceInfo, 
  validateSyncDataPackage,
  repairMetadata,
  getMetadataSummary 
} from './metadata';
import { 
  detectConflict, 
  resolveConflict, 
  getRecommendedResolution,
  autoResolveConflict 
} from './conflict-resolver';

/**
 * 同步选项
 */
export interface SyncOptions {
  /** 强制上传（忽略冲突） */
  forceUpload?: boolean;
  /** 强制下载（忽略冲突） */
  forceDownload?: boolean;
  /** 自动解决冲突 */
  autoResolveConflicts?: boolean;
  /** 创建备份 */
  createBackup?: boolean;
  /** 冲突解决策略 */
  conflictResolution?: ConflictResolution;
}

/**
 * 同步状态跟踪
 */
interface SyncState {
  isRunning: boolean;
  startTime: number;
  currentStep: string;
  progress: number;
}

/**
 * WebDAV同步服务
 */
export class WebDAVSyncService {
  private client: WebDAVClient;
  private device: DeviceInfo;
  private syncState: SyncState;

  constructor(config: WebDAVConfig) {
    this.client = new WebDAVClient(config);
    this.device = createDeviceInfo();
    this.syncState = {
      isRunning: false,
      startTime: 0,
      currentStep: '',
      progress: 0,
    };
  }

  /**
   * 更新配置
   */
  updateConfig(config: WebDAVConfig): void {
    this.client.updateConfig(config);
  }

  /**
   * 获取同步状态
   */
  getSyncState(): SyncState {
    return { ...this.syncState };
  }

  /**
   * 执行完整同步
   */
  async sync(
    localData: { categories: any[]; bookmarks: any[]; settings: any },
    options: SyncOptions = {}
  ): Promise<SyncResult> {
    if (this.syncState.isRunning) {
      return {
        status: 'error',
        error: ERROR_MESSAGES.SYNC_IN_PROGRESS,
        timestamp: Date.now(),
      };
    }

    this.syncState = {
      isRunning: true,
      startTime: Date.now(),
      currentStep: '初始化同步',
      progress: 0,
    };

    try {
      if (DEBUG_ENABLED) {
        console.log('[WebDAV Sync] Starting sync with options:', options);
      }

      // 步骤1: 测试连接
      this.updateSyncState('测试连接', 10);
      const connectionOk = await this.client.testConnection();
      if (!connectionOk) {
        throw new Error(ERROR_MESSAGES.NETWORK_ERROR);
      }

      // 步骤2: 确保同步目录存在
      this.updateSyncState('准备同步目录', 20);
      await this.client.ensureDirectory('/');

      // 步骤3: 创建本地数据包
      this.updateSyncState('准备本地数据', 30);
      const localDataPackage = await createSyncDataPackage(
        localData.categories,
        localData.bookmarks,
        localData.settings,
        this.device
      );

      // 步骤4: 下载远程数据
      this.updateSyncState('下载远程数据', 40);
      const remoteDataPackage = await this.downloadRemoteData();

      // 步骤5: 检测冲突
      this.updateSyncState('检测数据冲突', 60);
      const conflictResult = await detectConflict(localDataPackage, remoteDataPackage);

      // 步骤6: 处理冲突或直接同步
      if (conflictResult.hasConflict) {
        this.updateSyncState('解决数据冲突', 70);
        const result = await this.handleConflict(
          conflictResult,
          localDataPackage,
          remoteDataPackage,
          options
        );
        return result;
      } else {
        this.updateSyncState('同步数据', 80);
        const result = await this.performSync(
          conflictResult,
          localDataPackage,
          remoteDataPackage,
          options
        );
        return result;
      }
    } catch (error) {
      if (DEBUG_ENABLED) {
        console.error('[WebDAV Sync] Sync failed:', error);
      }
      
      return {
        status: 'error',
        error: error instanceof Error ? error.message : ERROR_MESSAGES.NETWORK_ERROR,
        timestamp: Date.now(),
      };
    } finally {
      this.syncState.isRunning = false;
    }
  }

  /**
   * 仅上传数据
   */
  async upload(
    localData: { categories: any[]; bookmarks: any[]; settings: any },
    options: SyncOptions = {}
  ): Promise<SyncResult> {
    try {
      if (DEBUG_ENABLED) {
        console.log('[WebDAV Sync] Starting upload');
      }

      this.updateSyncState('上传数据', 50);
      
      const dataPackage = await createSyncDataPackage(
        localData.categories,
        localData.bookmarks,
        localData.settings,
        this.device
      );

      if (options.createBackup) {
        await this.createBackup(dataPackage);
      }

      await this.uploadDataPackage(dataPackage);

      return {
        status: 'success',
        message: SUCCESS_MESSAGES.UPLOAD_SUCCESS,
        timestamp: Date.now(),
      };
    } catch (error) {
      return {
        status: 'error',
        error: error instanceof Error ? error.message : ERROR_MESSAGES.SERVER_ERROR,
        timestamp: Date.now(),
      };
    }
  }

  /**
   * 仅下载数据
   */
  async download(): Promise<SyncResult & { data?: SyncDataPackage }> {
    try {
      if (DEBUG_ENABLED) {
        console.log('[WebDAV Sync] Starting download');
      }

      this.updateSyncState('下载数据', 50);
      
      const remoteDataPackage = await this.downloadRemoteData();
      if (!remoteDataPackage) {
        return {
          status: 'error',
          error: ERROR_MESSAGES.FILE_NOT_FOUND,
          timestamp: Date.now(),
        };
      }

      return {
        status: 'success',
        message: SUCCESS_MESSAGES.DOWNLOAD_SUCCESS,
        timestamp: Date.now(),
        data: remoteDataPackage,
      };
    } catch (error) {
      return {
        status: 'error',
        error: error instanceof Error ? error.message : ERROR_MESSAGES.SERVER_ERROR,
        timestamp: Date.now(),
      };
    }
  }

  /**
   * 更新同步状态
   */
  private updateSyncState(step: string, progress: number): void {
    this.syncState.currentStep = step;
    this.syncState.progress = progress;
    
    if (DEBUG_ENABLED) {
      console.log(`[WebDAV Sync] ${step} (${progress}%)`);
    }
  }

  /**
   * 下载远程数据
   */
  private async downloadRemoteData(): Promise<SyncDataPackage | null> {
    try {
      const dataExists = await this.client.exists(`/${SYNC_FILES.DATA}`);
      if (!dataExists) {
        if (DEBUG_ENABLED) {
          console.log('[WebDAV Sync] No remote data file found');
        }
        return null;
      }

      const fileContent = await this.client.getFile(`/${SYNC_FILES.DATA}`);
      if (typeof fileContent !== 'string') {
        throw new Error(ERROR_MESSAGES.INVALID_RESPONSE);
      }

      const dataPackage = JSON.parse(fileContent);
      
      if (!validateSyncDataPackage(dataPackage)) {
        if (DEBUG_ENABLED) {
          console.warn('[WebDAV Sync] Invalid remote data package, attempting repair');
        }
        
        // 尝试修复数据包
        const repairedMetadata = await repairMetadata(
          {
            categories: dataPackage.categories || [],
            bookmarks: dataPackage.bookmarks || [],
            settings: dataPackage.settings || {},
          },
          this.device,
          dataPackage.metadata
        );
        
        dataPackage.metadata = repairedMetadata;
        
        if (!validateSyncDataPackage(dataPackage)) {
          throw new Error(ERROR_MESSAGES.METADATA_INVALID);
        }
      }

      if (DEBUG_ENABLED) {
        console.log('[WebDAV Sync] Downloaded remote data:', getMetadataSummary(dataPackage.metadata));
      }

      return dataPackage;
    } catch (error) {
      if (DEBUG_ENABLED) {
        console.error('[WebDAV Sync] Failed to download remote data:', error);
      }
      throw error;
    }
  }

  /**
   * 上传数据包
   */
  private async uploadDataPackage(dataPackage: SyncDataPackage): Promise<void> {
    try {
      const content = JSON.stringify(dataPackage, null, 2);
      await this.client.putFile(`/${SYNC_FILES.DATA}`, content, 'application/json');
      
      if (DEBUG_ENABLED) {
        console.log('[WebDAV Sync] Uploaded data package:', getMetadataSummary(dataPackage.metadata));
      }
    } catch (error) {
      if (DEBUG_ENABLED) {
        console.error('[WebDAV Sync] Failed to upload data package:', error);
      }
      throw error;
    }
  }

  /**
   * 创建备份
   */
  private async createBackup(dataPackage: SyncDataPackage): Promise<void> {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupFileName = `${SYNC_FILES.BACKUP_PREFIX}${timestamp}.json`;
      const content = JSON.stringify(dataPackage, null, 2);
      
      await this.client.putFile(`/${backupFileName}`, content, 'application/json');
      
      if (DEBUG_ENABLED) {
        console.log('[WebDAV Sync] Created backup:', backupFileName);
      }
    } catch (error) {
      if (DEBUG_ENABLED) {
        console.warn('[WebDAV Sync] Failed to create backup:', error);
      }
      // 备份失败不影响主要同步流程
    }
  }

  /**
   * 处理冲突
   */
  private async handleConflict(
    conflictResult: any,
    localDataPackage: SyncDataPackage | null,
    remoteDataPackage: SyncDataPackage | null,
    options: SyncOptions
  ): Promise<SyncResult> {
    if (!conflictResult.conflictInfo) {
      throw new Error('冲突信息缺失');
    }

    let resolution: ConflictResolution;
    
    if (options.conflictResolution) {
      resolution = options.conflictResolution;
    } else if (options.autoResolveConflicts) {
      resolution = autoResolveConflict(conflictResult.conflictInfo);
    } else {
      resolution = 'manual';
    }

    if (resolution === 'manual') {
      return {
        status: 'conflict',
        message: ERROR_MESSAGES.SYNC_CONFLICT,
        timestamp: Date.now(),
        hasConflict: true,
        conflictInfo: conflictResult.conflictInfo,
      };
    }

    try {
      const resolvedDataPackage = await resolveConflict(
        conflictResult.conflictInfo,
        resolution,
        this.device
      );

      if (options.createBackup && remoteDataPackage) {
        await this.createBackup(remoteDataPackage);
      }

      await this.uploadDataPackage(resolvedDataPackage);

      return {
        status: 'success',
        message: SUCCESS_MESSAGES.SYNC_SUCCESS,
        timestamp: Date.now(),
      };
    } catch (error) {
      return {
        status: 'error',
        error: error instanceof Error ? error.message : ERROR_MESSAGES.SYNC_CONFLICT,
        timestamp: Date.now(),
      };
    }
  }

  /**
   * 执行同步（无冲突情况）
   */
  private async performSync(
    conflictResult: any,
    localDataPackage: SyncDataPackage | null,
    remoteDataPackage: SyncDataPackage | null,
    options: SyncOptions
  ): Promise<SyncResult> {
    try {
      if (conflictResult.shouldUseLocal && localDataPackage) {
        // 上传本地数据
        if (options.createBackup && remoteDataPackage) {
          await this.createBackup(remoteDataPackage);
        }
        await this.uploadDataPackage(localDataPackage);
        
        return {
          status: 'success',
          message: SUCCESS_MESSAGES.UPLOAD_SUCCESS,
          timestamp: Date.now(),
        };
      } else if (conflictResult.shouldUseRemote && remoteDataPackage) {
        // 下载数据的处理由调用方负责，这里只返回结果
        return {
          status: 'success',
          message: SUCCESS_MESSAGES.DOWNLOAD_SUCCESS,
          timestamp: Date.now(),
          data: remoteDataPackage,
        } as SyncResult & { data: SyncDataPackage };
      } else {
        // 无需同步
        return {
          status: 'success',
          message: '数据已是最新',
          timestamp: Date.now(),
        };
      }
    } catch (error) {
      return {
        status: 'error',
        error: error instanceof Error ? error.message : ERROR_MESSAGES.SERVER_ERROR,
        timestamp: Date.now(),
      };
    } finally {
      this.updateSyncState('同步完成', 100);
    }
  }

  /**
   * 清理旧备份文件
   */
  async cleanupBackups(retentionDays: number = 7): Promise<void> {
    try {
      const files = await this.client.listDirectory('/');
      const backupFiles = files.filter(file => 
        file.name.startsWith(SYNC_FILES.BACKUP_PREFIX)
      );

      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

      for (const file of backupFiles) {
        if (file.lastModified < cutoffDate) {
          await this.client.delete(file.path);
          if (DEBUG_ENABLED) {
            console.log('[WebDAV Sync] Cleaned up old backup:', file.name);
          }
        }
      }
    } catch (error) {
      if (DEBUG_ENABLED) {
        console.warn('[WebDAV Sync] Failed to cleanup backups:', error);
      }
    }
  }

  /**
   * 测试WebDAV连接
   */
  async testConnection(): Promise<boolean> {
    try {
      return await this.client.testConnection();
    } catch (error) {
      return false;
    }
  }

  /**
   * 获取远程文件列表
   */
  async listRemoteFiles(): Promise<any[]> {
    try {
      return await this.client.listDirectory('/');
    } catch (error) {
      return [];
    }
  }

  /**
   * 获取设备信息
   */
  getDeviceInfo(): DeviceInfo {
    return { ...this.device };
  }
}

/**
 * 创建WebDAV同步服务实例
 */
export function createWebDAVSyncService(config: WebDAVConfig): WebDAVSyncService {
  return new WebDAVSyncService(config);
}
