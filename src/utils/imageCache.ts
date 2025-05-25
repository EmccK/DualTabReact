/**
 * 图片缓存管理器
 * 负责Unsplash图片的本地缓存和管理
 * 使用Chrome storage API实现持久化存储
 */

export interface CachedImage {
  id: string;
  url: string;
  blob: string; // base64编码的图片数据
  size: number; // 文件大小（字节）
  cachedAt: number; // 缓存时间戳
  lastUsed: number; // 最后使用时间戳
  metadata: {
    width: number;
    height: number;
    photographer: string;
    photographerUrl: string;
    originalUrl: string;
  };
}

export interface CacheStats {
  totalSize: number; // 总缓存大小（字节）
  totalCount: number; // 缓存图片数量
  maxSize: number; // 最大缓存大小限制
  hitRate: number; // 缓存命中率
}

/**
 * 缓存配置
 */
export interface CacheConfig {
  maxSize: number; // 最大缓存大小（字节），默认50MB
  maxCount: number; // 最大缓存数量，默认100张
  maxAge: number; // 最大缓存时间（毫秒），默认7天
  cleanupInterval: number; // 清理间隔（毫秒），默认1小时
}

/**
 * 图片缓存管理器类
 */
export class ImageCacheManager {
  private readonly CACHE_KEY = 'unsplash_image_cache';
  private readonly STATS_KEY = 'unsplash_cache_stats';
  private readonly CONFIG_KEY = 'unsplash_cache_config';
  
  private config: CacheConfig;
  private stats: CacheStats;
  private cache: Map<string, CachedImage> = new Map();
  private cleanupTimer?: number;

  constructor(config: Partial<CacheConfig> = {}) {
    this.config = {
      maxSize: 50 * 1024 * 1024, // 50MB
      maxCount: 100,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7天
      cleanupInterval: 60 * 60 * 1000, // 1小时
      ...config
    };

    this.stats = {
      totalSize: 0,
      totalCount: 0,
      maxSize: this.config.maxSize,
      hitRate: 0
    };

    this.initialize();
  }

  /**
   * 初始化缓存管理器
   */
  private async initialize(): Promise<void> {
    try {
      // 加载配置
      await this.loadConfig();
      
      // 加载缓存数据
      await this.loadCache();
      
      // 加载统计数据
      await this.loadStats();
      
      // 启动定期清理
      this.startCleanupTimer();
      
      // 执行一次初始清理
      await this.cleanup();
    } catch (error) {
      console.error('缓存管理器初始化失败:', error);
    }
  }

  /**
   * 加载配置
   */
  private async loadConfig(): Promise<void> {
    try {
      const result = await chrome.storage.local.get(this.CONFIG_KEY);
      if (result[this.CONFIG_KEY]) {
        this.config = { ...this.config, ...result[this.CONFIG_KEY] };
        this.stats.maxSize = this.config.maxSize;
      }
    } catch (error) {
      console.warn('加载缓存配置失败:', error);
    }
  }

  /**
   * 保存配置
   */
  private async saveConfig(): Promise<void> {
    try {
      await chrome.storage.local.set({
        [this.CONFIG_KEY]: this.config
      });
    } catch (error) {
      console.warn('保存缓存配置失败:', error);
    }
  }

  /**
   * 加载缓存数据
   */
  private async loadCache(): Promise<void> {
    try {
      const result = await chrome.storage.local.get(this.CACHE_KEY);
      if (result[this.CACHE_KEY]) {
        const cacheData = result[this.CACHE_KEY] as Record<string, CachedImage>;
        this.cache = new Map(Object.entries(cacheData));
      }
    } catch (error) {
      console.warn('加载缓存数据失败:', error);
      this.cache = new Map();
    }
  }

  /**
   * 保存缓存数据
   */
  private async saveCache(): Promise<void> {
    try {
      const cacheData = Object.fromEntries(this.cache.entries());
      await chrome.storage.local.set({
        [this.CACHE_KEY]: cacheData
      });
    } catch (error) {
      console.warn('保存缓存数据失败:', error);
    }
  }

  /**
   * 加载统计数据
   */
  private async loadStats(): Promise<void> {
    try {
      const result = await chrome.storage.local.get(this.STATS_KEY);
      if (result[this.STATS_KEY]) {
        this.stats = { ...this.stats, ...result[this.STATS_KEY] };
      }
      this.updateStats();
    } catch (error) {
      console.warn('加载缓存统计失败:', error);
    }
  }

  /**
   * 保存统计数据
   */
  private async saveStats(): Promise<void> {
    try {
      await chrome.storage.local.set({
        [this.STATS_KEY]: this.stats
      });
    } catch (error) {
      console.warn('保存缓存统计失败:', error);
    }
  }

  /**
   * 更新统计数据
   */
  private updateStats(): void {
    this.stats.totalCount = this.cache.size;
    this.stats.totalSize = Array.from(this.cache.values())
      .reduce((total, item) => total + item.size, 0);
    this.stats.maxSize = this.config.maxSize;
  }

