/**
 * 冲突解决策略模块
 * 处理数据同步过程中的各种冲突情况
 */

import type { 
  ConflictInfo, 
  ConflictResolution, 
  SyncDataPackage, 
  SyncMetadata 
} from './types';
import { generateDataHash, verifyDataIntegrity, detectTimestampTrap } from './metadata';
// 移除对DEFAULT_CATEGORY_ID的依赖，使用分类名称作为唯一标识

/**
 * 冲突检测结果
 */
export interface ConflictDetectionResult {
  hasConflict: boolean;
  conflictType?: 'data_conflict' | 'timestamp_conflict' | 'hash_mismatch';
  shouldUseLocal: boolean;
  shouldUseRemote: boolean;
  conflictInfo?: ConflictInfo;
}

/**
 * 检测同步冲突
 */
export async function detectConflict(
  localData: SyncDataPackage | null,
  remoteData: SyncDataPackage | null
): Promise<ConflictDetectionResult> {

  // 情况1: 没有远程数据，使用本地数据
  if (!remoteData) {
    return {
      hasConflict: false,
      shouldUseLocal: true,
      shouldUseRemote: false,
    };
  }

  // 情况2: 没有本地数据，使用远程数据
  if (!localData) {
    return {
      hasConflict: false,
      shouldUseLocal: false,
      shouldUseRemote: true,
    };
  }

  // 情况3: 检查数据完整性
  const localDataValid = await verifyDataIntegrity(
    { categories: localData.categories, bookmarks: localData.bookmarks, settings: localData.settings },
    localData.metadata.dataHash
  );
  
  const remoteDataValid = await verifyDataIntegrity(
    { categories: remoteData.categories, bookmarks: remoteData.bookmarks, settings: remoteData.settings },
    remoteData.metadata.dataHash
  );

  if (!localDataValid && remoteDataValid) {
    return {
      hasConflict: false,
      shouldUseLocal: false,
      shouldUseRemote: true,
    };
  }

  if (localDataValid && !remoteDataValid) {
    return {
      hasConflict: false,
      shouldUseLocal: true,
      shouldUseRemote: false,
    };
  }

  if (!localDataValid && !remoteDataValid) {
    return {
      hasConflict: true,
      conflictType: 'hash_mismatch',
      shouldUseLocal: false,
      shouldUseRemote: false,
      conflictInfo: createConflictInfo('hash_mismatch', localData, remoteData),
    };
  }

  // 情况4: 检查时间戳陷阱
  const localIsEmpty = isDataEmpty(localData);
  const remoteIsEmpty = isDataEmpty(remoteData);
  
  if (detectTimestampTrap(
    localData.metadata.localTimestamp,
    remoteData.metadata.remoteTimestamp,
    localIsEmpty
  )) {
    return {
      hasConflict: false,
      shouldUseLocal: false,
      shouldUseRemote: true,
    };
  }

  // 情况5: 比较时间戳
  const localTimestamp = localData.metadata.localTimestamp;
  const remoteTimestamp = remoteData.metadata.remoteTimestamp;
  
  if (localTimestamp > remoteTimestamp) {
    // 本地数据更新
    return {
      hasConflict: false,
      shouldUseLocal: true,
      shouldUseRemote: false,
    };
  }
  
  if (remoteTimestamp > localTimestamp) {
    // 远程数据更新
    return {
      hasConflict: false,
      shouldUseLocal: false,
      shouldUseRemote: true,
    };
  }

  // 情况6: 时间戳相同，比较数据哈希
  if (localData.metadata.dataHash === remoteData.metadata.dataHash) {
    // 数据完全一致，无需同步
    return {
      hasConflict: false,
      shouldUseLocal: true,
      shouldUseRemote: false,
    };
  }

  // 情况7: 时间戳相同但数据不同，存在冲突
  return {
    hasConflict: true,
    conflictType: 'data_conflict',
    shouldUseLocal: false,
    shouldUseRemote: false,
    conflictInfo: createConflictInfo('data_conflict', localData, remoteData),
  };
}

/**
 * 检查数据是否为空
 */
function isDataEmpty(data: SyncDataPackage): boolean {
  const hasBookmarks = data.bookmarks && data.bookmarks.length > 0;
  const hasCategories = data.categories && data.categories.length > 0;
  return !hasBookmarks && !hasCategories;
}

/**
 * 创建冲突信息
 */
