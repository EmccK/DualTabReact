/**
 * 图标缓存管理器 - 简化版本
 * 提供简洁高效的图标缓存功能
 */

interface CacheEntry {
  url: string;
  timestamp: number;
  accessCount: number;
}

interface CacheStats {
  totalEntries: number;
  hitRate: number;
  oldestEntry: number;
  newestEntry: number;
}

class SimpleIconCache {
  private cache = new Map<string, CacheEntry>();
  private hitCount = 0;
  private missCount = 0;
  private readonly maxSize = 100;
  private readonly maxAge = 24 * 60 * 60 * 1000; // 24小时

  /**
   * 生成缓存键
   */
  private generateKey(url: string, size: number): string {
    try {
      const domain = new URL(url).hostname;
      return `${domain}:${size}`;
    } catch {
      return `${url}:${size}`;
    }
  }

  /**
   * 获取缓存的图标URL
   */
  get(url: string, size: number): string | null {
    const key = this.generateKey(url, size);
    const entry = this.cache.get(key);

    if (!entry) {
      this.missCount++;
      return null;
    }

    // 检查是否过期
    const now = Date.now();
    if (now - entry.timestamp > this.maxAge) {
      this.cache.delete(key);
      this.missCount++;
      return null;
    }

    // 更新访问信息
    entry.accessCount++;
    this.hitCount++;
    
    return entry.url;
  }

  /**
   * 设置缓存
   */
  set(url: string, size: number, faviconUrl: string): void {
    const key = this.generateKey(url, size);
    const now = Date.now();

    const entry: CacheEntry = {
      url: faviconUrl,
      timestamp: now,
      accessCount: 1,
    };

    this.cache.set(key, entry);
    this.cleanup();
  }

  /**
   * 清理过期和低优先级缓存
   */
  private cleanup(): void {
    const now = Date.now();

    // 移除过期条目
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > this.maxAge) {
        this.cache.delete(key);
      }
    }

    // 如果缓存仍然太大，移除最少使用的条目
    if (this.cache.size > this.maxSize) {
      const entries = Array.from(this.cache.entries())
        .sort((a, b) => a[1].accessCount - b[1].accessCount);

      const removeCount = Math.floor(this.cache.size * 0.2); // 移除20%
      for (let i = 0; i < removeCount && i < entries.length; i++) {
        this.cache.delete(entries[i][0]);
      }
    }
  }

  /**
   * 批量预加载
   */
  async preload(urls: string[], size: number = 32): Promise<void> {
    const { getBestFaviconUrl } = await import('./icon-utils');
    
    const promises = urls.map(async (url) => {
      const key = this.generateKey(url, size);
      
      if (this.cache.has(key)) {
        return; // 已缓存，跳过
      }

      try {
        const faviconUrl = await getBestFaviconUrl(url, size);
        if (faviconUrl) {
          this.set(url, size, faviconUrl);
        }
      } catch (error) {
      }
    });

    await Promise.allSettled(promises);
  }

  /**
   * 获取缓存统计
   */
  getStats(): CacheStats {
    const entries = Array.from(this.cache.values());
    const timestamps = entries.map(e => e.timestamp);
    
    return {
      totalEntries: this.cache.size,
      hitRate: this.hitCount + this.missCount > 0 
        ? this.hitCount / (this.hitCount + this.missCount) 
        : 0,
      oldestEntry: timestamps.length > 0 ? Math.min(...timestamps) : 0,
      newestEntry: timestamps.length > 0 ? Math.max(...timestamps) : 0,
    };
  }

  /**
   * 清空缓存
   */
  clear(): void {
    this.cache.clear();
    this.hitCount = 0;
    this.missCount = 0;
  }

  /**
   * 获取缓存大小
   */
  size(): number {
    return this.cache.size;
  }

  /**
   * 移除特定域名的缓存
   */
  removeDomain(domain: string): void {
    const keysToRemove: string[] = [];
    
    for (const [key, entry] of this.cache.entries()) {
      if (entry.url.includes(domain)) {
        keysToRemove.push(key);
      }
    }
    
    keysToRemove.forEach(key => this.cache.delete(key));
  }
}

// 创建全局缓存实例
export const iconCache = new SimpleIconCache();

// 定期清理缓存（每小时一次）
if (typeof window !== 'undefined') {
  setInterval(() => {
    iconCache['cleanup']();
  }, 60 * 60 * 1000); // 1小时
}

export default SimpleIconCache;
