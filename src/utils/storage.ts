/**
 * Chrome存储API现代化封装
 * 提供类型安全的存储操作，支持错误处理和性能优化
 */

import type { 
  Bookmark, 
  BookmarkCategory, 
  NetworkMode, 
  AppSettings, 
  BackupData,
  StorageResponse,
  OperationResult 
} from '../types';

// 存储键名常量
export const STORAGE_KEYS = {
  BOOKMARKS: 'bookmarks',
  CATEGORIES: 'categories', 
  NETWORK_MODE: 'networkMode',
  SETTINGS: 'settings',
  SELECTED_CATEGORY: 'selectedCategoryName',
} as const;

// 内存缓存，减少Chrome API调用
const cache = new Map<string, { data: any; timestamp: number; ttl: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5分钟缓存

/**
 * 通用的Chrome存储读取函数
 */
export async function chromeStorageGet<T = any>(
  keys: string | string[], 
  useLocal = true
): Promise<OperationResult<StorageResponse<T>>> {
  try {
    // 检查Chrome API可用性
    if (typeof chrome === 'undefined' || !chrome.storage) {
      return {
        success: false,
        error: 'Chrome Storage API 不可用'
      };
    }

    const storage = useLocal ? chrome.storage.local : chrome.storage.sync;
    
    return new Promise((resolve) => {
      storage.get(keys, (data) => {
        if (chrome.runtime.lastError) {
          resolve({
            success: false,
            error: chrome.runtime.lastError.message
          });
        } else {
          resolve({
            success: true,
            data: data as StorageResponse<T>
          });
        }
      });
    });
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : '未知错误'
    };
  }
}

/**
 * 通用的Chrome存储写入函数
 */
export async function chromeStorageSet(
  data: Record<string, any>, 
  useLocal = true
): Promise<OperationResult<void>> {
  try {
    // 检查Chrome API可用性
    if (typeof chrome === 'undefined' || !chrome.storage) {
      return {
        success: false,
        error: 'Chrome Storage API 不可用'
      };
    }

    const storage = useLocal ? chrome.storage.local : chrome.storage.sync;
    
    return new Promise((resolve) => {
      storage.set(data, () => {
        if (chrome.runtime.lastError) {
          resolve({
            success: false,
            error: chrome.runtime.lastError.message
          });
        } else {
          // 清除相关缓存
          Object.keys(data).forEach(key => cache.delete(key));
          resolve({ success: true });
        }
      });
    });
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : '未知错误'
    };
  }
}

/**
 * 带缓存的数据读取
 */
async function getCachedData<T>(
  key: string, 
  fetcher: () => Promise<OperationResult<T>>, 
  ttl = CACHE_TTL
): Promise<OperationResult<T>> {
  const cached = cache.get(key);
  const now = Date.now();

  // 检查缓存是否有效
  if (cached && (now - cached.timestamp) < cached.ttl) {
    return { success: true, data: cached.data };
  }

  // 获取新数据
  const result = await fetcher();
  
  if (result.success && result.data !== undefined) {
    // 更新缓存
    cache.set(key, {
      data: result.data,
      timestamp: now,
      ttl
    });
  }

  return result;
}

/**
 * 加载书签数据
 */
export async function loadBookmarks(): Promise<OperationResult<Bookmark[]>> {
  return getCachedData(
    STORAGE_KEYS.BOOKMARKS,
    async () => {
      const result = await chromeStorageGet<Bookmark[]>(STORAGE_KEYS.BOOKMARKS);
      
      if (!result.success) {
        return result;
      }

      const bookmarks = result.data?.[STORAGE_KEYS.BOOKMARKS] || [];
      return { success: true, data: bookmarks };
    }
  );
}

/**
 * 保存书签数据
 */
export async function saveBookmarks(bookmarks: Bookmark[]): Promise<OperationResult<void>> {
  // 数据验证
  if (!Array.isArray(bookmarks)) {
    return {
      success: false,
      error: '书签数据必须是数组格式'
    };
  }

  const now = Date.now();
  return chromeStorageSet({ 
    [STORAGE_KEYS.BOOKMARKS]: bookmarks,
    [`${STORAGE_KEYS.BOOKMARKS}_modified_time`]: now
  });
}

