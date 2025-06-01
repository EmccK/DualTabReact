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
import { loadSelectedCategoryId } from '@/utils/storage';

export function usePopupBookmark() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  
  // 复用主应用的Hook
  const { addBookmark, loading: bookmarksLoading } = useBookmarks();
  const { categories, loading: categoriesLoading } = useCategories();

  // 初始化时获取选中分类
  useEffect(() => {
    if (categories.length > 0 && selectedCategoryId === null) {
      loadSelectedCategoryId().then((result) => {
        if (result.success && result.data && categories.find(cat => cat.id === result.data)) {
          setSelectedCategoryId(result.data);
        } else if (categories.length > 0) {
          // 如果没有获取到或分类不存在，使用第一个分类
          setSelectedCategoryId(categories[0].id);
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
      
      // 构建书签数据
      const bookmarkData: Omit<Bookmark, 'id' | 'createdAt' | 'updatedAt' | 'position'> = {
        name: formData.name.trim(),
        title: formData.name.trim(),
        url: cleanUrl,
        description: formData.description?.trim() || undefined,
        categoryId: formData.categoryId,
        // 根据URL类型设置内外网地址
        externalUrl: isInternal ? undefined : cleanUrl,
        internalUrl: isInternal ? cleanUrl : undefined,
        // 使用官方图标作为默认
        iconType: 'official',
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
      console.error('快速添加书签失败:', error);
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
    selectedCategoryId,
    
    // 方法
    quickAddBookmark,
    clearError
  };
}
