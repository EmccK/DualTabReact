import { useEffect, useState } from 'react'

function NewTabApp() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    console.log('[DEBUG] NewTab App mounted')
  }, [])

  if (!mounted) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="text-lg text-gray-600">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">
            DualTab 新标签页
          </h1>
          <p className="text-gray-600 mb-8">
            React重构版本 - 基础架构已完成
          </p>
          
          {/* 临时占位内容 */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold mb-2">书签管理</h3>
              <p className="text-gray-600">即将实现...</p>
            </div>
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold mb-2">分类系统</h3>
              <p className="text-gray-600">即将实现...</p>
            </div>
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold mb-2">背景图片</h3>
              <p className="text-gray-600">即将实现...</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default NewTabApp
