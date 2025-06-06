/**
 * 消息路由调试工具
 * 帮助调试WebDAV自动同步的消息传递
 */

/**
 * 测试自动同步消息路由
 */
async function testAutoSyncMessages() {
  console.log('🔧 开始测试自动同步消息路由...');
  
  const tests = [
    {
      name: '获取自动同步配置',
      action: 'webdav_get_auto_sync_config',
      data: {},
    },
    {
      name: '更新自动同步配置',
      action: 'webdav_update_auto_sync_config',
      data: {
        config: {
          enableAutoUpload: true,
          enableAutoDownload: true,
          uploadDelay: 3000,
          downloadOnTabOpen: true,
        }
      },
    },
    {
      name: '触发数据变更事件',
      action: 'webdav_trigger_auto_sync',
      data: {
        eventType: 'data_changed',
      },
    },
    {
      name: '触发新标签页事件',
      action: 'webdav_trigger_auto_sync',
      data: {
        eventType: 'tab_opened',
      },
    },
  ];

  for (const test of tests) {
    try {
      console.log(`\n📤 测试: ${test.name}`);
      console.log(`   Action: ${test.action}`);
      console.log(`   Data:`, test.data);
      
      const response = await chrome.runtime.sendMessage({
        action: test.action,
        ...test.data,
      });
      
      console.log(`✅ 响应:`, response);
      
      if (!response || response.success === false) {
        console.warn(`⚠️ 测试失败: ${test.name}`);
        console.warn(`   错误:`, response?.error || 'No response');
      } else {
        console.log(`✅ 测试成功: ${test.name}`);
      }
      
      // 等待一下再执行下一个测试
      await new Promise(resolve => setTimeout(resolve, 500));
      
    } catch (error) {
      console.error(`❌ 测试异常: ${test.name}`);
      console.error(`   错误:`, error);
    }
  }
  
  console.log('\n🎉 消息路由测试完成！');
}

/**
 * 监听所有Chrome消息（调试用）
 */
function startMessageLogging() {
  console.log('📡 开始监听Chrome消息...');
  
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action && message.action.includes('auto_sync') || message.action.includes('webdav_')) {
      console.log('📨 收到消息:', {
        action: message.action,
        data: message,
        sender: sender.tab ? `Tab ${sender.tab.id}` : 'Extension',
        timestamp: new Date().toLocaleTimeString(),
      });
    }
    return false; // 不拦截消息
  });
}

/**
 * 检查WebDAV配置状态
 */
async function checkWebDAVStatus() {
  console.log('🔍 检查WebDAV状态...');
  
  try {
    const response = await chrome.runtime.sendMessage({
      action: 'webdav_get_status',
    });
    
    console.log('📊 WebDAV状态:', response);
    return response;
  } catch (error) {
    console.error('❌ 获取WebDAV状态失败:', error);
    return null;
  }
}

/**
 * 完整的诊断流程
 */
async function diagnoseAutoSync() {
  console.log('🏥 开始自动同步诊断...\n');
  
  // 1. 检查WebDAV状态
  await checkWebDAVStatus();
  
  // 2. 开始消息监听
  startMessageLogging();
  
  // 3. 测试消息路由
  await testAutoSyncMessages();
  
  // 4. 检查存储
  try {
    const storage = await chrome.storage.local.get([
      'auto_sync_config',
      'sync_time_record',
      'webdav_config'
    ]);
    console.log('\n📦 存储状态:', storage);
  } catch (error) {
    console.error('❌ 读取存储失败:', error);
  }
  
  console.log('\n✨ 诊断完成！如果仍有问题，请检查：');
  console.log('1. WebDAV服务器是否配置正确');
  console.log('2. 网络连接是否正常');
  console.log('3. 浏览器控制台是否有其他错误信息');
}

// 导出到全局供控制台使用
if (typeof window !== 'undefined') {
  (window as any).testAutoSyncMessages = testAutoSyncMessages;
  (window as any).startMessageLogging = startMessageLogging;
  (window as any).checkWebDAVStatus = checkWebDAVStatus;
  (window as any).diagnoseAutoSync = diagnoseAutoSync;
  
  console.log('🛠️ 自动同步调试工具已加载！');
  console.log('可用命令：');
  console.log('- testAutoSyncMessages() : 测试消息路由');
  console.log('- startMessageLogging()  : 开始消息监听');
  console.log('- checkWebDAVStatus()    : 检查WebDAV状态');
  console.log('- diagnoseAutoSync()     : 完整诊断流程');
}