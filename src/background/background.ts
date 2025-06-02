// DualTab 后台服务Worker
// 处理插件的后台逻辑和消息通信

import { initializeSyncManager } from '../services/sync/sync-manager';

// 调试模式检查
const DEBUG = process.env.NODE_ENV === 'development'

if (DEBUG) {
  console.log('[DEBUG] DualTab background service worker started')
}

// 初始化WebDAV同步管理器
let syncManager = null;
try {
  syncManager = initializeSyncManager();
  if (DEBUG) {
    console.log('[DEBUG] WebDAV sync manager initialized')
  }
} catch (error) {
  if (DEBUG) {
    console.error('[DEBUG] Failed to initialize sync manager:', error)
  }
}

// 监听来自content script或popup的消息
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (DEBUG) {
    console.log('[DEBUG] Background received message:', message)
  }
  
  switch (message.action) {
    case 'refresh_bookmarks':
      // 处理书签刷新请求
      if (DEBUG) {
        console.log('[DEBUG] Handling bookmark refresh request')
      }
      // 向所有新标签页发送刷新消息
      chrome.tabs.query({}, (tabs) => {
        tabs.forEach((tab) => {
          if (tab.url && tab.url.startsWith('chrome-extension://')) {
            chrome.tabs.sendMessage(tab.id!, { action: 'refresh_bookmarks' })
              .catch(() => {
                // 忽略无法发送消息的标签页
                if (DEBUG) {
                  console.log('[DEBUG] Could not send message to tab:', tab.id)
                }
              })
          }
        })
      })
      sendResponse({ success: true })
      break
      
    case 'get_selected_category':
      // 获取newtab页面当前选中的分类
      if (DEBUG) {
        console.log('[DEBUG] Getting selected category from newtab')
      }
      chrome.tabs.query({}, (tabs) => {
        const newtabTabs = tabs.filter(tab => 
          tab.url && tab.url.includes('newtab.html')
        )
        
        if (newtabTabs.length > 0) {
          // 向第一个新标签页请求选中的分类
          chrome.tabs.sendMessage(newtabTabs[0].id!, { action: 'get_selected_category' })
            .then((response) => {
              sendResponse({ success: true, selectedCategoryId: response?.selectedCategoryId })
            })
            .catch(() => {
              sendResponse({ success: false, error: 'No newtab response' })
            })
        } else {
          sendResponse({ success: false, error: 'No newtab found' })
        }
      })
      return true // 保持异步响应
      break

    // WebDAV同步相关消息 - 交给同步管理器处理
    case 'webdav_sync':
    case 'webdav_upload':
    case 'webdav_download':
    case 'webdav_test_connection':
    case 'webdav_get_status':
    case 'webdav_update_config':
    case 'webdav_resolve_conflict':
    case 'webdav_enable_auto_sync':
    case 'webdav_clear_sync_data':
      // 这些消息由同步管理器处理，返回false让同步管理器的监听器处理
      if (DEBUG) {
        console.log('[DEBUG] WebDAV message forwarded to sync manager:', message.action)
      }
      return false
      
    case 'storage_changed':
      // 处理存储变化通知
      if (DEBUG) {
        console.log('[DEBUG] Storage changed notification')
      }
      // 向所有扩展页面广播存储变化
      chrome.tabs.query({}, (tabs) => {
        tabs.forEach((tab) => {
          if (tab.url && tab.url.startsWith('chrome-extension://')) {
            chrome.tabs.sendMessage(tab.id!, message)
              .catch(() => {
                // 忽略发送失败的情况
              })
          }
        })
      })
      sendResponse({ success: true })
      break

    case 'sync_status_changed':
      // 处理同步状态变化通知
      if (DEBUG) {
        console.log('[DEBUG] Sync status changed:', message.data?.status)
      }
      // 向所有扩展页面广播状态变化
      chrome.tabs.query({}, (tabs) => {
        tabs.forEach((tab) => {
          if (tab.url && tab.url.startsWith('chrome-extension://')) {
            chrome.tabs.sendMessage(tab.id!, message)
              .catch(() => {
                // 忽略发送失败的情况
              })
          }
        })
      })
      sendResponse({ success: true })
      break
      
    default:
      if (DEBUG) {
        console.log('[DEBUG] Unknown message action:', message.action)
      }
      sendResponse({ success: false, error: 'Unknown action' })
  }
  
  return true // 保持消息通道开放
})

// 监听插件安装/启动事件
chrome.runtime.onInstalled.addListener((details) => {
  if (DEBUG) {
    console.log('[DEBUG] Extension installed/updated:', details)
  }
  
  if (details.reason === 'install') {
    if (DEBUG) {
      console.log('[DEBUG] First time installation')
    }
    // 初始化默认WebDAV配置
    chrome.storage.local.set({
      'webdav_config': {
        serverUrl: '',
        username: '',
        password: '',
        syncPath: '/DualTab',
        enabled: false,
        autoSyncInterval: 30,
      }
    }).catch((error) => {
      if (DEBUG) {
        console.error('[DEBUG] Failed to initialize WebDAV config:', error)
      }
    })
  } else if (details.reason === 'update') {
    if (DEBUG) {
      console.log('[DEBUG] Extension updated')
    }
    // 清理过期的同步锁和状态
    chrome.storage.local.remove(['sync_lock']).catch(() => {
      // 忽略错误
    })
    
    // 重新初始化同步管理器
    if (syncManager) {
      try {
        syncManager.stop()
        syncManager = initializeSyncManager()
        if (DEBUG) {
          console.log('[DEBUG] Sync manager reinitialized after update')
        }
      } catch (error) {
        if (DEBUG) {
          console.error('[DEBUG] Failed to reinitialize sync manager:', error)
        }
      }
    }
  }
})

// 监听标签页更新事件
chrome.tabs.onUpdated.addListener((_tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    if (DEBUG) {
      console.log('[DEBUG] Tab updated:', tab.url)
    }
    // 可以在这里处理特定URL的逻辑
  }
})

export {}
