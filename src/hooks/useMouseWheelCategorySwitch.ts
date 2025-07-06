import { useEffect, useRef, useCallback } from 'react';
import { BookmarkCategory } from '@/types';

interface UseMouseWheelCategorySwitchProps {
  categories: BookmarkCategory[];
  selectedCategoryName: string | null;
  onCategorySelect: (categoryName: string) => void;
  enabled?: boolean;
  scrollThreshold?: number; // 滚动阈值，累积到这个值时切换
}

export function useMouseWheelCategorySwitch({
  categories,
  selectedCategoryName,
  onCategorySelect,
  enabled = true,
  scrollThreshold = 120 // 默认滚动120像素切换
}: UseMouseWheelCategorySwitchProps) {
  const accumulatedDeltaRef = useRef(0);
  const lastWheelTimeRef = useRef(0);
  const isSwitchingRef = useRef(false);

  const switchToNextCategory = useCallback(() => {
    if (!selectedCategoryName || categories.length <= 1) return;

    const currentIndex = categories.findIndex(cat => cat.name === selectedCategoryName);
    if (currentIndex === -1) return;

    const nextIndex = (currentIndex + 1) % categories.length;
    onCategorySelect(categories[nextIndex].name);
  }, [categories, selectedCategoryName, onCategorySelect]);

  const switchToPreviousCategory = useCallback(() => {
    if (!selectedCategoryName || categories.length <= 1) return;

    const currentIndex = categories.findIndex(cat => cat.name === selectedCategoryName);
    if (currentIndex === -1) return;

    const previousIndex = currentIndex === 0 ? categories.length - 1 : currentIndex - 1;
    onCategorySelect(categories[previousIndex].name);
  }, [categories, selectedCategoryName, onCategorySelect]);

  const handleWheel = useCallback((event: WheelEvent) => {
    if (!enabled || isSwitchingRef.current) return;

    // 防止默认滚动行为
    event.preventDefault();

    const currentTime = Date.now();
    const timeSinceLastWheel = currentTime - lastWheelTimeRef.current;

    // 如果距离上次滚动超过500ms，重置累积值
    if (timeSinceLastWheel > 500) {
      accumulatedDeltaRef.current = 0;
    }

    lastWheelTimeRef.current = currentTime;

    // 累积滚动值
    accumulatedDeltaRef.current += event.deltaY;

    // 检查是否达到切换阈值
    if (Math.abs(accumulatedDeltaRef.current) >= scrollThreshold) {
      isSwitchingRef.current = true;

      if (accumulatedDeltaRef.current > 0) {
        // 向下滚动，切换到下一个分类
        switchToNextCategory();
      } else {
        // 向上滚动，切换到上一个分类
        switchToPreviousCategory();
      }

      // 重置累积值
      accumulatedDeltaRef.current = 0;

      // 防止过快切换
      setTimeout(() => {
        isSwitchingRef.current = false;
      }, 300);
    }
  }, [enabled, scrollThreshold, switchToNextCategory, switchToPreviousCategory]);

  useEffect(() => {
    if (!enabled) return;

    // 添加被动事件监听器
    const options = { passive: false };
    window.addEventListener('wheel', handleWheel, options);

    return () => {
      window.removeEventListener('wheel', handleWheel);
    };
  }, [handleWheel, enabled]);

  return {
    switchToNextCategory,
    switchToPreviousCategory
  };
}