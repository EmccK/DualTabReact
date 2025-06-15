/**
 * 图标缓存管理器 - 简化版本
 * 提供简洁高效的图标缓存功能
 */

interface CacheEntry {
  url: string;
  timestamp: number;
  accessCount: number;
  isValidated: boolean; // 标记这个URL是否已经验证过可用
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
  private readonly maxSize = 200; // 增加缓存容量
  private readonly maxAge = 7 * 24 * 60 * 60 * 1000; // 7天，favicon相对稳定
  private readonly storageKey = 'icon_cache_data';
  private isInitialized = false;

  /**
   * 生成缓存键 - 统一尺寸到标准值，避免多尺寸缓存问题
   */
  private generateKey(url: string, size: number): string {
    try {
      const domain = new URL(url).hostname;
      // 将常用的尺寸统一到标准值，减少缓存碎片
      const normalizedSize = this.normalizeSize(size);
      return `${domain}:${normalizedSize}`;
    } catch {
      return `${url}:${this.normalizeSize(size)}`;
    }
  }

  /**
   * 标准化图标尺寸
   */
  private normalizeSize(size: number): number {
    // 将常见尺寸统一到标准值
    if (size <= 24) return 24;
    if (size <= 32) return 32;
    if (size <= 48) return 48;
    if (size <= 64) return 64;
    return size; // 大尺寸保持原值
  }

  /**
   * 初始化缓存（从 localStorage 加载）
   */
  private async initializeCache(): Promise<void> {
    if (this.isInitialized) return;

    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        const data = JSON.parse(stored);

        // 重建 Map
        this.cache.clear();
        Object.entries(data).forEach(([key, entry]) => {
          this.cache.set(key, entry as CacheEntry);
        });

        // 清理过期条目
        this.cleanup();
      }
    } catch (error) {
      console.warn('加载图标缓存失败:', error);
    }

    this.isInitialized = true;
  }

  /**
   * 保存缓存到 localStorage
   */
  private saveToStorage(): void {
    try {
      const data = Object.fromEntries(this.cache);
      localStorage.setItem(this.storageKey, JSON.stringify(data));
    } catch (error) {
      console.warn('保存图标缓存失败:', error);
    }
  }

  /**
   * 获取缓存的图标URL
   */
  async get(url: string, size: number): Promise<string | null> {
    await this.initializeCache();
    
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
      this.saveToStorage();
      this.missCount++;
      return null;
    }

    // 更新访问信息
    entry.accessCount++;
    this.hitCount++;
    this.saveToStorage();
    
    return entry.url;
  }

  /**
   * 获取已验证的图标URL（成功加载过的URL）
   */
  async getValidated(url: string, size: number): Promise<string | null> {
    await this.initializeCache();

    const key = this.generateKey(url, size);
    const entry = this.cache.get(key);

    if (!entry || !entry.isValidated) {
      return null;
    }

    // 检查是否过期
    const now = Date.now();
    if (now - entry.timestamp > this.maxAge) {
      this.cache.delete(key);
      this.saveToStorage();
      return null;
    }

    // 更新访问信息
    entry.accessCount++;
    this.hitCount++;
    this.saveToStorage();

    return entry.url;
  }

  /**
   * 检查是否有已验证的缓存
   */
  async hasValidated(url: string, size: number): Promise<boolean> {
    const validated = await this.getValidated(url, size);
    return validated !== null;
  }

  /**
   * 设置缓存
   */
  async set(url: string, size: number, faviconUrl: string, isValidated: boolean = false): Promise<void> {
    await this.initializeCache();
    
    const key = this.generateKey(url, size);
    const now = Date.now();

    const entry: CacheEntry = {
      url: faviconUrl,
      timestamp: now,
      accessCount: 1,
      isValidated: isValidated,
    };

    this.cache.set(key, entry);
    this.cleanup();
    this.saveToStorage();
  }

  /**
   * 设置已验证的成功URL（优先级最高）
   */
  async setValidated(url: string, size: number, faviconUrl: string): Promise<void> {
    await this.set(url, size, faviconUrl, true);
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
    
    // 限制并发数以避免过多网络请求
    const concurrencyLimit = 5;
    const chunks: string[][] = [];
    for (let i = 0; i < urls.length; i += concurrencyLimit) {
      chunks.push(urls.slice(i, i + concurrencyLimit));
    }

    for (const chunk of chunks) {
      const promises = chunk.map(async (url) => {
        const key = this.generateKey(url, size);
        
        if (this.cache.has(key)) {
          return; // 已缓存，跳过
        }

        try {
          const faviconUrl = await getBestFaviconUrl(url, size);
          if (faviconUrl) {
            this.set(url, size, faviconUrl);
          }
        } catch {
          // Ignore favicon fetch errors
        }
      });

      await Promise.allSettled(promises);
      
      // 在chunks之间添加小延迟，避免过于频繁的请求
      if (chunks.indexOf(chunk) < chunks.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
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
