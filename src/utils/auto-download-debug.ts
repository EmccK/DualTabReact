/**
 * 自动下载调试工具
 * 专门用于调试和排查自动下载问题
 */

/**
 * 测试新标签页自动下载流程
 */
async function testAutoDownload() {
  console.log('🔍 开始测试自动下载流程...\n');
  
  try {
    // 1. 检查自动同步配置
    console.log('📋 1. 检查自动同步配置');
    const configResponse = await chrome.runtime.sendMessage({
      action: 'webdav_get_auto_sync_config',
    });
    
    if (configResponse?.success) {
      const { config, timeRecord } = configResponse.config;
      console.log('✅ 配置状态:');
      console.log('  enableAutoDownload:', config.enableAutoDownload);
      console.log('  downloadOnTabOpen:', config.downloadOnTabOpen);
      console.log('  最后下载时间:', timeRecord.lastDownloadTime ? new Date(timeRecord.lastDownloadTime) : '从未');
      console.log('  最后上传时间:', timeRecord.lastUploadTime ? new Date(timeRecord.lastUploadTime) : '从未');
      
      if (!config.enableAutoDownload || !config.downloadOnTabOpen) {
        console.warn('⚠️ 自动下载功能未启用');
        return;
      }
    } else {
      console.error('❌ 获取配置失败:', configResponse?.error);
      return;
    }
    
    // 2. 检查WebDAV状态
    console.log('\n🌐 2. 检查WebDAV状态');
    const statusResponse = await chrome.runtime.sendMessage({
      action: 'webdav_get_status',
    });
    
    if (statusResponse?.success) {
      console.log('✅ WebDAV状态:', statusResponse.status);
      console.log('  最后同步时间:', statusResponse.lastSyncTime ? new Date(statusResponse.lastSyncTime) : '从未');
      console.log('  是否有冲突:', statusResponse.hasConflict);
    } else {
      console.error('❌ 获取WebDAV状态失败:', statusResponse?.error);
      return;
    }
    
    // 3. 手动触发新标签页事件
    console.log('\n🆕 3. 模拟新标签页打开事件');
    const tabResponse = await chrome.runtime.sendMessage({
      action: 'webdav_trigger_auto_sync',
      eventType: 'tab_opened',
    });
    
    if (tabResponse?.success) {
      console.log('✅ 新标签页事件触发成功');
    } else {
      console.error('❌ 新标签页事件触发失败:', tabResponse?.error);
    }
    
    // 4. 等待一段时间检查结果
    console.log('\n⏳ 4. 等待自动下载处理...');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // 5. 检查更新后的时间记录
    console.log('\n📊 5. 检查执行结果');
    const finalConfigResponse = await chrome.runtime.sendMessage({
      action: 'webdav_get_auto_sync_config',
    });
    
    if (finalConfigResponse?.success) {
      const { timeRecord } = finalConfigResponse.config;
      console.log('📈 最终时间记录:');
      console.log('  最后下载时间:', timeRecord.lastDownloadTime ? new Date(timeRecord.lastDownloadTime) : '从未');
      console.log('  最后上传时间:', timeRecord.lastUploadTime ? new Date(timeRecord.lastUploadTime) : '从未');
      console.log('  最后数据变更:', timeRecord.lastDataChangeTime ? new Date(timeRecord.lastDataChangeTime) : '从未');
    }
    
    console.log('\n🎉 自动下载测试完成！');
    
  } catch (error) {
    console.error('❌ 测试过程中发生错误:', error);
  }
}

/**
 * 检查自动下载的前置条件
 */
async function checkAutoDownloadPreconditions() {
  console.log('🔍 检查自动下载前置条件...\n');
  
  const checks = [];
  
  try {
    // 1. WebDAV配置检查
    const webdavStatus = await chrome.runtime.sendMessage({
      action: 'webdav_get_status',
    });
    
    checks.push({
      name: 'WebDAV已配置',
      passed: webdavStatus?.success && webdavStatus.status !== 'error',
      details: webdavStatus?.status || 'unknown'
    });
    
    // 2. 自动同步配置检查
    const autoSyncConfig = await chrome.runtime.sendMessage({
      action: 'webdav_get_auto_sync_config',
    });
    
    if (autoSyncConfig?.success) {
      const { config } = autoSyncConfig.config;
      
      checks.push({
        name: '自动下载已启用',
        passed: config.enableAutoDownload === true,
        details: `enableAutoDownload: ${config.enableAutoDownload}`
      });
      
      checks.push({
        name: '新标签页触发已启用',
        passed: config.downloadOnTabOpen === true,
        details: `downloadOnTabOpen: ${config.downloadOnTabOpen}`
      });
    } else {
      checks.push({
        name: '获取自动同步配置',
        passed: false,
        details: autoSyncConfig?.error || 'unknown error'
      });
    }
    
    // 3. 显示检查结果
    console.log('📋 前置条件检查结果:');
    checks.forEach(check => {
      const icon = check.passed ? '✅' : '❌';
      console.log(`${icon} ${check.name}: ${check.details}`);
    });
    
    const allPassed = checks.every(check => check.passed);
    console.log(`\n${allPassed ? '🎉' : '⚠️'} 总体状态: ${allPassed ? '所有条件满足' : '存在问题'}`);
    
    return allPassed;
    
  } catch (error) {
    console.error('❌ 检查过程中发生错误:', error);
    return false;
  }
}

/**
 * 强制触发自动下载（忽略时间检查）
 */
async function forceAutoDownload() {
  console.log('🔧 强制触发自动下载...');
  
  try {
    // 直接调用下载API
    const downloadResponse = await chrome.runtime.sendMessage({
      action: 'webdav_download',
    });
    
    if (downloadResponse?.success) {
      console.log('✅ 强制下载成功:', downloadResponse.result?.message);
    } else {
      console.error('❌ 强制下载失败:', downloadResponse?.error);
    }
    
  } catch (error) {
    console.error('❌ 强制下载过程出错:', error);
  }
}

/**
 * 模拟完整的跨设备同步场景
 */
async function simulateCrossDeviceSync() {
  console.log('🔄 模拟跨设备同步场景...\n');
  
  try {
    // 1. 模拟设备A上传数据
    console.log('📤 1. 模拟设备A上传数据');
    const uploadResponse = await chrome.runtime.sendMessage({
      action: 'webdav_upload',
      options: { createBackup: false }
    });
    
    if (uploadResponse?.success) {
      console.log('✅ 设备A上传成功');
    } else {
      console.error('❌ 设备A上传失败:', uploadResponse?.error);
      return;
    }
    
    // 2. 等待一会儿
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // 3. 模拟设备B打开新标签页
    console.log('\n🆕 2. 模拟设备B打开新标签页');
    await testAutoDownload();
    
  } catch (error) {
    console.error('❌ 模拟过程中发生错误:', error);
  }
}

// 导出到全局供控制台使用
if (typeof window !== 'undefined') {
  (window as any).testAutoDownload = testAutoDownload;
  (window as any).checkAutoDownloadPreconditions = checkAutoDownloadPreconditions;
  (window as any).forceAutoDownload = forceAutoDownload;
  (window as any).simulateCrossDeviceSync = simulateCrossDeviceSync;
  
  console.log('🛠️ 自动下载调试工具已加载！');
  console.log('可用命令：');
  console.log('- testAutoDownload()                : 测试完整的自动下载流程');
  console.log('- checkAutoDownloadPreconditions()  : 检查前置条件');
  console.log('- forceAutoDownload()               : 强制触发下载');
  console.log('- simulateCrossDeviceSync()         : 模拟跨设备同步');
}