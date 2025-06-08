/**
 * Popup主应用组件
 * 复用新标签页的书签管理功能，提供快速添加书签界面
 */

import React, { useState, useCallback, useEffect } from 'react';
import { PopupLayout } from '@/components/popup/PopupLayout';
import { CurrentTabInfo } from '@/components/popup/CurrentTabInfo';
import { QuickBookmarkForm } from '@/components/popup/QuickBookmarkForm';
import { useCurrentTab } from '@/hooks/popup/useCurrentTab';
import { usePopupBookmark } from '@/hooks/popup/usePopupBookmark';
import type { QuickBookmarkFormData } from '@/types/popup/tab.types';
import { CheckCircle, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import './popup.css';

function PopupApp() {
  // 当前标签页状态
  const {
    tabInfo,
    loading: tabLoading,
    error: tabError,
    canAccessCurrentTab,
    suggestedBookmarkName,
    currentUrl,
    refresh: refreshTab
  } = useCurrentTab();

  // 书签管理状态
  const {
    isSubmitting,
    submitError,
    loading: bookmarkLoading,
    categories,
    defaultCategory,
    selectedCategoryName,
    quickAddBookmark,
    clearError
  } = usePopupBookmark();

  // 成功状态
  const [isSuccess, setIsSuccess] = useState(false);
  const [addedBookmarkName, setAddedBookmarkName] = useState<string>('');
  const [countdown, setCountdown] = useState(3);

  // 主要加载状态（任何一个在加载就显示加载）
  const isMainLoading = tabLoading || bookmarkLoading;

  // 主要错误（书签加载错误优先级更高）
  const mainError = bookmarkLoading ? null : (
    categories.length === 0 ? '无法加载书签分类' : null
  );

  // 处理表单提交
  const handleSubmit = useCallback(async (formData: QuickBookmarkFormData) => {
    try {
      const result = await quickAddBookmark(formData);
      
      if (result.success) {
        setAddedBookmarkName(formData.name);
        setIsSuccess(true);
        setCountdown(3);
        
        // 开始倒计时
        const countdownInterval = setInterval(() => {
          setCountdown(prev => {
            if (prev <= 1) {
              clearInterval(countdownInterval);
              window.close();
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      }
      // 错误处理由usePopupBookmark Hook处理
    } catch (error) {
    }
  }, [quickAddBookmark]);

  // 成功页面
  if (isSuccess) {
    return (
      <PopupLayout title="添加成功">
        <div className="text-center py-12">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4 popup-success-icon" />
          <h2 className="text-lg font-semibold text-gray-900 mb-2">
            书签添加成功！
          </h2>
          <p className="text-sm text-gray-600 mb-6">
            《{addedBookmarkName}》已添加到书签 · <span className="popup-countdown">{countdown}</span>秒后自动关闭
          </p>
          <div className="flex space-x-3 justify-center">
            <Button
              variant="outline"
              onClick={() => {
                setIsSuccess(false);
                setCountdown(3);
              }}
              className="text-sm rounded-xl"
            >
              继续添加
            </Button>
            <Button
              onClick={() => {
                chrome.tabs.create({ url: chrome.runtime.getURL('newtab.html') });
                window.close();
              }}
              className="text-sm bg-indigo-600 hover:bg-indigo-700 rounded-xl"
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              打开新标签页
            </Button>
          </div>
        </div>
      </PopupLayout>
    );
  }

  return (
    <PopupLayout
      title="快速添加书签"
      loading={isMainLoading}
      error={mainError}
    >
      <div className="space-y-4">
        {/* 当前标签页信息 */}
        <CurrentTabInfo
          tabInfo={tabInfo}
          loading={tabLoading}
          error={tabError}
          onRefresh={refreshTab}
        />

        {/* 快速书签表单 */}
        {!isMainLoading && !mainError && (
          <QuickBookmarkForm
            initialName={canAccessCurrentTab ? suggestedBookmarkName : ''}
            initialUrl={canAccessCurrentTab ? currentUrl : ''}
            categories={categories}
            defaultCategoryName={selectedCategoryName || defaultCategory?.name}
            isSubmitting={isSubmitting}
            submitError={submitError}
            onSubmit={handleSubmit}
            onClearError={clearError}
          />
        )}

        {/* 没有当前页面信息时的手动输入提示 */}
        {!canAccessCurrentTab && !tabLoading && !isMainLoading && !mainError && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-3">
            <p className="text-sm text-blue-800">
              💡 无法自动获取当前页面信息，请手动输入书签详情
            </p>
          </div>
        )}
      </div>
    </PopupLayout>
  );
}

export default PopupApp;
