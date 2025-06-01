// DualTab 内容脚本
// 在普通网页中运行，用于提取页面信息等功能

// 调试模式检查
const DEBUG = process.env.NODE_ENV === 'development'

if (DEBUG) {
  console.log('[DEBUG] DualTab content script loaded on:', window.location.href)
}

// 监听来自background script的消息
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  console.log('[DEBUG] Content script received message:', message)
  
  switch (message.action) {
    case 'get_page_info':
      // 获取当前页面信息
      const pageInfo = {
        title: document.title,
        url: window.location.href,
        favicon: getFaviconUrl(),
        description: getPageDescription()
      }
      console.log('[DEBUG] Sending page info:', pageInfo)
      sendResponse(pageInfo)
      break
      
    case 'refresh_bookmarks':
      // 如果当前页面是新标签页，可以处理刷新逻辑
      console.log('[DEBUG] Bookmark refresh message received')
      sendResponse({ success: true })
      break
      
    default:
      console.log('[DEBUG] Unknown message action:', message.action)
      sendResponse({ success: false, error: 'Unknown action' })
  }
  
  return true
})

// 获取页面favicon URL
function getFaviconUrl(): string {
  const favicon = document.querySelector('link[rel*="icon"]') as HTMLLinkElement
  if (favicon && favicon.href) {
    return favicon.href
  }
  
  // 备选：使用Google的favicon服务
  const domain = window.location.hostname
  return `https://www.google.com/s2/favicons?domain=${domain}&sz=64`
}

// 获取页面描述
function getPageDescription(): string {
  const metaDescription = document.querySelector('meta[name="description"]') as HTMLMetaElement
  if (metaDescription && metaDescription.content) {
    return metaDescription.content
  }
  
  const ogDescription = document.querySelector('meta[property="og:description"]') as HTMLMetaElement
  if (ogDescription && ogDescription.content) {
    return ogDescription.content
  }
  
  return ''
}

// 页面加载完成后的初始化
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initialize)
} else {
  initialize()
}

function initialize() {
  if (DEBUG) {
    console.log('[DEBUG] Content script initialized')
  }
  // 这里可以添加页面加载完成后的初始化逻辑
}

export {}
