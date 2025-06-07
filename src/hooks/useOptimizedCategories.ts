/**
 * 优化的分类切换逻辑
 * 解决分类切换时的闪烁问题
 */

import { useCallback, useState, useEffect, useTransition } from 'react';
import { loadSelectedCategoryId, saveSelectedCategoryId } from '@/utils/storage';
import type { BookmarkCategory } from '@/types';

interface UseCategorySwitchProps {
  categories: BookmarkCategory[];
  categoriesLoading: boolean;
}

export const useCategorySwitch = ({ categories, categoriesLoading }: UseCategorySwitchProps) => {
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [isInitialized, setIsInitialized] = useState(false);

  // 从存储中加载上次选中的分类
  useEffect(() => {
    const loadSelectedCategory = async () => {
      if (categoriesLoading || categories.length === 0) return;

      try {
        const result = await loadSelectedCategoryId();
        let targetCategoryId: string | null = null;

        if (result.success && result.data) {
          // 验证选中的分类是否仍然存在
          const categoryExists = categories.find(cat => cat.id === result.data);
          if (categoryExists) {
            targetCategoryId = result.data;
          }
        }
        
        // 如果没有有效的选中分类，选择第一个分类
        if (!targetCategoryId && categories.length > 0) {
          targetCategoryId = categories[0].id;
          await saveSelectedCategoryId(targetCategoryId);
        }

        // 使用transition来避免阻塞UI
        startTransition(() => {
          setSelectedCategoryId(targetCategoryId);
          setIsInitialized(true);
        });
      } catch (error) {
        // 出错时也选择第一个分类
        if (categories.length > 0) {
          const firstCategoryId = categories[0].id;
          startTransition(() => {
            setSelectedCategoryId(firstCategoryId);
            setIsInitialized(true);
          });
        }
      }
    };
    
    loadSelectedCategory();
  }, [categories, categoriesLoading]);

  // 分类选择处理
  const handleCategorySelect = useCallback(async (categoryId: string | null) => {
    try {
      // 如果传入null或者选择的分类不存在，选择第一个分类
      if (!categoryId || !categories.find(cat => cat.id === categoryId)) {
        const firstCategory = categories.length > 0 ? categories[0] : null;
        const selectedId = firstCategory?.id || null;
        
        startTransition(() => {
          setSelectedCategoryId(selectedId);
        });
        
        if (selectedId) {
          await saveSelectedCategoryId(selectedId);
        }
      } else {
        startTransition(() => {
          setSelectedCategoryId(categoryId);
        });
        
        await saveSelectedCategoryId(categoryId);
      }
    } catch (error) {
      // 即使保存失败也要更新UI状态
      startTransition(() => {
        setSelectedCategoryId(categoryId);
      });
    }
  }, [categories]);

  return {
    selectedCategoryId,
    handleCategorySelect,
    isPending,
    isInitialized
  };
};

/**
 * 优化的书签过滤Hook
 * 使用useMemo缓存过滤结果，避免不必要的重新计算
 */
import { useMemo } from 'react';
import type { Bookmark } from '@/types';

export const useFilteredBookmarks = (
  bookmarks: Bookmark[], 
  selectedCategoryId: string | null
) => {
  return useMemo(() => {
    return bookmarks.filter(bookmark => 
      !selectedCategoryId || bookmark.categoryId === selectedCategoryId
    );
  }, [bookmarks, selectedCategoryId]);
};

/**
 * 页面加载状态管理Hook
 * 管理初始加载状态，避免加载闪烁
 */
export const usePageLoadState = () => {
  const [isPageReady, setIsPageReady] = useState(false);

  useEffect(() => {
    // 在页面加载完成后设置为ready
    const timer = setTimeout(() => {
      setIsPageReady(true);
    }, 150); // 给其他组件一些时间来初始化

    return () => clearTimeout(timer);
  }, []);

  return isPageReady;
};
