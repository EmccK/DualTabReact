import { useEffect, useState } from 'react'

function PopupApp() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    console.log('[DEBUG] Popup App mounted')
  }, [])

  if (!mounted) {
    return (
      <div className="flex items-center justify-center h-96 bg-gray-100">
        <div className="text-sm text-gray-600">Loading...</div>
      </div>
    )
  }

  return (
    <div className="w-full h-full bg-white">
      <div className="p-4">
        <div className="text-center mb-4">
          <h1 className="text-xl font-bold text-gray-800 mb-2">
            快速添加书签
          </h1>
          <p className="text-sm text-gray-600">
            React重构版本 - 基础架构已完成
          </p>
        </div>
        
        {/* 临时占位内容 */}
        <div className="space-y-4">
          <div className="border rounded-lg p-4">
            <h3 className="font-semibold mb-2">书签表单</h3>
            <p className="text-sm text-gray-600">即将实现...</p>
          </div>
          <div className="border rounded-lg p-4">
            <h3 className="font-semibold mb-2">分类选择</h3>
            <p className="text-sm text-gray-600">即将实现...</p>
          </div>
          <div className="border rounded-lg p-4">
            <h3 className="font-semibold mb-2">图标选择</h3>
            <p className="text-sm text-gray-600">即将实现...</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PopupApp