/**
 * 加载分类数据
 */
export async function loadCategories(): Promise<OperationResult<BookmarkCategory[]>> {
  return getCachedData(
    STORAGE_KEYS.CATEGORIES,
    async () => {
      const result = await chromeStorageGet<BookmarkCategory[]>(STORAGE_KEYS.CATEGORIES);
      
      if (!result.success) {
        return result;
      }

      let categories = result.data?.[STORAGE_KEYS.CATEGORIES] || [];
      
      // 确保没有重复名称的分类，保留最新的一个
      const uniqueCategories = new Map<string, BookmarkCategory>();
      categories.forEach(category => {
        const existing = uniqueCategories.get(category.name);
        if (!existing || category.updatedAt > existing.updatedAt) {
          uniqueCategories.set(category.name, category);
        }
      });
      
      categories = Array.from(uniqueCategories.values());
      return { success: true, data: categories };
    }
  );
}

/**
 * 保存分类数据
 */
export async function saveCategories(categories: BookmarkCategory[]): Promise<OperationResult<void>> {
  // 数据验证
  if (!Array.isArray(categories)) {
    return {
      success: false,
      error: '分类数据必须是数组格式'
    };
  }

  // 确保分类名称唯一性
  const uniqueNames = new Set<string>();
  const duplicates: string[] = [];
  
  categories.forEach(category => {
    if (uniqueNames.has(category.name)) {
      duplicates.push(category.name);
    } else {
      uniqueNames.add(category.name);
    }
  });
  
  if (duplicates.length > 0) {
    return {
      success: false,
      error: `发现重复的分类名称: ${duplicates.join(', ')}`
    };
  }

  const now = Date.now();
  return chromeStorageSet({ 
    [STORAGE_KEYS.CATEGORIES]: categories,
    [`${STORAGE_KEYS.CATEGORIES}_modified_time`]: now
  });
}

/**
 * 通过分类名称查找分类
 */
export async function findCategoryByName(categoryName: string): Promise<OperationResult<BookmarkCategory | null>> {
  try {
    const categoriesResult = await loadCategories();
    if (!categoriesResult.success) {
      return { success: false, error: categoriesResult.error };
    }
    
    const categories = categoriesResult.data || [];
    const category = categories.find(cat => cat.name === categoryName) || null;
    
    return { success: true, data: category };
  } catch (error) {
    return { success: false, error: '查找分类失败' };
  }
}

/**
 * 添加分类
 */
export async function addCategory(categoryData: Omit<BookmarkCategory, 'createdAt' | 'updatedAt'>): Promise<OperationResult<BookmarkCategory>> {
  try {
    const categoriesResult = await loadCategories()
    if (!categoriesResult.success) {
      return { success: false, error: categoriesResult.error }
    }
    
    const categories = categoriesResult.data || []
    
    // 检查分类名称是否已存在
    const existingCategory = categories.find(cat => cat.name === categoryData.name)
    if (existingCategory) {
      return { success: false, error: '分类名称已存在' }
    }
    
    const now = Date.now()
    const newCategory: BookmarkCategory = {
      ...categoryData,
      createdAt: now,
      updatedAt: now
    }
    
    const updatedCategories = [...categories, newCategory]
    const saveResult = await saveCategories(updatedCategories)
    
    if (saveResult.success) {
      return { success: true, data: newCategory }
    } else {
      return { success: false, error: saveResult.error }
    }
  } catch {
    return { success: false, error: '添加分类失败' }
  }
}

/**
 * 更新分类
 */
