/**
 * 优化的分类切换逻辑
 * 解决分类切换时的闪烁问题
 */

import { useCallback, useState, useEffect, useTransition } from 'react';
import { loadSelectedCategoryName, saveSelectedCategoryName } from '@/utils/storage';
import type { BookmarkCategory } from '@/types';

interface UseCategorySwitchProps {
  categories: BookmarkCategory[];
  categoriesLoading: boolean;
}

export const useCategorySwitch = ({ categories, categoriesLoading }: UseCategorySwitchProps) => {
  const [selectedCategoryName, setSelectedCategoryName] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [isInitialized, setIsInitialized] = useState(false);

  // 从存储中加载上次选中的分类
  useEffect(() => {
    const loadSelectedCategory = async () => {
      if (categoriesLoading || categories.length === 0) return;

      try {
        const result = await loadSelectedCategoryName();
        let targetCategoryName: string | null = null;

        if (result.success && result.data) {
          // 验证选中的分类是否仍然存在
          const categoryExists = categories.find(cat => cat.name === result.data);
          if (categoryExists) {
            targetCategoryName = result.data;
          }
        }
        
        // 如果没有有效的选中分类，选择第一个分类
        if (!targetCategoryName && categories.length > 0) {
          targetCategoryName = categories[0].name;
          await saveSelectedCategoryName(targetCategoryName);
        }

        // 使用transition来避免阻塞UI
        startTransition(() => {
          setSelectedCategoryName(targetCategoryName);
          setIsInitialized(true);
        });
      } catch {
        // 出错时也选择第一个分类
        if (categories.length > 0) {
          const firstCategoryName = categories[0].name;
          startTransition(() => {
            setSelectedCategoryName(firstCategoryName);
            setIsInitialized(true);
          });
        }
      }
    };
    
    loadSelectedCategory();
  }, [categories, categoriesLoading]);

  // 分类选择处理
  const handleCategorySelect = useCallback(async (categoryName: string | null) => {
    try {
      // 如果传入null或者选择的分类不存在，选择第一个分类
      if (!categoryName || !categories.find(cat => cat.name === categoryName)) {
        const firstCategory = categories.length > 0 ? categories[0] : null;
        const selectedName = firstCategory?.name || null;
        
        startTransition(() => {
          setSelectedCategoryName(selectedName);
        });
        
        if (selectedName) {
          await saveSelectedCategoryName(selectedName);
        }
      } else {
        startTransition(() => {
          setSelectedCategoryName(categoryName);
        });
        
        await saveSelectedCategoryName(categoryName);
      }
    } catch {
      // 即使保存失败也要更新UI状态
      startTransition(() => {
        setSelectedCategoryName(categoryName);
      });
    }
  }, [categories]);

  return {
    selectedCategoryName,
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
