/**
 * 图标调试工具
 * 用于调试图标加载问题
 */

import { iconCache } from './icon-cache';
import { getBestFaviconUrl, getFaviconFallbackUrls, testImageUrl } from './icon-utils';

/**
 * 调试单个URL的图标加载过程
 */
export const debugIconLoading = async (url: string, size: number = 32) => {
  console.group(`🔍 调试图标加载: ${url}`);
  
  try {
    // 1. 检查缓存
    console.log('1. 检查缓存...');
    const validated = iconCache.getValidated(url, size);
    const cached = iconCache.get(url, size);
    console.log('已验证缓存:', validated || '无');
    console.log('普通缓存:', cached || '无');
    
    // 2. 获取fallback URLs
    console.log('\n2. 生成fallback URLs...');
    const fallbackUrls = getFaviconFallbackUrls(url, size);
    console.log('Fallback URLs:', fallbackUrls);
    
    // 3. 测试每个URL
    console.log('\n3. 测试每个URL...');
    for (let i = 0; i < fallbackUrls.length; i++) {
      const testUrl = fallbackUrls[i];
      console.log(`测试 URL ${i + 1}:`, testUrl);
      
      try {
        const isValid = await testImageUrl(testUrl, 3000);
        console.log(`结果:`, isValid ? '✅ 成功' : '❌ 失败');
        
        if (isValid) {
          console.log('🎉 找到有效图标!');
          break;
        }
      } catch (error) {
        console.log(`错误:`, error);
      }
    }
    
    // 4. 使用getBestFaviconUrl
    console.log('\n4. 使用getBestFaviconUrl...');
    const startTime = performance.now();
    const bestUrl = await getBestFaviconUrl(url, size);
    const endTime = performance.now();
    
    console.log('最佳URL:', bestUrl || '未找到');
    console.log('耗时:', `${(endTime - startTime).toFixed(2)}ms`);
    
    // 5. 检查缓存更新
    console.log('\n5. 检查缓存更新...');
    const newValidated = iconCache.getValidated(url, size);
    const newCached = iconCache.get(url, size);
    console.log('更新后的已验证缓存:', newValidated || '无');
    console.log('更新后的普通缓存:', newCached || '无');
    
    // 6. 缓存统计
    console.log('\n6. 缓存统计...');
    const stats = iconCache.getStats();
    console.log('缓存统计:', stats);
    
  } catch (error) {
    console.error('调试过程出错:', error);
  }
  
  console.groupEnd();
};

/**
 * 批量调试多个URL
 */
export const debugBatchIconLoading = async (urls: string[], size: number = 32) => {
  console.group(`🔍 批量调试图标加载 (${urls.length} 个URL)`);
  
  const results = [];
  
  for (const url of urls) {
    console.log(`\n处理: ${url}`);
    const startTime = performance.now();
    
    try {
      const result = await getBestFaviconUrl(url, size);
      const endTime = performance.now();
      
      results.push({
        url,
        result: result ? '成功' : '失败',
        faviconUrl: result,
        time: endTime - startTime
      });
      
      console.log(`结果: ${result ? '✅ 成功' : '❌ 失败'} (${(endTime - startTime).toFixed(2)}ms)`);
    } catch (error) {
      results.push({
        url,
        result: '错误',
        error: error.message,
        time: 0
      });
      console.log(`错误: ❌ ${error.message}`);
    }
  }
  
  // 汇总统计
  console.log('\n📊 汇总统计:');
  console.table(results);
  
  const successful = results.filter(r => r.result === '成功').length;
  const failed = results.filter(r => r.result === '失败').length;
  const errors = results.filter(r => r.result === '错误').length;
  const avgTime = results.reduce((sum, r) => sum + (r.time || 0), 0) / results.length;
  
  console.log(`成功: ${successful}/${urls.length} (${(successful/urls.length*100).toFixed(1)}%)`);
  console.log(`失败: ${failed}/${urls.length} (${(failed/urls.length*100).toFixed(1)}%)`);
  console.log(`错误: ${errors}/${urls.length} (${(errors/urls.length*100).toFixed(1)}%)`);
  console.log(`平均耗时: ${avgTime.toFixed(2)}ms`);
  
  const stats = iconCache.getStats();
  console.log('最终缓存统计:', stats);
  
  console.groupEnd();
  
  return results;
};

/**
 * 测试缓存性能
 */
