// DualTab 内容脚本
// 在普通网页中运行，用于提取页面信息等功能

// 调试模式检查
const DEBUG = process.env.NODE_ENV === 'development'

if (DEBUG) {
}

// 监听来自background script的消息
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  
  switch (message.action) {
    case 'get_page_info':
      // 获取当前页面信息
      const pageInfo = {
        title: document.title,
        url: window.location.href,
        favicon: getFaviconUrl(),
        description: getPageDescription()
      }
      sendResponse(pageInfo)
      break
      
    case 'refresh_bookmarks':
      // 如果当前页面是新标签页，可以处理刷新逻辑
      sendResponse({ success: true })
      break
      
    default:
      sendResponse({ success: false, error: 'Unknown action' })
  }
  
  return true
})

// 获取页面favicon URL
function getFaviconUrl(): string {
  // 首先尝试从页面的link标签获取
  const favicon = document.querySelector('link[rel*="icon"]') as HTMLLinkElement
  if (favicon && favicon.href) {
    return favicon.href
  }

  // 备选1：尝试网站根目录的favicon.ico
  const protocol = window.location.protocol
  const domain = window.location.hostname
  const port = window.location.port ? `:${window.location.port}` : ''
  return `${protocol}//${domain}${port}/favicon.ico`
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
  }
  // 这里可以添加页面加载完成后的初始化逻辑
}

export {}
