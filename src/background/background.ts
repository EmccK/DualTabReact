// DualTab 后台服务Worker
// 处理插件的后台逻辑和消息通信

// 调试模式检查
const DEBUG = process.env.NODE_ENV === 'development'

if (DEBUG) {
  console.log('[DEBUG] DualTab background service worker started')
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
            .catch((error) => {
              sendResponse({ success: false, error: 'No newtab response' })
            })
        } else {
          sendResponse({ success: false, error: 'No newtab found' })
        }
      })
      return true // 保持异步响应
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
    // 可以在这里初始化默认数据
  } else if (details.reason === 'update') {
    if (DEBUG) {
      console.log('[DEBUG] Extension updated')
    }
    // 可以在这里处理数据迁移
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
