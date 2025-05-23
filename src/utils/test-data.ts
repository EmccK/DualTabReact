/**
 * 开发测试数据初始化脚本
 * 用于在开发环境中快速创建测试书签数据
 */

// 示例书签数据
const testBookmarks = [
  {
    title: "Google",
    url: "https://www.google.com",
    internalUrl: "http://internal.google.com",
    externalUrl: "https://www.google.com",
    iconType: "official",
    position: 0
  },
  {
    title: "GitHub",
    url: "https://github.com",
    internalUrl: "http://git.internal.com",
    externalUrl: "https://github.com",
    iconType: "official",
    position: 1
  },
  {
    title: "百度",
    url: "https://www.baidu.com",
    iconType: "official",
    position: 2
  },
  {
    title: "新浪",
    url: "https://www.sina.com.cn",
    iconType: "official",
    position: 3
  },
  {
    title: "淘宝",
    url: "https://www.taobao.com",
    iconType: "official",
    position: 4
  },
  {
    title: "京东",
    url: "https://www.jd.com",
    iconType: "official",
    position: 5
  },
  {
    title: "文字图标测试",
    url: "https://example.com",
    iconType: "text",
    iconText: "测",
    iconColor: "#ffffff",
    backgroundColor: "#ff4444",
    position: 6
  },
  {
    title: "另一个文字图标",
    url: "https://test.com",
    iconType: "text",
    iconText: "T",
    iconColor: "#ffffff", 
    backgroundColor: "#4444ff",
    position: 7
  }
];

// 创建测试数据的函数
async function createTestBookmarks() {
  try {
    // 清空现有书签
    await chrome.storage.local.clear();
    
    // 生成完整的书签数据
    const now = Date.now();
    const bookmarks = testBookmarks.map((bookmark, index) => ({
      id: `bm_${now}_${index}`,
      title: bookmark.title,
      url: bookmark.url,
      internalUrl: bookmark.internalUrl || '',
      externalUrl: bookmark.externalUrl || '',
      icon: bookmark.icon || '',
      iconType: bookmark.iconType || 'official',
      iconText: bookmark.iconText || '',
      iconColor: bookmark.iconColor || '#3B82F6',
      backgroundColor: bookmark.backgroundColor || '#FFFFFF',
      position: bookmark.position || index,
      createdAt: now + index,
      updatedAt: now + index
    }));

    // 保存到Chrome存储
    await chrome.storage.local.set({ bookmarks });
    
    console.log('✅ 测试书签数据创建成功:', bookmarks);
    return bookmarks;
  } catch (error) {
    console.error('❌ 创建测试书签数据失败:', error);
    throw error;
  }
}

// 清空书签数据的函数
async function clearAllBookmarks() {
  try {
    await chrome.storage.local.remove('bookmarks');
    console.log('✅ 书签数据已清空');
  } catch (error) {
    console.error('❌ 清空书签数据失败:', error);
    throw error;
  }
}

// 查看当前书签数据的函数
async function viewCurrentBookmarks() {
  try {
    const result = await chrome.storage.local.get('bookmarks');
    const bookmarks = result.bookmarks || [];
    console.log('📖 当前书签数据:', bookmarks);
    console.log(`📊 书签总数: ${bookmarks.length}`);
    return bookmarks;
  } catch (error) {
    console.error('❌ 获取书签数据失败:', error);
    throw error;
  }
}

// 导出到全局对象，方便在开发者控制台中使用
if (typeof window !== 'undefined') {
  window.testBookmarks = {
    create: createTestBookmarks,
    clear: clearAllBookmarks,
    view: viewCurrentBookmarks,
    data: testBookmarks
  };
  
  console.log('🛠️ 测试工具已加载，可在控制台中使用：');
  console.log('- window.testBookmarks.create() // 创建测试书签');
  console.log('- window.testBookmarks.clear() // 清空所有书签');
  console.log('- window.testBookmarks.view() // 查看当前书签');
}

export { createTestBookmarks, clearAllBookmarks, viewCurrentBookmarks, testBookmarks };
