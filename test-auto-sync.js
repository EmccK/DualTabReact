/**
 * 测试自动同步功能的脚本
 * 在扩展程序的console中运行
 */

// 测试函数：模拟新标签页打开事件
async function testAutoSyncTabOpened() {
  console.log('=== 测试自动同步 - 新标签页打开 ===');
  
  try {
    const response = await chrome.runtime.sendMessage({
      action: 'auto_sync_tab_opened'
    });
    
    console.log('发送 auto_sync_tab_opened 消息结果:', response);
  } catch (error) {
    console.error('发送消息失败:', error);
  }
}

// 测试函数：获取自动同步配置
async function testGetAutoSyncConfig() {
  console.log('=== 获取自动同步配置 ===');
  
  try {
    const response = await chrome.runtime.sendMessage({
      action: 'webdav_get_auto_sync_config'
    });
    
    console.log('自动同步配置:', response);
  } catch (error) {
    console.error('获取配置失败:', error);
  }
}

// 测试函数：检查WebDAV配置
async function testWebDAVConfig() {
  console.log('=== 检查WebDAV配置 ===');
  
  try {
    const result = await chrome.storage.local.get(['webdav_config']);
    console.log('WebDAV配置:', result.webdav_config);
  } catch (error) {
    console.error('获取WebDAV配置失败:', error);
  }
}

// 测试函数：手动触发自动同步
async function testTriggerAutoSync() {
  console.log('=== 手动触发自动同步 ===');
  
  try {
    const response = await chrome.runtime.sendMessage({
      action: 'webdav_trigger_auto_sync',
      eventType: 'tab_opened'
    });
    
    console.log('触发自动同步结果:', response);
  } catch (error) {
    console.error('触发自动同步失败:', error);
  }
}

// 测试函数：检查后台服务状态
async function testBackgroundStatus() {
  console.log('=== 检查后台服务状态 ===');
  
  try {
    const response = await chrome.runtime.sendMessage({
      action: 'webdav_get_status'
    });
    
    console.log('后台服务状态:', response);
  } catch (error) {
    console.error('获取后台状态失败:', error);
  }
}

// 测试函数：强制手动下载
async function testManualDownload() {
  console.log('=== 测试手动下载 ===');
  
  try {
    const response = await chrome.runtime.sendMessage({
      action: 'webdav_download'
    });
    
    console.log('手动下载结果:', response);
  } catch (error) {
    console.error('手动下载失败:', error);
  }
}

// 综合测试函数
async function runAllTests() {
  console.log('开始运行所有自动同步测试...');
  
  await testWebDAVConfig();
  await new Promise(resolve => setTimeout(resolve, 500));
  
  await testGetAutoSyncConfig();
  await new Promise(resolve => setTimeout(resolve, 500));
  
  await testBackgroundStatus();
  await new Promise(resolve => setTimeout(resolve, 500));
  
  await testAutoSyncTabOpened();
  await new Promise(resolve => setTimeout(resolve, 500));
  
  await testTriggerAutoSync();
  await new Promise(resolve => setTimeout(resolve, 500));
  
  await testManualDownload();
  
  console.log('所有测试完成！');
}

// 导出测试函数
window.testAutoSync = {
  testAutoSyncTabOpened,
  testGetAutoSyncConfig,
  testWebDAVConfig,
  testTriggerAutoSync,
  testBackgroundStatus,
  testManualDownload,
  runAllTests
};

console.log('自动同步测试函数已加载。使用方法：');
console.log('- window.testAutoSync.runAllTests() // 运行所有测试');
console.log('- window.testAutoSync.testAutoSyncTabOpened() // 测试新标签页事件');
console.log('- window.testAutoSync.testGetAutoSyncConfig() // 获取配置');
console.log('- window.testAutoSync.testWebDAVConfig() // 检查WebDAV配置');