  /**
   * 缓存图片
   */
  async cacheImage(
    url: string, 
    imageBlob: Blob, 
    metadata: CachedImage['metadata']
  ): Promise<string> {
    try {
      // 检查是否已存在
      const existing = this.getCachedImage(url);
      if (existing) {
        // 更新最后使用时间
        existing.lastUsed = Date.now();
        await this.saveCache();
        return existing.blob;
      }

      // 转换为base64
      const base64 = await this.blobToBase64(imageBlob);
      const size = imageBlob.size;

      // 检查缓存限制
      await this.ensureCacheSpace(size);

      // 创建缓存项
      const cachedImage: CachedImage = {
        id: this.generateId(url),
        url,
        blob: base64,
        size,
        cachedAt: Date.now(),
        lastUsed: Date.now(),
        metadata
      };

      // 添加到缓存
      this.cache.set(url, cachedImage);
      this.updateStats();

      // 保存到存储
      await this.saveCache();
      await this.saveStats();

      return base64;
    } catch (error) {
      console.error('缓存图片失败:', error);
      throw error;
    }
  }

  /**
   * 获取缓存的图片
   */
  getCachedImage(url: string): CachedImage | null {
    const cached = this.cache.get(url);
    if (cached) {
      // 检查是否过期
      if (Date.now() - cached.cachedAt > this.config.maxAge) {
        this.cache.delete(url);
        this.updateStats();
        this.saveCache();
        return null;
      }

      // 更新最后使用时间
      cached.lastUsed = Date.now();
      return cached;
    }
    return null;
  }

  /**
   * 检查缓存是否存在
   */
  isCached(url: string): boolean {
    return this.getCachedImage(url) !== null;
  }

  /**
   * 确保缓存空间足够
   */
  private async ensureCacheSpace(newItemSize: number): Promise<void> {
    // 检查数量限制
    while (this.cache.size >= this.config.maxCount) {
      await this.removeOldestItem();
    }

    // 检查大小限制
    while (this.stats.totalSize + newItemSize > this.config.maxSize) {
      await this.removeOldestItem();
    }
  }

  /**
   * 移除最旧的缓存项
   */
  private async removeOldestItem(): Promise<void> {
    let oldest: [string, CachedImage] | null = null;
    
    for (const [url, item] of this.cache.entries()) {
      if (!oldest || item.lastUsed < oldest[1].lastUsed) {
        oldest = [url, item];
      }
    }

    if (oldest) {
      this.cache.delete(oldest[0]);
      this.updateStats();
    }
  }

  /**
   * 清理过期缓存
   */
  async cleanup(): Promise<void> {
    const now = Date.now();
    const expiredUrls: string[] = [];

    for (const [url, item] of this.cache.entries()) {
      if (now - item.cachedAt > this.config.maxAge) {
        expiredUrls.push(url);
      }
    }

    // 删除过期项
    expiredUrls.forEach(url => this.cache.delete(url));

    if (expiredUrls.length > 0) {
      this.updateStats();
      await this.saveCache();
      await this.saveStats();
      console.log(`清理了 ${expiredUrls.length} 个过期缓存项`);
    }
  }

  /**
   * 清空所有缓存
   */
  async clearAll(): Promise<void> {
    this.cache.clear();
    this.updateStats();
    
    try {
      await chrome.storage.local.remove([this.CACHE_KEY, this.STATS_KEY]);
      console.log('已清空所有图片缓存');
    } catch (error) {
      console.error('清空缓存失败:', error);
    }
  }

  /**
   * 获取缓存统计
   */
  getStats(): CacheStats {
    this.updateStats();
    return { ...this.stats };
  }

  /**
   * 更新配置
   */
  async updateConfig(newConfig: Partial<CacheConfig>): Promise<void> {
    this.config = { ...this.config, ...newConfig };
    this.stats.maxSize = this.config.maxSize;
    
    await this.saveConfig();
    await this.saveStats();

    // 如果降低了限制，需要清理
    if (newConfig.maxSize || newConfig.maxCount) {
      await this.ensureCacheSpace(0);
      await this.saveCache();
    }

    // 重启清理定时器
    this.startCleanupTimer();
  }

  /**
   * 启动清理定时器
   */
  private startCleanupTimer(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
    }

    this.cleanupTimer = window.setInterval(() => {
      this.cleanup().catch(error => {
        console.error('定期清理失败:', error);
      });
    }, this.config.cleanupInterval);
  }

  /**
   * 停止清理定时器
   */
  stopCleanupTimer(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = undefined;
    }
  }

  /**
   * Blob转Base64
   */
  private blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        // 移除data:image/...;base64,前缀，只保留base64数据
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  /**
   * Base64转Blob URL
   */
  base64ToBlobUrl(base64: string, mimeType = 'image/jpeg'): string {
    try {
      const byteCharacters = atob(base64);
      const byteNumbers = new Array(byteCharacters.length);
      
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: mimeType });
      
      return URL.createObjectURL(blob);
    } catch (error) {
      console.error('Base64转换失败:', error);
      throw error;
    }
  }

  /**
   * 生成缓存ID
   */
  private generateId(url: string): string {
    return btoa(url).replace(/[^a-zA-Z0-9]/g, '').substring(0, 16);
  }

  /**
   * 获取格式化的大小字符串
   */
  static formatSize(bytes: number): string {
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }

    return `${size.toFixed(1)} ${units[unitIndex]}`;
  }

  /**
   * 销毁缓存管理器
   */
  destroy(): void {
    this.stopCleanupTimer();
    this.cache.clear();
  }
}

/**
 * 默认图片缓存管理器实例
 */
export const imageCacheManager = new ImageCacheManager();
