/**
 * 自动同步测试工具
 * 用于测试新的自动同步逻辑
 */

/**
 * 测试自动同步功能
 */
async function testAutoSync() {
  console.log('🚀 开始测试自动同步功能...');
  
  try {
    // 1. 获取自动同步配置
    console.log('📋 获取自动同步配置...');
    const configResponse = await chrome.runtime.sendMessage({
      action: 'webdav_get_auto_sync_config',
    });
    
    if (configResponse?.success) {
      console.log('✅ 配置获取成功:', configResponse.config);
    } else {
      console.warn('⚠️ 配置获取失败:', configResponse?.error);
    }
    
    // 2. 测试数据变更触发
    console.log('📝 测试数据变更触发...');
    const dataChangeResponse = await chrome.runtime.sendMessage({
      action: 'webdav_trigger_auto_sync',
      eventType: 'data_changed',
    });
    
    if (dataChangeResponse?.success) {
      console.log('✅ 数据变更事件触发成功');
    } else {
      console.warn('⚠️ 数据变更事件触发失败:', dataChangeResponse?.error);
    }
    
    // 3. 测试新标签页触发
    console.log('🆕 测试新标签页触发...');
    const tabOpenResponse = await chrome.runtime.sendMessage({
      action: 'webdav_trigger_auto_sync',
      eventType: 'tab_opened',
    });
    
    if (tabOpenResponse?.success) {
      console.log('✅ 新标签页事件触发成功');
    } else {
      console.warn('⚠️ 新标签页事件触发失败:', tabOpenResponse?.error);
    }
    
    // 4. 获取WebDAV同步状态
    console.log('📊 获取同步状态...');
    const statusResponse = await chrome.runtime.sendMessage({
      action: 'webdav_get_status',
    });
    
    if (statusResponse?.success) {
      console.log('✅ 同步状态:', {
        status: statusResponse.status,
        lastSyncTime: statusResponse.lastSyncTime ? new Date(statusResponse.lastSyncTime) : '从未',
        hasConflict: statusResponse.hasConflict,
        currentTask: statusResponse.currentTask,
      });
    } else {
      console.warn('⚠️ 状态获取失败:', statusResponse?.error);
    }
    
    console.log('🎉 自动同步测试完成!');
    
  } catch (error) {
    console.error('❌ 测试过程中发生错误:', error);
  }
}

/**
 * 测试数据变更检测
 */
async function testDataChangeDetection() {
  console.log('🔍 开始测试数据变更检测...');
  
  try {
    // 模拟书签数据变更
    const currentBookmarks = await new Promise((resolve) => {
      chrome.storage.local.get(['bookmarks'], (result) => {
        resolve(result.bookmarks || []);
      });
    });
    
    console.log('📚 当前书签数量:', currentBookmarks.length);
    
    // 添加一个测试书签
    const testBookmark = {
      id: 'test_' + Date.now(),
      title: '测试书签 - ' + new Date().toLocaleString(),
      url: 'https://example.com',
      categoryId: 'default',
      position: currentBookmarks.length,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    
    const updatedBookmarks = [...currentBookmarks, testBookmark];
    
    console.log('➕ 添加测试书签:', testBookmark.title);
    
    // 保存到存储（这应该触发自动同步）
    await new Promise((resolve, reject) => {
      chrome.storage.local.set({ bookmarks: updatedBookmarks }, () => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          resolve(true);
        }
      });
    });
    
    console.log('✅ 书签保存成功，应该触发自动同步');
    
    // 等待一段时间让自动同步处理
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // 检查同步状态
    const statusResponse = await chrome.runtime.sendMessage({
      action: 'webdav_get_status',
    });
    
    if (statusResponse?.success) {
      console.log('📊 同步后状态:', statusResponse.status);
    }
    
  } catch (error) {
    console.error('❌ 数据变更检测测试失败:', error);
  }
}

/**
 * 显示测试菜单
 */
function showTestMenu() {
  console.log(`
🔧 自动同步测试工具

可用命令:
- testAutoSync()           : 测试自动同步基本功能
- testDataChangeDetection(): 测试数据变更检测
- showAutoSyncConfig()     : 显示当前自动同步配置
- triggerUpload()         : 手动触发上传
- triggerDownload()       : 手动触发下载

使用方法: 在控制台中直接调用函数名
例如: testAutoSync()
  `);
}

/**
 * 显示自动同步配置
 */
async function showAutoSyncConfig() {
  try {
    const response = await chrome.runtime.sendMessage({
      action: 'webdav_get_auto_sync_config',
    });
    
    if (response?.success) {
      console.log('⚙️ 当前自动同步配置:');
      console.table(response.config.config);
      console.log('⏰ 时间记录:');
      console.table(response.config.timeRecord);
    } else {
      console.warn('⚠️ 无法获取配置:', response?.error);
    }
  } catch (error) {
    console.error('❌ 获取配置失败:', error);
  }
}

/**
 * 手动触发上传
 */
async function triggerUpload() {
  console.log('⬆️ 手动触发上传...');
  
  try {
    const response = await chrome.runtime.sendMessage({
      action: 'webdav_upload',
      options: { createBackup: false },
    });
    
    if (response?.success) {
      console.log('✅ 上传成功:', response.result?.message);
    } else {
      console.warn('⚠️ 上传失败:', response?.error);
    }
  } catch (error) {
    console.error('❌ 上传过程出错:', error);
  }
}

/**
 * 手动触发下载
 */
async function triggerDownload() {
  console.log('⬇️ 手动触发下载...');
  
  try {
    const response = await chrome.runtime.sendMessage({
      action: 'webdav_download',
    });
    
    if (response?.success) {
      console.log('✅ 下载成功:', response.result?.message);
    } else {
      console.warn('⚠️ 下载失败:', response?.error);
    }
  } catch (error) {
    console.error('❌ 下载过程出错:', error);
  }
}

// 导出到全局作用域供控制台使用
if (typeof window !== 'undefined') {
  window.testAutoSync = testAutoSync;
  window.testDataChangeDetection = testDataChangeDetection;
  window.showTestMenu = showTestMenu;
  window.showAutoSyncConfig = showAutoSyncConfig;
  window.triggerUpload = triggerUpload;
  window.triggerDownload = triggerDownload;
}

// 自动显示测试菜单
if (typeof console !== 'undefined') {
  showTestMenu();
}