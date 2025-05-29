/**
 * 当前标签页信息显示组件
 */

import React from 'react';
import type { CurrentTabInfo } from '@/types/popup/tab.types';
import { formatUrlForDisplay } from '@/utils/popup/urlHelpers';
import { Globe, AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface CurrentTabInfoProps {
  tabInfo: CurrentTabInfo | null;
  loading: boolean;
  error: string | null;
  onRefresh: () => void;
}

export function CurrentTabInfo({ 
  tabInfo, 
  loading, 
  error, 
  onRefresh 
}: CurrentTabInfoProps) {
  // 加载状态
  if (loading) {
    return (
      <div className="flex items-center justify-center py-4 bg-gray-50 rounded-xl border">
        <div className="text-center">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600 mx-auto mb-2"></div>
          <p className="text-sm text-gray-600">检测当前页面...</p>
        </div>
      </div>
    );
  }

  // 错误状态
  if (error) {
    return (
      <div className="bg-orange-50 border border-orange-200 rounded-xl p-3">
        <div className="flex items-start">
          <AlertCircle className="w-5 h-5 text-orange-500 mt-0.5 mr-3 flex-shrink-0" />
          <div className="flex-1">
            <h3 className="text-sm font-medium text-orange-800 mb-1">
              无法检测当前页面
            </h3>
            <p className="text-xs text-orange-700 mb-3">
              {error}
            </p>
            <Button
              size="sm"
              variant="outline"
              onClick={onRefresh}
              className="text-orange-700 border-orange-300 hover:bg-orange-100 rounded-lg"
            >
              <RefreshCw className="w-3 h-3 mr-1" />
              重试
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // 成功状态
  if (tabInfo) {
    return (
      <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-3">
        <div className="flex items-start">
          <div className="w-8 h-8 rounded-xl bg-white border flex items-center justify-center mr-3 flex-shrink-0 shadow-sm">
            {tabInfo.favIconUrl ? (
              <img 
                src={tabInfo.favIconUrl} 
                alt="" 
                className="w-4 h-4"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  target.nextElementSibling?.classList.remove('hidden');
                }}
              />
            ) : null}
            <Globe className={`w-4 h-4 text-indigo-600 ${tabInfo.favIconUrl ? 'hidden' : ''}`} />
          </div>
          
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-medium text-indigo-900 mb-1 truncate">
              {tabInfo.title || '无标题'}
            </h3>
            <p className="text-xs text-indigo-700 truncate">
              {tabInfo.url ? formatUrlForDisplay(tabInfo.url, 40) : '无URL'}
            </p>
          </div>

          <Button
            size="sm"
            variant="ghost"
            onClick={onRefresh}
            className="text-indigo-600 hover:bg-indigo-100 ml-2 p-1.5"
            title="刷新页面信息"
          >
            <RefreshCw className="w-3 h-3" />
          </Button>
        </div>
      </div>
    );
  }

  return null;
}