function createConflictInfo(
  type: 'data_conflict' | 'timestamp_conflict' | 'hash_mismatch',
  localData: SyncDataPackage,
  remoteData: SyncDataPackage
): ConflictInfo {
  return {
    type,
    localData: {
      categories: localData.categories,
      bookmarks: localData.bookmarks,
      settings: localData.settings,
    },
    remoteData: {
      categories: remoteData.categories,
      bookmarks: remoteData.bookmarks,
      settings: remoteData.settings,
    },
    localTimestamp: localData.metadata.localTimestamp,
    remoteTimestamp: remoteData.metadata.remoteTimestamp,
    conflictTime: Date.now(),
  };
}

/**
 * 解决冲突
 */
export async function resolveConflict(
  conflictInfo: ConflictInfo,
  resolution: ConflictResolution,
  localDevice: any
): Promise<SyncDataPackage> {

  switch (resolution) {
    case 'use_local':
      return await createResolvedDataPackage(conflictInfo.localData, localDevice);
      
    case 'use_remote':
      return await createResolvedDataPackage(conflictInfo.remoteData, localDevice);
      
    case 'merge':
      const mergedData = await mergeData(conflictInfo.localData, conflictInfo.remoteData);
      return await createResolvedDataPackage(mergedData, localDevice);
      
    case 'manual':
      throw new Error('手动解决冲突需要用户介入');
      
    default:
      throw new Error(`不支持的冲突解决策略: ${resolution}`);
  }
}

/**
 * 合并数据
 */
async function mergeData(localData: any, remoteData: any): Promise<any> {
  // 合并书签分类
  const mergedCategories = mergeCategories(localData.categories || [], remoteData.categories || []);
  
  // 合并书签
  const mergedBookmarks = mergeBookmarks(localData.bookmarks || [], remoteData.bookmarks || []);
  
  // 合并设置（远程优先）
  const mergedSettings = {
    ...localData.settings,
    ...remoteData.settings,
  };

  return {
    categories: mergedCategories,
    bookmarks: mergedBookmarks,
    settings: mergedSettings,
  };
}

/**
 * 合并书签分类（适配新数据结构：使用name作为唯一标识）
 */
function mergeCategories(localCategories: any[], remoteCategories: any[]): any[] {
  const categoryMap = new Map<string, any>();
  
  // 先添加本地分类（以name作为键）
  localCategories.forEach(category => {
    if (category.name) {
      const categoryKey = category.name.toLowerCase().trim();
      categoryMap.set(categoryKey, category);
    }
  });
  
  // 合并远程分类
  remoteCategories.forEach(remoteCategory => {
    if (!remoteCategory.name) return;
    
    const categoryKey = remoteCategory.name.toLowerCase().trim();
    const existingCategory = categoryMap.get(categoryKey);
    
    if (existingCategory) {
      // 找到同名分类，合并它们
      // 取更新时间较晚的数据
      const merged = existingCategory.updatedAt > remoteCategory.updatedAt 
        ? existingCategory 
        : remoteCategory;
      
      // 合并书签列表（去重）
      const mergedBookmarks = Array.from(new Set([
        ...(existingCategory.bookmarks || []),
        ...(remoteCategory.bookmarks || [])
      ]));
      
      merged.bookmarks = mergedBookmarks;
      categoryMap.set(categoryKey, merged);
    } else {
      // 新的分类，直接添加
      categoryMap.set(categoryKey, remoteCategory);
    }
  });
  
  return Array.from(categoryMap.values());
}

/**
 * 合并书签（适配新数据结构：使用URL作为唯一标识）
 */
function mergeBookmarks(localBookmarks: any[], remoteBookmarks: any[]): any[] {
  const bookmarkMap = new Map<string, any>();
  
  // 先添加本地书签（以URL作为键）
  localBookmarks.forEach(bookmark => {
    if (bookmark.url) {
      const bookmarkKey = bookmark.url.toLowerCase().trim();
      bookmarkMap.set(bookmarkKey, bookmark);
    }
  });
  
  // 合并远程书签
  remoteBookmarks.forEach(remoteBookmark => {
    if (!remoteBookmark.url) return;
    
    const bookmarkKey = remoteBookmark.url.toLowerCase().trim();
    const existingBookmark = bookmarkMap.get(bookmarkKey);
    
    if (existingBookmark) {
      // 找到相同URL的书签，合并它们
      // 取更新时间较晚的数据
      const merged = existingBookmark.updatedAt > remoteBookmark.updatedAt 
        ? existingBookmark 
        : remoteBookmark;
      bookmarkMap.set(bookmarkKey, merged);
    } else {
      // 新的书签，直接添加
      bookmarkMap.set(bookmarkKey, remoteBookmark);
    }
  });
  
  return Array.from(bookmarkMap.values());
}

