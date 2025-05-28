/**
 * WebDAV客户端相关类型定义
 */

export interface WebDAVResponse<T = any> {
  /** 响应状态码 */
  status: number;
  /** 响应状态文本 */
  statusText: string;
  /** 响应数据 */
  data: T;
  /** 响应头 */
  headers: Record<string, string>;
  /** 请求是否成功 */
  success: boolean;
}

export interface WebDAVFile {
  /** 文件名 */
  name: string;
  /** 文件路径 */
  path: string;
  /** 文件大小（字节） */
  size: number;
  /** 是否为目录 */
  isDirectory: boolean;
  /** 最后修改时间 */
  lastModified: Date;
  /** 创建时间 */
  created?: Date;
  /** MIME类型 */
  mimeType?: string;
  /** ETag */
  etag?: string;
}

export interface WebDAVDirectory {
  /** 目录名 */
  name: string;
  /** 目录路径 */
  path: string;
  /** 子文件列表 */
  files: WebDAVFile[];
  /** 子目录列表 */
  directories: WebDAVDirectory[];
  /** 最后修改时间 */
  lastModified: Date;
}

export interface WebDAVRequestOptions {
  /** 请求方法 */
  method: 'GET' | 'PUT' | 'POST' | 'DELETE' | 'PROPFIND' | 'MKCOL';
  /** 请求路径 */
  path: string;
  /** 请求体 */
  body?: string | ArrayBuffer | FormData;
  /** 请求头 */
  headers?: Record<string, string>;
  /** 查询参数 */
  params?: Record<string, string>;
  /** 超时时间 */
  timeout?: number;
}

export interface WebDAVConnectionStatus {
  /** 是否已连接 */
  connected: boolean;
  /** 连接时间 */
  connectedAt?: Date;
  /** 最后活动时间 */
  lastActivity?: Date;
  /** 连接错误 */
  error?: WebDAVError;
}

export interface WebDAVError {
  /** 错误代码 */
  code: string;
  /** 错误消息 */
  message: string;
  /** HTTP状态码 */
  status?: number;
  /** 详细错误信息 */
  details?: any;
  /** 发生时间 */
  timestamp: Date;
}
