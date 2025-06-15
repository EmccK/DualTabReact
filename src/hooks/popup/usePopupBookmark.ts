/**
 * Popup书签管理Hook
 * 复用主应用的书签功能，适配Popup场景
 */

import { useState, useCallback, useEffect } from 'react';
import { useBookmarks, useCategories } from '@/hooks';
import type { Bookmark } from '@/types';
import type { QuickBookmarkFormData } from '@/types/popup/tab.types';
import { validateQuickBookmarkForm, isInternalUrl } from '@/utils/popup/urlHelpers';
import { sanitizeUrl } from '@/utils/popup/tabHelpers';
import { loadSelectedCategoryName } from '@/utils/storage';
import { captureRealFaviconForBookmark } from '@/utils/icon-utils';

export function usePopupBookmark() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [selectedCategoryName, setSelectedCategoryName] = useState<string | null>(null);
  
  // 复用主应用的Hook
  const { addBookmark, loading: bookmarksLoading } = useBookmarks();
  const { categories, loading: categoriesLoading } = useCategories();

  // 初始化时获取选中分类
  useEffect(() => {
    if (categories.length > 0 && selectedCategoryName === null) {
      loadSelectedCategoryName().then((result) => {
        if (result.success && result.data && categories.find(cat => cat.name === result.data)) {
          setSelectedCategoryName(result.data);
        } else if (categories.length > 0) {
          // 如果没有获取到或分类不存在，使用第一个分类
          setSelectedCategoryName(categories[0].name);
        }
      });
    }
  }, [categories]);

  // 快速添加书签
  const quickAddBookmark = useCallback(async (formData: QuickBookmarkFormData): Promise<{
    success: boolean;
    error?: string;
    bookmark?: Bookmark;
  }> => {
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      // 表单验证
      const validation = validateQuickBookmarkForm(formData);
      if (!validation.isValid) {
        const errorMsg = Object.values(validation.errors)[0] || '表单验证失败';
        setSubmitError(errorMsg);
        return { success: false, error: errorMsg };
      }

      // 清理和标准化URL
      const cleanUrl = sanitizeUrl(formData.url);
      
      // 智能判断内外网
      const isInternal = isInternalUrl(cleanUrl);

      // 尝试获取真实的favicon URL
      let realFaviconUrl: string | null = null;
      try {
        realFaviconUrl = await captureRealFaviconForBookmark(cleanUrl);
      } catch (error) {
        // 忽略favicon获取错误，不影响书签添加
        console.warn('获取favicon失败:', error);
      }

      // 构建书签数据
      const bookmarkData: Omit<Bookmark, 'createdAt' | 'updatedAt' | 'position'> = {
        name: formData.name.trim(),
        title: formData.name.trim(),
        url: cleanUrl,
        description: formData.description?.trim() || undefined,
        categoryName: formData.categoryName,
        // 根据URL类型设置内外网地址
        externalUrl: isInternal ? undefined : cleanUrl,
        internalUrl: isInternal ? cleanUrl : undefined,
        // 使用官方图标作为默认
        iconType: 'official',
        // 保存真实的favicon URL
        realFaviconUrl: realFaviconUrl || undefined,
        // 其他字段使用默认值
        icon: undefined,
        iconText: undefined,
        iconData: undefined,
        iconColor: undefined,
        backgroundColor: undefined,
      };

      // 调用主应用的添加书签功能
      const result = await addBookmark(bookmarkData);

      if (result.success) {
        return { 
          success: true, 
          bookmark: result.data 
        };
      } else {
        const errorMsg = result.error || '添加书签失败';
        setSubmitError(errorMsg);
        return { success: false, error: errorMsg };
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : '未知错误';
      setSubmitError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setIsSubmitting(false);
    }
  }, [addBookmark]);

  // 获取默认分类（第一个分类）
  const getDefaultCategory = useCallback(() => {
    return categories.length > 0 ? categories[0] : null;
  }, [categories]);

  // 清除错误
  const clearError = useCallback(() => {
    setSubmitError(null);
  }, []);

  return {
    // 状态
    isSubmitting,
    submitError,
    loading: bookmarksLoading || categoriesLoading,
    
    // 数据
    categories,
    defaultCategory: getDefaultCategory(),
    selectedCategoryName,
    
    // 方法
    quickAddBookmark,
    clearError
  };
}
