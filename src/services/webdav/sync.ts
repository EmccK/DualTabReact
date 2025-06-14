/**
 * WebDAV同步核心逻辑模块
 * 处理数据上传、下载、冲突检测和解决
 */

import { WebDAVClient } from './client';
import type { 
  WebDAVConfig, 
  SyncResult, 
  SyncDataPackage, 
  DeviceInfo,
  ConflictResolution 
} from './types';
import { 
  SYNC_FILES, 
  ERROR_MESSAGES, 
  SUCCESS_MESSAGES, 
} from './constants';
import { 
  createSyncDataPackage, 
  createDeviceInfo, 
  validateSyncDataPackage,
  validateCategoriesData,
  validateBookmarksData,
  repairMetadata
} from './metadata';
import { 
  detectConflict, 
  resolveConflict, 
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
      // 步骤1: 测试连接
      this.updateSyncState('测试连接', 10);
      const connectionOk = await this.client.testConnection();
      if (!connectionOk) {
        throw new Error(ERROR_MESSAGES.NETWORK_ERROR);
      }

      // 步骤2: 确保同步目录存在
      this.updateSyncState('准备同步目录', 20);
      const syncDirExists = await this.client.ensureSyncDirectory();
      if (!syncDirExists) {
        throw new Error('无法创建同步目录，请检查WebDAV服务器设置和权限');
      }

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
      currentStep: '初始化上传',
      progress: 0,
    };

    try {
      // 步骤1: 测试连接
      this.updateSyncState('测试连接', 10);
      const connectionOk = await this.client.testConnection();
      if (!connectionOk) {
        throw new Error(ERROR_MESSAGES.NETWORK_ERROR);
      }

      // 步骤2: 确保同步目录存在
      this.updateSyncState('准备同步目录', 20);
      const syncDirExists = await this.client.ensureSyncDirectory();
      if (!syncDirExists) {
        throw new Error('无法创建同步目录，请检查WebDAV服务器设置和权限');
      }
      
      // 步骤3: 准备数据
      this.updateSyncState('准备上传数据', 40);
      const dataPackage = await createSyncDataPackage(
        localData.categories,
        localData.bookmarks,
        localData.settings,
        this.device
      );

      // 步骤4: 创建备份（如果需要）
      if (options.createBackup) {
        this.updateSyncState('创建备份', 60);
        try {
          await this.createBackup(dataPackage);
        } catch (backupError) {
          // 备份失败不影响主要上传流程，但记录警告
          console.warn('备份创建失败:', backupError);
        }
      }

      // 步骤5: 上传数据
      this.updateSyncState('上传数据', 80);
      await this.uploadDataPackage(dataPackage);

      this.updateSyncState('上传完成', 100);
      return {
        status: 'success',
        message: SUCCESS_MESSAGES.UPLOAD_SUCCESS,
        timestamp: Date.now(),
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : ERROR_MESSAGES.SERVER_ERROR;
      return {
        status: 'error',
        error: errorMessage,
        timestamp: Date.now(),
      };
    } finally {
      this.syncState.isRunning = false;
    }
  }

  /**
   * 仅下载数据
   */
  async download(): Promise<SyncResult & { data?: SyncDataPackage }> {
    try {
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
  }

  /**
   * 下载远程数据
   */
  private async downloadRemoteData(): Promise<SyncDataPackage | null> {
    try {
      const dataExists = await this.client.exists(`/${SYNC_FILES.DATA}`);
      if (!dataExists) {
        return null;
      }

      const fileContent = await this.client.getFile(`/${SYNC_FILES.DATA}`);
      if (typeof fileContent !== 'string') {
        throw new Error(ERROR_MESSAGES.INVALID_RESPONSE);
      }

      const dataPackage = JSON.parse(fileContent);
      
      if (!validateSyncDataPackage(dataPackage)) {
        // 尝试修复数据包
        let needsRepair = false;
        
        // 检查各部分数据是否有效
        if (!validateCategoriesData(dataPackage.categories || [])) {
          console.warn('Categories data validation failed, using empty array');
          dataPackage.categories = [];
          needsRepair = true;
        }
        
        if (!validateBookmarksData(dataPackage.bookmarks || [])) {
          console.warn('Bookmarks data validation failed, using empty array');
          dataPackage.bookmarks = [];
          needsRepair = true;
        }
        
        if (needsRepair) {
          const repairedMetadata = await repairMetadata(
            {
              categories: dataPackage.categories,
              bookmarks: dataPackage.bookmarks,
              settings: dataPackage.settings || {},
            },
            this.device,
            dataPackage.metadata
          );
          
          dataPackage.metadata = repairedMetadata;
        }
        
        if (!validateSyncDataPackage(dataPackage)) {
          throw new Error(ERROR_MESSAGES.METADATA_INVALID);
        }
      }

      return dataPackage;
    } catch (error) {
      throw error;
    }
  }

  /**
   * 上传数据包
   */
  private async uploadDataPackage(dataPackage: SyncDataPackage): Promise<void> {
    try {
      // 确保同步目录存在
      const syncDirExists = await this.client.ensureSyncDirectory();
      if (!syncDirExists) {
        throw new Error('无法创建同步目录，请检查WebDAV服务器设置和权限');
      }
      
      const content = JSON.stringify(dataPackage, null, 2);
      const uploadSuccess = await this.client.putFile(`/${SYNC_FILES.DATA}`, content, 'application/json');
      
      if (!uploadSuccess) {
        throw new Error('文件上传失败，请检查WebDAV服务器连接和权限');
      }
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : ERROR_MESSAGES.SERVER_ERROR;
      throw new Error(errorMessage);
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
      
      const backupSuccess = await this.client.putFile(`/${backupFileName}`, content, 'application/json');
      if (!backupSuccess) {
        throw new Error('备份文件上传失败');
      }
      
    } catch (error) {
      // 备份失败不影响主要同步流程，但应该抛出错误以便调用者处理
      throw error;
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
        }
      }
    } catch (error) {
    }
  }

  /**
   * 测试WebDAV连接
   */
  async testConnection(): Promise<boolean> {
    try {
      return await this.client.testConnection();
    } catch {
      return false;
    }
  }

  /**
   * 获取远程文件列表
   */
  async listRemoteFiles(): Promise<any[]> {
    try {
      return await this.client.listDirectory('/');
    } catch {
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