export const testCachePerformance = async (url: string, size: number = 32) => {
  console.group(`⚡ 缓存性能测试: ${url}`);
  
  // 清空缓存
  iconCache.clear();
  
  // 第一次加载（无缓存）
  console.log('第一次加载（无缓存）...');
  const start1 = performance.now();
  const result1 = await getBestFaviconUrl(url, size);
  const end1 = performance.now();
  const time1 = end1 - start1;
  
  console.log(`结果: ${result1 ? '✅ 成功' : '❌ 失败'}`);
  console.log(`耗时: ${time1.toFixed(2)}ms`);
  
  // 第二次加载（有缓存）
  console.log('\n第二次加载（有缓存）...');
  const start2 = performance.now();
  const result2 = await getBestFaviconUrl(url, size);
  const end2 = performance.now();
  const time2 = end2 - start2;
  
  console.log(`结果: ${result2 ? '✅ 成功' : '❌ 失败'}`);
  console.log(`耗时: ${time2.toFixed(2)}ms`);
  
  // 性能提升
  const improvement = time1 > 0 ? ((time1 - time2) / time1 * 100) : 0;
  console.log(`\n性能提升: ${improvement.toFixed(1)}%`);
  
  const stats = iconCache.getStats();
  console.log('缓存统计:', stats);
  
  console.groupEnd();
  
  return {
    firstLoad: time1,
    secondLoad: time2,
    improvement: improvement,
    cacheStats: stats
  };
};

/**
 * 测试验证缓存功能
 */
export const testValidatedCache = async (url: string, size: number = 32) => {
  console.group(`✅ 验证缓存测试: ${url}`);
  
  // 清空缓存
  iconCache.clear();
  
  console.log('1. 首次加载（建立验证缓存）...');
  const start1 = performance.now();
  const result1 = await getBestFaviconUrl(url, size);
  const end1 = performance.now();
  
  console.log(`首次结果: ${result1 ? '✅ 成功' : '❌ 失败'}`);
  console.log(`首次耗时: ${(end1 - start1).toFixed(2)}ms`);
  console.log(`验证缓存: ${iconCache.getValidated(url, size) || '无'}`);
  
  console.log('\n2. 第二次加载（使用验证缓存）...');
  const start2 = performance.now();
  const result2 = await getBestFaviconUrl(url, size);
  const end2 = performance.now();
  
  console.log(`第二次结果: ${result2 ? '✅ 成功' : '❌ 失败'}`);
  console.log(`第二次耗时: ${(end2 - start2).toFixed(2)}ms`);
  console.log(`验证缓存命中: ${result1 === result2 && end2 < 10 ? '✅ 是' : '❌ 否'}`);
  
  const improvement = end1 > 0 ? ((end1 - end2) / end1 * 100) : 0;
  console.log(`\n性能提升: ${improvement.toFixed(1)}%`);
  
  console.groupEnd();
  
  return {
    firstLoad: end1 - start1,
    secondLoad: end2 - start2,
    improvement: improvement,
    validatedUrl: iconCache.getValidated(url, size),
    cacheHit: result1 === result2 && end2 < 10
  };
};

/**
 * 导出到全局对象，方便在控制台使用
 */
if (typeof window !== 'undefined') {
  (window as any).iconDebug = {
    debugSingle: debugIconLoading,
    debugBatch: debugBatchIconLoading,
    testCache: testCachePerformance,
    testValidated: testValidatedCache,
    getCacheStats: () => iconCache.getStats(),
    clearCache: () => iconCache.clear(),
    
    // 检查特定URL的缓存状态
    checkCache: (url: string, size: number = 32) => {
      const validated = iconCache.getValidated(url, size);
      const cached = iconCache.get(url, size);
      const hasValidated = iconCache.hasValidated(url, size);
      
      console.log(`🔍 缓存检查详情:`);
      console.log(`  URL: ${url}`);
      console.log(`  原始尺寸: ${size}`);
      console.log(`  已验证URL: ${validated || '无'}`);
      console.log(`  普通缓存: ${cached || '无'}`);
      console.log(`  有验证缓存: ${hasValidated ? '是' : '否'}`);
      
      return { validated, cached, hasValidated, originalSize: size };
    },
    
    // 快捷测试函数
    testGoogle: () => debugIconLoading('https://www.google.com'),
    testGithub: () => debugIconLoading('https://github.com'),
    testBaidu: () => debugIconLoading('https://www.baidu.com'),
    
    // 验证缓存测试
    testGoogleValidated: () => testValidatedCache('https://www.google.com'),
    testGithubValidated: () => testValidatedCache('https://github.com'),
    
    // 批量测试常用网站
    testCommonSites: () => debugBatchIconLoading([
      'https://www.google.com',
      'https://github.com',
      'https://stackoverflow.com',
      'https://www.baidu.com',
      'https://www.zhihu.com'
    ])
  };
  
  console.log('🛠️ 图标调试工具已加载到 window.iconDebug');
  console.log('使用方法:');
  console.log('  window.iconDebug.testGoogle() - 测试Google图标');
  console.log('  window.iconDebug.testGoogleValidated() - 测试验证缓存功能');
  console.log('  window.iconDebug.checkCache("https://test.com") - 检查缓存状态');
  console.log('  window.iconDebug.testCommonSites() - 测试常用网站');
  console.log('  window.iconDebug.debugSingle("https://test.com") - 调试指定URL');
  
  // 立即测试你刚才看到的test.com缓存状态
  setTimeout(() => {
    console.log('🔍 检查test.com的缓存状态:');
    const testResult = (window as any).iconDebug.checkCache('https://test.com');
    console.log('test.com缓存状态:', testResult);
  }, 1000);
}