/**
 * 图标缓存性能测试和演示
 * 用于验证缓存优化的效果
 */

import { iconCache } from './icon-cache';
import { getCachedFaviconUrl, getBestFaviconUrl } from './icon-utils';

/**
 * 测试图标缓存性能
 */
export const testIconCachePerformance = async () => {
  console.log('=== 图标缓存性能测试 ===');
  
  const testUrls = [
    'https://www.google.com',
    'https://github.com',
    'https://stackoverflow.com',
    'https://developer.mozilla.org',
    'https://www.baidu.com',
    'https://www.zhihu.com',
    'https://www.bilibili.com',
    'https://www.taobao.com',
    'https://www.jd.com',
    'https://www.tmall.com'
  ];

  // 清空缓存以便测试
  iconCache.clear();
  
  console.log('1. 首次加载（无缓存）');
  const startTime1 = performance.now();
  
  const promises1 = testUrls.map(url => getBestFaviconUrl(url, 32));
  const results1 = await Promise.allSettled(promises1);
  
  const endTime1 = performance.now();
  const duration1 = endTime1 - startTime1;
  
  console.log(`首次加载耗时: ${duration1.toFixed(2)}ms`);
  console.log(`成功加载: ${results1.filter(r => r.status === 'fulfilled' && r.value).length}/${testUrls.length}`);
  
  // 等待一会再测试缓存效果
  await new Promise(resolve => setTimeout(resolve, 100));
  
  console.log('\n2. 二次加载（有缓存）');
  const startTime2 = performance.now();
  
  const promises2 = testUrls.map(url => getCachedFaviconUrl(url, 32));
  const results2 = await Promise.allSettled(promises2);
  
  const endTime2 = performance.now();
  const duration2 = endTime2 - startTime2;
  
  console.log(`缓存加载耗时: ${duration2.toFixed(2)}ms`);
  console.log(`从缓存获取: ${results2.filter(r => r.status === 'fulfilled' && r.value).length}/${testUrls.length}`);
  
  const improvement = ((duration1 - duration2) / duration1 * 100);
  console.log(`性能提升: ${improvement.toFixed(1)}%`);
  
  // 缓存统计
  console.log('\n3. 缓存统计');
  const stats = iconCache.getStats();
  console.log(`缓存条目数: ${stats.totalEntries}`);
  console.log(`缓存命中率: ${(stats.hitRate * 100).toFixed(1)}%`);
  
  return {
    firstLoadTime: duration1,
    cachedLoadTime: duration2,
    improvement: improvement,
    cacheStats: stats
  };
};

/**
 * 演示批量预加载功能
 */
export const demoIconPreloading = async () => {
  console.log('=== 图标预加载演示 ===');
  
  const urls = [
    'https://www.apple.com',
    'https://www.microsoft.com',
    'https://www.amazon.com',
    'https://www.facebook.com',
    'https://www.twitter.com'
  ];
  
  // 清空缓存
  iconCache.clear();
  
  console.log('开始预加载...');
  const startTime = performance.now();
  
  await iconCache.preload(urls, 32);
  
  const endTime = performance.now();
  console.log(`预加载完成，耗时: ${(endTime - startTime).toFixed(2)}ms`);
  
  // 检查缓存结果
  console.log('\n预加载结果:');
  urls.forEach(url => {
    const cached = iconCache.get(url, 32);
    console.log(`${url}: ${cached ? '已缓存' : '未缓存'}`);
  });
  
  const stats = iconCache.getStats();
  console.log(`\n缓存统计: ${stats.totalEntries} 个条目`);
};

/**
 * 监控缓存命中率
 */
export const monitorCacheHitRate = () => {
  console.log('=== 开始监控缓存命中率 ===');
  
  const startStats = iconCache.getStats();
  let lastStats = startStats;
  
  const interval = setInterval(() => {
    const currentStats = iconCache.getStats();
    
    if (currentStats.totalEntries !== lastStats.totalEntries) {
      console.log(`缓存更新: ${currentStats.totalEntries} 个条目, 命中率: ${(currentStats.hitRate * 100).toFixed(1)}%`);
      lastStats = currentStats;
    }
  }, 5000);
  
  // 10分钟后停止监控
  setTimeout(() => {
    clearInterval(interval);
    const finalStats = iconCache.getStats();
    console.log('=== 监控结束 ===');
    console.log(`最终统计: ${finalStats.totalEntries} 个条目, 命中率: ${(finalStats.hitRate * 100).toFixed(1)}%`);
  }, 10 * 60 * 1000);
  
  return () => clearInterval(interval);
};

/**
 * 测试不同尺寸的缓存效果
 */
export const testMultiSizeCache = async () => {
  console.log('=== 多尺寸缓存测试 ===');
  
  const testUrl = 'https://www.google.com';
  const sizes = [16, 24, 32, 48, 64];
  
  iconCache.clear();
  
  for (const size of sizes) {
    console.log(`\n测试尺寸: ${size}px`);
    
    const startTime = performance.now();
    const result = await getCachedFaviconUrl(testUrl, size);
    const endTime = performance.now();
    
    console.log(`结果: ${result ? '成功' : '失败'}`);
    console.log(`耗时: ${(endTime - startTime).toFixed(2)}ms`);
  }
  
  const stats = iconCache.getStats();
  console.log(`\n最终缓存: ${stats.totalEntries} 个条目`);
  
  // 验证不同尺寸的缓存是否独立
  sizes.forEach(size => {
    const cached = iconCache.get(testUrl, size);
    console.log(`${size}px: ${cached ? '已缓存' : '未缓存'}`);
  });
};

// 导出测试函数，方便在控制台中调用
if (typeof window !== 'undefined') {
  (window as any).iconCacheDemo = {
    testPerformance: testIconCachePerformance,
    demoPreloading: demoIconPreloading,
    monitorHitRate: monitorCacheHitRate,
    testMultiSize: testMultiSizeCache,
    getStats: () => iconCache.getStats(),
    clearCache: () => iconCache.clear()
  };
}