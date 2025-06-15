/**
 * Service Worker 图标缓存策略
 * 利用浏览器原生缓存机制进一步优化图标加载性能
 */

/**
 * 检查是否支持 Service Worker
 */
export const isServiceWorkerSupported = (): boolean => {
  return 'serviceWorker' in navigator && 'caches' in window;
};

/**
 * 缓存名称
 */
const ICON_CACHE_NAME = 'bookmark-icons-v1';

/**
 * 预缓存图标URLs到浏览器缓存
 */
export const precacheIcons = async (urls: string[]): Promise<void> => {
  if (!isServiceWorkerSupported()) {
    return;
  }

  try {
    const cache = await caches.open(ICON_CACHE_NAME);
    
    // 过滤掉已经缓存的URLs
    const uncachedUrls: string[] = [];
    for (const url of urls) {
      const response = await cache.match(url);
      if (!response) {
        uncachedUrls.push(url);
      }
    }

    if (uncachedUrls.length === 0) {
      return;
    }

    // 批量预缓存，限制并发数
    const concurrencyLimit = 3;
    const chunks: string[][] = [];
    for (let i = 0; i < uncachedUrls.length; i += concurrencyLimit) {
      chunks.push(uncachedUrls.slice(i, i + concurrencyLimit));
    }

    for (const chunk of chunks) {
      const requests = chunk.map(url => {
        return fetch(url, {
          mode: 'cors',
          credentials: 'omit',
          headers: {
            'Accept': 'image/*,*/*;q=0.8'
          }
        }).then(response => {
          if (response.ok) {
            return cache.put(url, response.clone());
          }
        }).catch(() => {
          // 忽略单个图标的缓存失败
        });
      });

      await Promise.allSettled(requests);
      
      // 在chunks之间添加延迟
      if (chunks.indexOf(chunk) < chunks.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 200));
      }
    }
  } catch (error) {
    // 忽略缓存错误，不影响正常功能
    console.warn('Icon precaching failed:', error);
  }
};

/**
 * 从浏览器缓存获取图标
 */
export const getCachedIcon = async (url: string): Promise<string | null> => {
  if (!isServiceWorkerSupported()) {
    return null;
  }

  try {
    const cache = await caches.open(ICON_CACHE_NAME);
    const response = await cache.match(url);
    
    if (response && response.ok) {
      // 检查缓存是否过期（7天）
      const dateHeader = response.headers.get('date');
      if (dateHeader) {
        const cacheDate = new Date(dateHeader);
        const now = new Date();
        const maxAge = 7 * 24 * 60 * 60 * 1000; // 7天
        
        if (now.getTime() - cacheDate.getTime() > maxAge) {
          // 缓存过期，删除并返回null
          await cache.delete(url);
          return null;
        }
      }
      
      return url; // 返回原URL，表示缓存可用
    }
  } catch (error) {
    // 忽略错误
  }

  return null;
};

/**
 * 清理过期的图标缓存
 */
export const cleanupExpiredIcons = async (): Promise<void> => {
  if (!isServiceWorkerSupported()) {
    return;
  }

  try {
    const cache = await caches.open(ICON_CACHE_NAME);
    const requests = await cache.keys();
    const now = new Date();
    const maxAge = 7 * 24 * 60 * 60 * 1000; // 7天

    const deletePromises = requests.map(async (request) => {
      try {
        const response = await cache.match(request);
        if (response) {
          const dateHeader = response.headers.get('date');
          if (dateHeader) {
            const cacheDate = new Date(dateHeader);
            if (now.getTime() - cacheDate.getTime() > maxAge) {
              await cache.delete(request);
            }
          }
        }
      } catch (error) {
        // 忽略单个项目的清理错误
      }
    });

    await Promise.allSettled(deletePromises);
  } catch (error) {
    console.warn('Icon cache cleanup failed:', error);
  }
};

/**
 * 获取缓存统计信息
 */
export const getIconCacheStats = async (): Promise<{
  totalCached: number;
  cacheSize: number;
}> => {
  if (!isServiceWorkerSupported()) {
    return { totalCached: 0, cacheSize: 0 };
  }

  try {
    const cache = await caches.open(ICON_CACHE_NAME);
    const requests = await cache.keys();
    
    let totalSize = 0;
    for (const request of requests) {
      try {
        const response = await cache.match(request);
        if (response) {
          const blob = await response.blob();
          totalSize += blob.size;
        }
      } catch (error) {
        // 忽略单个项目的大小计算错误
      }
    }

    return {
      totalCached: requests.length,
      cacheSize: totalSize
    };
  } catch (error) {
    return { totalCached: 0, cacheSize: 0 };
  }
};

// 定期清理过期缓存
if (isServiceWorkerSupported()) {
  // 每小时检查一次过期缓存
  setInterval(() => {
    cleanupExpiredIcons();
  }, 60 * 60 * 1000);
}