export async function updateCategory(categoryName: string, updates: Partial<BookmarkCategory>): Promise<OperationResult<BookmarkCategory>> {
  try {
    const categoriesResult = await loadCategories()
    if (!categoriesResult.success) {
      return { success: false, error: categoriesResult.error }
    }
    
    const categories = categoriesResult.data || []
    const categoryIndex = categories.findIndex(cat => cat.name === categoryName)
    
    if (categoryIndex === -1) {
      return { success: false, error: '分类不存在' }
    }
    
    // 如果要更新分类名称，需要检查新名称是否已存在
    if (updates.name && updates.name !== categoryName) {
      const existingCategory = categories.find(cat => cat.name === updates.name)
      if (existingCategory) {
        return { success: false, error: '分类名称已存在' }
      }
    }
    
    const updatedCategory = {
      ...categories[categoryIndex],
      ...updates,
      updatedAt: Date.now()
    }
    
    const updatedCategories = [...categories]
    updatedCategories[categoryIndex] = updatedCategory
    
    const saveResult = await saveCategories(updatedCategories)
    
    if (saveResult.success) {
      return { success: true, data: updatedCategory }
    } else {
      return { success: false, error: saveResult.error }
    }
  } catch (error) {
    return { success: false, error: '更新分类失败' }
  }
}

/**
 * 删除分类
 */
export async function deleteCategory(categoryName: string): Promise<OperationResult<void>> {
  try {
    const categoriesResult = await loadCategories()
    if (!categoriesResult.success) {
      return { success: false, error: categoriesResult.error }
    }
    
    const categories = categoriesResult.data || []
    const filteredCategories = categories.filter(cat => cat.name !== categoryName)
    
    if (filteredCategories.length === categories.length) {
      return { success: false, error: '分类不存在' }
    }
    
    return await saveCategories(filteredCategories)
  } catch (error) {
    return { success: false, error: '删除分类失败' }
  }
}

/**
 * 重排序分类
 */
export async function reorderCategories(reorderedCategories: BookmarkCategory[]): Promise<OperationResult<void>> {
  try {
    // 更新所有分类的updatedAt时间戳
    const categoriesWithTimestamp = reorderedCategories.map(category => ({
      ...category,
      updatedAt: Date.now()
    }))
    
    return await saveCategories(categoriesWithTimestamp)
  } catch (error) {
    return { success: false, error: '重排序分类失败' }
  }
}

/**
 * 加载网络模式
 */
export async function loadNetworkMode(): Promise<OperationResult<NetworkMode>> {
  return getCachedData(
    STORAGE_KEYS.NETWORK_MODE,
    async () => {
      const result = await chromeStorageGet<NetworkMode>(STORAGE_KEYS.NETWORK_MODE, false); // 使用sync storage
      
      if (!result.success) {
        return { success: true, data: 'external' }; // 默认外网模式
      }

      const mode = result.data?.[STORAGE_KEYS.NETWORK_MODE] || 'external';
      return { success: true, data: mode };
    }
  );
}

/**
 * 保存网络模式
 */
export async function saveNetworkMode(mode: NetworkMode): Promise<OperationResult<void>> {
  // 数据验证
  if (mode !== 'internal' && mode !== 'external') {
    return {
      success: false,
      error: '网络模式必须是 internal 或 external'
    };
  }

  return chromeStorageSet({ [STORAGE_KEYS.NETWORK_MODE]: mode }, false); // 使用sync storage
}

/**
 * 加载应用设置
 */
export async function loadSettings(): Promise<OperationResult<AppSettings>> {
  return getCachedData(
    STORAGE_KEYS.SETTINGS,
    async () => {
      const result = await chromeStorageGet<AppSettings>(null); // 获取所有数据
      
      if (!result.success) {
        return {
          success: true,
          data: {
            networkMode: 'external',
            enableBlur: true,
            enableAnimations: true,
            autoSync: false
          }
        };
      }

      // 合并默认设置
      const defaultSettings: AppSettings = {
        networkMode: 'external',
        enableBlur: true,
        enableAnimations: true,
        autoSync: false
      };

      const settings = { ...defaultSettings, ...result.data };
      return { success: true, data: settings };
    }
  );
}

/**
 * 保存应用设置
 */
export async function saveSettings(settings: Partial<AppSettings>): Promise<OperationResult<void>> {
  // 先加载现有设置
  const currentResult = await loadSettings();
  if (!currentResult.success) {
    return currentResult;
  }

  // 合并设置
  const mergedSettings = { ...currentResult.data, ...settings };
  
  return chromeStorageSet(mergedSettings);
}



