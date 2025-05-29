/**
 * Popup布局容器组件
 */

import React from 'react';
import { AlertTriangle } from 'lucide-react';

interface PopupLayoutProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  loading?: boolean;
  error?: string | null;
}

export function PopupLayout({ 
  children, 
  title = "快速添加书签", 
  subtitle,
  loading = false,
  error = null 
}: PopupLayoutProps) {
  return (
    <div className="w-full h-full bg-white flex flex-col rounded-xl overflow-hidden shadow-lg">
      {/* 头部 */}
      <header className="px-5 py-3 border-b border-gray-200 bg-gradient-to-r from-indigo-50 to-blue-50">
        <div className="text-center">
          <h1 className="text-lg font-semibold text-gray-800">
            {title}
          </h1>
          {subtitle && (
            <p className="text-sm text-gray-600 mt-1">
              {subtitle}
            </p>
          )}
        </div>
      </header>

      {/* 主要内容区域 */}
      <main className="flex-1 overflow-y-auto">
        {/* 全局加载状态 */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-4"></div>
              <p className="text-sm text-gray-600">加载中...</p>
            </div>
          </div>
        )}

        {/* 全局错误状态 */}
        {error && !loading && (
          <div className="p-5">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start">
                <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5 mr-3 flex-shrink-0" />
                <div>
                  <h3 className="text-sm font-medium text-red-800 mb-1">
                    加载失败
                  </h3>
                  <p className="text-xs text-red-700">
                    {error}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 正常内容 */}
        {!loading && !error && (
          <div className="px-5 py-4">
            {children}
          </div>
        )}
      </main>

      {/* 底部信息 */}
      <footer className="px-5 py-2 border-t border-gray-100 bg-gradient-to-r from-gray-50 to-indigo-50">
        <p className="text-center text-xs text-gray-500">
          DualTab React - 快速书签管理
        </p>
      </footer>
    </div>
  );
}