/**
 * 创建解决冲突后的数据包
 */
async function createResolvedDataPackage(
  resolvedData: any,
  localDevice: any
): Promise<SyncDataPackage> {
  const now = Date.now();
  const dataHash = await generateDataHash(resolvedData);
  
  return {
    metadata: {
      lastSyncTime: now,
      localTimestamp: now,
      remoteTimestamp: now,
      dataHash,
      version: '2.0.0',
      deviceId: localDevice.id,
    },
    device: {
      ...localDevice,
      lastActiveAt: now,
    },
    categories: resolvedData.categories || [],
    bookmarks: resolvedData.bookmarks || [],
    settings: resolvedData.settings || {},
    version: '2.0.0',
    createdAt: now,
  };
}

/**
 * 获取推荐的冲突解决策略
 */
export function getRecommendedResolution(conflictInfo: ConflictInfo): ConflictResolution {
  switch (conflictInfo.type) {
    case 'hash_mismatch':
      // 数据完整性问题，推荐手动解决
      return 'manual';
      
    case 'timestamp_conflict':
      // 时间戳冲突，推荐使用较新的数据
      return conflictInfo.localTimestamp > conflictInfo.remoteTimestamp 
        ? 'use_local' 
        : 'use_remote';
        
    case 'data_conflict':
      // 数据冲突，推荐合并
      return 'merge';
      
    default:
      return 'manual';
  }
}

/**
 * 获取冲突描述信息
 */
export function getConflictDescription(conflictInfo: ConflictInfo): string {
  const localTime = new Date(conflictInfo.localTimestamp).toLocaleString();
  const remoteTime = new Date(conflictInfo.remoteTimestamp).toLocaleString();
  
  switch (conflictInfo.type) {
    case 'data_conflict':
      return `本地数据（${localTime}）与远程数据（${remoteTime}）存在差异，需要选择保留哪个版本或进行合并。`;
      
    case 'timestamp_conflict':
      return `本地数据时间戳（${localTime}）与远程数据时间戳（${remoteTime}）冲突。`;
      
    case 'hash_mismatch':
      return `数据完整性校验失败，本地或远程数据可能已损坏。`;
      
    default:
      return '发生未知类型的数据冲突。';
  }
}

/**
 * 创建冲突统计信息
 */
export function getConflictStats(conflictInfo: ConflictInfo): {
  localStats: any;
  remoteStats: any;
} {
  const getDataStats = (data: any) => ({
    categoriesCount: data.categories?.length || 0,
    bookmarksCount: data.bookmarks?.length || 0,
    hasSettings: !!data.settings && Object.keys(data.settings).length > 0,
  });
  
  return {
    localStats: getDataStats(conflictInfo.localData),
    remoteStats: getDataStats(conflictInfo.remoteData),
  };
}

/**
 * 验证冲突解决结果
 */
export async function validateResolution(
  resolvedData: SyncDataPackage,
  originalConflict: ConflictInfo
): Promise<boolean> {
  try {
    // 验证数据包结构
    if (!resolvedData.categories || !resolvedData.bookmarks || !resolvedData.settings) {
      return false;
    }
    
    // 验证数据完整性
    const calculatedHash = await generateDataHash({
      categories: resolvedData.categories,
      bookmarks: resolvedData.bookmarks,
      settings: resolvedData.settings,
    });
    
    return calculatedHash === resolvedData.metadata.dataHash;
  } catch (error) {
    return false;
  }
}

/**
 * 自动选择最佳解决策略
 */
export function autoResolveConflict(conflictInfo: ConflictInfo): ConflictResolution {
  // 分析数据量和质量
  const localStats = getConflictStats(conflictInfo).localStats;
  const remoteStats = getConflictStats(conflictInfo).remoteStats;
  
  // 如果一方数据明显更丰富，选择数据更多的一方
  const localDataScore = localStats.categoriesCount + localStats.bookmarksCount;
  const remoteDataScore = remoteStats.categoriesCount + remoteStats.bookmarksCount;
  
  if (localDataScore > remoteDataScore * 2) {
    return 'use_local';
  }
  
  if (remoteDataScore > localDataScore * 2) {
    return 'use_remote';
  }
  
  // 数据量相近，根据冲突类型选择策略
  return getRecommendedResolution(conflictInfo);
}
