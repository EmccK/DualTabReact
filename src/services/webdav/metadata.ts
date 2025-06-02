/**
 * 同步元数据管理模块
 * 处理同步时间戳、数据哈希、设备信息等元数据
 */

import type { SyncMetadata, DeviceInfo, SyncDataPackage } from './types';
import { SYNC_CONSTANTS, DEVICE_PLATFORMS, BROWSERS, DEBUG_ENABLED } from './constants';

/**
 * 生成数据哈希
 */
export async function generateDataHash(data: any): Promise<string> {
  try {
    const jsonString = JSON.stringify(data, Object.keys(data).sort());
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(jsonString);
    
    const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    
    return hashHex;
  } catch (error) {
    // 降级到简单哈希
    console.warn('[Metadata] Failed to generate crypto hash, using fallback:', error);
    return simpleHash(JSON.stringify(data));
  }
}

/**
 * 简单哈希算法（降级方案）
 */
function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // 转换为32位整数
  }
  return Math.abs(hash).toString(16);
}

/**
 * 生成设备ID
 */
export function generateDeviceId(): string {
  // 使用浏览器指纹信息生成相对稳定的设备ID
  const screenSize = (typeof screen !== 'undefined') 
    ? `${screen.width}x${screen.height}` 
    : 'unknown';
    
  const fingerprint = [
    navigator.userAgent,
    navigator.language,
    screenSize,
    new Date().getTimezoneOffset(),
    navigator.hardwareConcurrency || 'unknown',
  ].join('|');
  
  return 'device_' + simpleHash(fingerprint);
}

/**
 * 获取设备平台信息
 */
export function getDevicePlatform(): string {
  const userAgent = navigator.userAgent.toLowerCase();
  
  if (userAgent.includes('windows')) return DEVICE_PLATFORMS.WINDOWS;
  if (userAgent.includes('mac')) return DEVICE_PLATFORMS.MACOS;
  if (userAgent.includes('linux')) return DEVICE_PLATFORMS.LINUX;
  if (userAgent.includes('android')) return DEVICE_PLATFORMS.ANDROID;
  if (userAgent.includes('iphone') || userAgent.includes('ipad')) return DEVICE_PLATFORMS.IOS;
  if (userAgent.includes('cros')) return DEVICE_PLATFORMS.CHROME_OS;
  
  return DEVICE_PLATFORMS.UNKNOWN;
}

/**
 * 获取浏览器信息
 */
export function getBrowserInfo(): string {
  const userAgent = navigator.userAgent.toLowerCase();
  
  if (userAgent.includes('chrome') && !userAgent.includes('edge')) return BROWSERS.CHROME;
  if (userAgent.includes('firefox')) return BROWSERS.FIREFOX;
  if (userAgent.includes('safari') && !userAgent.includes('chrome')) return BROWSERS.SAFARI;
  if (userAgent.includes('edge')) return BROWSERS.EDGE;
  if (userAgent.includes('opera')) return BROWSERS.OPERA;
  
  return BROWSERS.UNKNOWN;
}

/**
 * 生成设备名称
 */
export function generateDeviceName(): string {
  const platform = getDevicePlatform();
  const browser = getBrowserInfo();
  const hostname = (typeof window !== 'undefined' && window.location) 
    ? window.location.hostname || 'unknown' 
    : 'extension';
  
  return `${platform} - ${browser} (${hostname})`;
}

/**
 * 创建设备信息
 */
export function createDeviceInfo(): DeviceInfo {
  const now = Date.now();
  
  return {
    id: generateDeviceId(),
    name: generateDeviceName(),
    browser: getBrowserInfo(),
    platform: getDevicePlatform(),
    createdAt: now,
    lastActiveAt: now,
  };
}

/**
 * 创建同步元数据
 */
export async function createSyncMetadata(
  data: any,
  deviceId: string,
  remoteTimestamp?: number
): Promise<SyncMetadata> {
  const now = Date.now();
  const dataHash = await generateDataHash(data);
  
  return {
    lastSyncTime: now,
    localTimestamp: now,
    remoteTimestamp: remoteTimestamp || now,
    dataHash,
    version: SYNC_CONSTANTS.DATA_VERSION,
    deviceId,
  };
}

/**
 * 验证元数据完整性
 */
export function validateMetadata(metadata: any): metadata is SyncMetadata {
  if (!metadata || typeof metadata !== 'object') {
    return false;
  }

  const requiredFields = [
    'lastSyncTime',
    'localTimestamp', 
    'remoteTimestamp',
    'dataHash',
    'version',
    'deviceId'
  ];

  for (const field of requiredFields) {
    if (!(field in metadata)) {
      return false;
    }
  }

  // 类型检查
  if (typeof metadata.lastSyncTime !== 'number' || metadata.lastSyncTime <= 0) {
    return false;
  }
  
  if (typeof metadata.localTimestamp !== 'number' || metadata.localTimestamp <= 0) {
    return false;
  }
  
  if (typeof metadata.remoteTimestamp !== 'number' || metadata.remoteTimestamp <= 0) {
    return false;
  }
  
  if (typeof metadata.dataHash !== 'string' || metadata.dataHash.length === 0) {
    return false;
  }
  
  if (typeof metadata.version !== 'string' || metadata.version.length === 0) {
    return false;
  }
  
  if (typeof metadata.deviceId !== 'string' || metadata.deviceId.length === 0) {
    return false;
  }

  return true;
}