/**
 * 备份所有数据
 */
export async function backupData(): Promise<OperationResult<BackupData>> {
  try {
    // 并行加载所有数据
    const [bookmarksResult, categoriesResult, settingsResult, networkModeResult] = await Promise.all([
      loadBookmarks(),
      loadCategories(), 
      loadSettings(),
      loadNetworkMode()
    ]);

    // 检查是否有加载失败
    if (!bookmarksResult.success || !categoriesResult.success || 
        !settingsResult.success || !networkModeResult.success) {
      return {
        success: false,
        error: '备份数据时部分数据加载失败'
      };
    }

    const backupData: BackupData = {
      bookmarks: bookmarksResult.data || [],
      categories: categoriesResult.data || [],
      settings: settingsResult.data!,
      networkMode: networkModeResult.data!,
      timestamp: Date.now(),
      version: '2.0'
    };

    return { success: true, data: backupData };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : '备份失败'
    };
  }
}

/**
 * 从备份恢复数据
 */
export async function restoreFromBackup(backupData: BackupData): Promise<OperationResult<void>> {
  try {
    // 验证备份数据格式
    if (!backupData || !backupData.version || !backupData.timestamp) {
      return {
        success: false,
        error: '备份数据格式无效'
      };
    }

    // 并行恢复数据
    const restorePromises: Promise<OperationResult<void>>[] = [];

    if (backupData.bookmarks) {
      restorePromises.push(saveBookmarks(backupData.bookmarks));
    }

    if (backupData.categories) {
      restorePromises.push(saveCategories(backupData.categories));
    }

    if (backupData.networkMode) {
      restorePromises.push(saveNetworkMode(backupData.networkMode));
    }

    if (backupData.settings) {
      restorePromises.push(saveSettings(backupData.settings));
    }

    const results = await Promise.all(restorePromises);
    
    // 检查是否有恢复失败
    const failedResults = results.filter(result => !result.success);
    if (failedResults.length > 0) {
      return {
        success: false,
        error: `部分数据恢复失败: ${failedResults.map(r => r.error).join(', ')}`
      };
    }

    // 清除缓存，确保数据一致性
    cache.clear();

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : '恢复失败'
    };
  }
}

/**
 * 清除所有缓存
 */
export function clearCache(): void {
  cache.clear();
}

/**
 * 加载选中的分类名称
 */
export async function loadSelectedCategoryName(): Promise<OperationResult<string | null>> {
  return getCachedData(
    STORAGE_KEYS.SELECTED_CATEGORY,
    async () => {
      const result = await chromeStorageGet<string>(STORAGE_KEYS.SELECTED_CATEGORY);
      
      if (!result.success) {
        return { success: true, data: null }; // 默认无选中分类
      }

      const categoryName = result.data?.[STORAGE_KEYS.SELECTED_CATEGORY] || null;
      return { success: true, data: categoryName };
    }
  );
}

/**
 * 保存选中的分类名称
 */
export async function saveSelectedCategoryName(categoryName: string | null): Promise<OperationResult<void>> {
  return chromeStorageSet({ [STORAGE_KEYS.SELECTED_CATEGORY]: categoryName });
}

// 兼容性函数 - 逐步迁移时使用
/**
 * @deprecated 使用 loadSelectedCategoryName 替代
 */
export const loadSelectedCategoryId = loadSelectedCategoryName;

/**
 * @deprecated 使用 saveSelectedCategoryName 替代
 */
export const saveSelectedCategoryId = saveSelectedCategoryName;

/**
 * 获取缓存统计信息（调试用）
 */
export function getCacheStats() {
  return {
    size: cache.size,
    keys: Array.from(cache.keys()),
    entries: Array.from(cache.entries()).map(([key, value]) => ({
      key,
      timestamp: value.timestamp,
      ttl: value.ttl,
      age: Date.now() - value.timestamp
    }))
  };
}
