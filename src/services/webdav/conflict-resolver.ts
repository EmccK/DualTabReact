/**
 * 冲突解决策略模块
 * 处理数据同步过程中的各种冲突情况
 */

import { 
  ConflictInfo, 
  ConflictResolution, 
  SyncDataPackage, 
  SyncMetadata 
} from './types';
import { DEBUG_ENABLED } from './constants';
import { generateDataHash, verifyDataIntegrity, detectTimestampTrap } from './metadata';

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
  if (DEBUG_ENABLED) {
    console.log('[Conflict Resolver] Detecting conflicts:', {
      hasLocal: !!localData,
      hasRemote: !!remoteData,
      localTimestamp: localData?.metadata.localTimestamp,
      remoteTimestamp: remoteData?.metadata.remoteTimestamp,
    });
  }

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
  if (DEBUG_ENABLED) {
    console.log('[Conflict Resolver] Resolving conflict:', {
      type: conflictInfo.type,
      resolution,
    });
  }

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
  if (DEBUG_ENABLED) {
    console.log('[Conflict Resolver] Merging data');
  }

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
 * 合并书签分类
 */
function mergeCategories(localCategories: any[], remoteCategories: any[]): any[] {
  const categoryMap = new Map();
  const nameToIdMap = new Map(); // 用于按名称查找已存在的分类
  
  // 先添加本地分类
  localCategories.forEach(category => {
    if (category.id && category.name) {
      categoryMap.set(category.id, category);
      nameToIdMap.set(category.name.toLowerCase().trim(), category.id);
    }
  });
  
  // 合并远程分类
  remoteCategories.forEach(remoteCategory => {
    if (!remoteCategory.id || !remoteCategory.name) return;
    
    const categoryName = remoteCategory.name.toLowerCase().trim();
    const existingCategoryId = nameToIdMap.get(categoryName);
    
    if (existingCategoryId) {
      // 找到同名分类，合并它们
      const localCategory = categoryMap.get(existingCategoryId);
      if (localCategory) {
        // 取更新时间较晚的，但保持本地ID
        const merged = localCategory.updatedAt > remoteCategory.updatedAt 
          ? localCategory 
          : { ...remoteCategory, id: localCategory.id };
        
        // 合并书签列表（去重）
        const mergedBookmarks = Array.from(new Set([
          ...(localCategory.bookmarks || []),
          ...(remoteCategory.bookmarks || [])
        ]));
        
        merged.bookmarks = mergedBookmarks;
        categoryMap.set(existingCategoryId, merged);
      }
    } else if (!categoryMap.has(remoteCategory.id)) {
      // 确实是新的分类，添加它
      categoryMap.set(remoteCategory.id, remoteCategory);
      nameToIdMap.set(categoryName, remoteCategory.id);
    }
  });
  
  return Array.from(categoryMap.values());
}

/**
 * 合并书签
 */
function mergeBookmarks(localBookmarks: any[], remoteBookmarks: any[]): any[] {
  const bookmarkMap = new Map();
  const urlToIdMap = new Map(); // 用于按URL查找已存在的书签
  
  // 先添加本地书签
  localBookmarks.forEach(bookmark => {
    if (bookmark.id && bookmark.url) {
      bookmarkMap.set(bookmark.id, bookmark);
      urlToIdMap.set(bookmark.url.toLowerCase().trim(), bookmark.id);
    }
  });
  
  // 合并远程书签
  remoteBookmarks.forEach(remoteBookmark => {
    if (!remoteBookmark.id || !remoteBookmark.url) return;
    
    const bookmarkUrl = remoteBookmark.url.toLowerCase().trim();
    const existingBookmarkId = urlToIdMap.get(bookmarkUrl);
    
    if (existingBookmarkId) {
      // 找到相同URL的书签，合并它们
      const localBookmark = bookmarkMap.get(existingBookmarkId);
      if (localBookmark) {
        // 取更新时间较晚的，但保持本地ID
        const merged = localBookmark.updatedAt > remoteBookmark.updatedAt 
          ? localBookmark 
          : { ...remoteBookmark, id: localBookmark.id };
        bookmarkMap.set(existingBookmarkId, merged);
      }
    } else if (!bookmarkMap.has(remoteBookmark.id)) {
      // 确实是新的书签，添加它
      bookmarkMap.set(remoteBookmark.id, remoteBookmark);
      urlToIdMap.set(bookmarkUrl, remoteBookmark.id);
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
    if (DEBUG_ENABLED) {
      console.error('[Conflict Resolver] Resolution validation failed:', error);
    }
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