/**
 * 验证设备信息
 */
export function validateDeviceInfo(device: any): device is DeviceInfo {
  if (!device || typeof device !== 'object') {
    return false;
  }

  const requiredFields = ['id', 'name', 'browser', 'platform', 'createdAt', 'lastActiveAt'];
  
  for (const field of requiredFields) {
    if (!(field in device)) {
      return false;
    }
  }

  return (
    typeof device.id === 'string' &&
    typeof device.name === 'string' &&
    typeof device.browser === 'string' &&
    typeof device.platform === 'string' &&
    typeof device.createdAt === 'number' &&
    typeof device.lastActiveAt === 'number'
  );
}

/**
 * 检查数据完整性
 */
export async function verifyDataIntegrity(data: any, expectedHash: string): Promise<boolean> {
  try {
    const actualHash = await generateDataHash(data);
    return actualHash === expectedHash;
  } catch (error) {
    if (DEBUG_ENABLED) {
      console.error('[Metadata] Failed to verify data integrity:', error);
    }
    return false;
  }
}

/**
 * 创建同步数据包
 */
export async function createSyncDataPackage(
  categories: any[],
  bookmarks: any[],
  settings: any,
  device: DeviceInfo
): Promise<SyncDataPackage> {
  const now = Date.now();
  
  // 合并所有数据用于计算哈希
  const allData = { categories, bookmarks, settings };
  const metadata = await createSyncMetadata(allData, device.id);
  
  return {
    metadata,
    device: {
      ...device,
      lastActiveAt: now,
    },
    categories,
    bookmarks,
    settings,
    version: SYNC_CONSTANTS.DATA_VERSION,
    createdAt: now,
  };
}

/**
 * 验证同步数据包
 */
export function validateSyncDataPackage(dataPackage: any): dataPackage is SyncDataPackage {
  if (!dataPackage || typeof dataPackage !== 'object') {
    return false;
  }

  const requiredFields = [
    'metadata',
    'device',
    'categories',
    'bookmarks',
    'settings',
    'version',
    'createdAt'
  ];

  for (const field of requiredFields) {
    if (!(field in dataPackage)) {
      return false;
    }
  }

  return (
    validateMetadata(dataPackage.metadata) &&
    validateDeviceInfo(dataPackage.device) &&
    Array.isArray(dataPackage.categories) &&
    Array.isArray(dataPackage.bookmarks) &&
    typeof dataPackage.settings === 'object' &&
    typeof dataPackage.version === 'string' &&
    typeof dataPackage.createdAt === 'number'
  );
}

/**
 * 检查是否为新设备的首次同步
 */
export function isFirstTimeSync(localData: any, remoteData?: SyncDataPackage): boolean {
  // 如果本地没有数据，肯定是首次同步
  if (!localData || Object.keys(localData).length === 0) {
    return true;
  }

  // 如果远程没有数据，检查本地数据是否为初始状态
  if (!remoteData) {
    // 检查本地是否有实际的书签或分类数据
    const hasBookmarks = localData.bookmarks && localData.bookmarks.length > 0;
    const hasCategories = localData.categories && localData.categories.length > 0;
    
    return !hasBookmarks && !hasCategories;
  }

  return false;
}

/**
 * 检查时间戳陷阱情况
 * 新设备空数据时间戳可能比远程数据更新，但实际应该下载远程数据
 */
export function detectTimestampTrap(
  localTimestamp: number,
  remoteTimestamp: number,
  localDataIsEmpty: boolean
): boolean {
  // 如果本地数据为空但时间戳更新，很可能是时间戳陷阱
  if (localDataIsEmpty && localTimestamp > remoteTimestamp) {
    if (DEBUG_ENABLED) {
      console.warn('[Metadata] Detected timestamp trap:', {
        localTimestamp,
        remoteTimestamp,
        localDataIsEmpty,
      });
    }
    return true;
  }
  
  return false;
}

/**
 * 修复损坏的元数据
 */
export async function repairMetadata(
  data: any,
  device: DeviceInfo,
  partialMetadata?: Partial<SyncMetadata>
): Promise<SyncMetadata> {
  const now = Date.now();
  
  if (DEBUG_ENABLED) {
    console.log('[Metadata] Repairing metadata:', partialMetadata);
  }

  // 重新生成哈希
  const dataHash = await generateDataHash(data);
  
  return {
    lastSyncTime: partialMetadata?.lastSyncTime || now,
    localTimestamp: partialMetadata?.localTimestamp || now,
    remoteTimestamp: partialMetadata?.remoteTimestamp || now,
    dataHash,
    version: SYNC_CONSTANTS.DATA_VERSION,
    deviceId: device.id,
  };
}

/**
 * 获取元数据摘要（用于日志和调试）
 */
export function getMetadataSummary(metadata: SyncMetadata): string {
  const lastSync = new Date(metadata.lastSyncTime).toLocaleString();
  const localTime = new Date(metadata.localTimestamp).toLocaleString();
  const remoteTime = new Date(metadata.remoteTimestamp).toLocaleString();
  
  return `Last sync: ${lastSync}, Local: ${localTime}, Remote: ${remoteTime}, Hash: ${metadata.dataHash.substring(0, 8)}...`;
}
