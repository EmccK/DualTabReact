/**
 * WebDAV同步相关类型定义
 */

export type SyncStatus = 
  | 'idle'          // 空闲状态
  | 'syncing'       // 同步中
  | 'success'       // 同步成功
  | 'error'         // 同步错误
  | 'conflict';     // 存在冲突

export type SyncDirection = 
  | 'upload'        // 上传到服务器
  | 'download'      // 从服务器下载
  | 'bidirectional'; // 双向同步

export interface SyncProgress {
  /** 当前状态 */
  status: SyncStatus;
  /** 总项目数 */
  total: number;
  /** 已完成数 */
  completed: number;
  /** 当前处理的项目 */
  current?: string;
  /** 开始时间 */
  startTime: Date;
  /** 预估剩余时间（毫秒） */
  estimatedTime?: number;
  /** 错误信息 */
  error?: string;
}

export interface SyncItem {
  /** 项目ID */
  id: string;
  /** 项目名称 */
  name: string;
  /** 项目类型 */
  type: 'bookmark' | 'category' | 'settings';
  /** 本地修改时间 */
  localModified: Date;
  /** 远程修改时间 */
  remoteModified?: Date;
  /** 同步状态 */
  status: 'pending' | 'syncing' | 'success' | 'error' | 'conflict';
  /** 同步方向 */
  direction: SyncDirection;
  /** 错误信息 */
  error?: string;
}

export interface SyncConflict {
  /** 冲突项目 */
  item: SyncItem;
  /** 本地数据 */
  localData: any;
  /** 远程数据 */
  remoteData: any;
  /** 冲突类型 */
  type: 'modified' | 'deleted' | 'created';
  /** 解决策略 */
  resolution?: 'local' | 'remote' | 'merge' | 'skip';
}

export interface SyncHistory {
  /** 同步ID */
  id: string;
  /** 同步时间 */
  timestamp: Date;
  /** 同步状态 */
  status: SyncStatus;
  /** 同步项目数量 */
  itemCount: number;
  /** 耗时（毫秒） */
  duration: number;
  /** 错误信息 */
  error?: string;
  /** 冲突数量 */
  conflictCount?: number;
}
