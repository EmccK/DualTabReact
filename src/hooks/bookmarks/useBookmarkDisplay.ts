/**
 * 书签显示Hook
 */

import { useState, useCallback, useMemo } from 'react';
import type { BookmarkDisplayStyle, BookmarkDisplayConfig, BookmarkCardState, BookmarkCardStyles } from '@/types/bookmark-display.types';
import type { BookmarkSettings } from '@/types/settings';
import { BOOKMARK_DISPLAY_STYLES, DEFAULT_CARD_SIZES, DEFAULT_ANIMATION_CONFIG } from '@/constants';

interface UseBookmarkDisplayProps {
  displayStyle?: BookmarkDisplayStyle;
  bookmarkSettings?: BookmarkSettings;
  borderRadius?: number;
}

interface UseBookmarkDisplayReturn {
  // 当前配置
  displayConfig: BookmarkDisplayConfig;
  cardState: BookmarkCardState;
  
  // 样式计算
  getCardStyles: (isHovered: boolean, isClicked: boolean, isDragging: boolean, isDragOver: boolean) => BookmarkCardStyles;
  
  // 状态管理
  setHovered: (hovered: boolean) => void;
  setClicked: (clicked: boolean) => void;
  setDragging: (dragging: boolean) => void;
  setDragOver: (dragOver: boolean) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: boolean) => void;
  
  // 配置更新
  updateDisplayStyle: (style: BookmarkDisplayStyle) => void;
  updateBorderRadius: (radius: number) => void;
}

export const useBookmarkDisplay = ({
  displayStyle = BOOKMARK_DISPLAY_STYLES.DETAILED,
  bookmarkSettings,
  borderRadius = 8,
}: UseBookmarkDisplayProps): UseBookmarkDisplayReturn => {
  // 卡片状态
  const [cardState, setCardState] = useState<BookmarkCardState>({
    isHovered: false,
    isClicked: false,
    isDragging: false,
    isDragOver: false,
    isLoading: false,
    hasError: false,
  });

  // 显示配置
  const displayConfig: BookmarkDisplayConfig = useMemo(() => {
    const cardSize = DEFAULT_CARD_SIZES[displayStyle];
    
    return {
      style: displayStyle,
      showTitle: bookmarkSettings?.display.showTitle ?? true,
      showDescription: bookmarkSettings?.display.showDescriptions ?? true,
      showIcon: bookmarkSettings?.display.showFavicons ?? true,
      iconPosition: displayStyle === BOOKMARK_DISPLAY_STYLES.COMPACT ? 'center' : 'top',
      textAlignment: 'center',
      borderRadius,
      cardSize: {
        ...cardSize,
        iconSize: bookmarkSettings?.display.iconSize ?? cardSize.iconSize,
        padding: bookmarkSettings?.display.cardPadding ?? cardSize.padding,
        spacing: bookmarkSettings?.display.cardSpacing ?? cardSize.spacing,
      },
    };
  }, [displayStyle, bookmarkSettings, borderRadius]);

  // 样式计算函数
  const getCardStyles = useCallback((
    isHovered: boolean,
    isClicked: boolean,
    isDragging: boolean,
    isDragOver: boolean
  ): BookmarkCardStyles => {
    const { cardSize } = displayConfig;
    const hoverScale = bookmarkSettings?.behavior.hoverScale ?? DEFAULT_ANIMATION_CONFIG.hoverScale;

    // 计算缩放
    let scale = 1;
    if (isClicked) {
      scale = DEFAULT_ANIMATION_CONFIG.clickScale;
    } else if (isDragOver) {
      scale = 1.08;
    } else if (isHovered) {
      scale = hoverScale;
    }

    if (isDragging) {
      scale = 0.95;
    }

    // 容器样式
    const container: React.CSSProperties = {
      width: `${cardSize.width}px`,
      height: `${cardSize.height}px`,
      padding: `${cardSize.padding}px`,
      borderRadius: `${borderRadius}px`,
      transform: `scale(${scale})`,
      transition: `transform ${DEFAULT_ANIMATION_CONFIG.duration}ms ${DEFAULT_ANIMATION_CONFIG.easing}`,
      opacity: isDragging ? 0.5 : 1,
    };

    // 图标样式
    const icon: React.CSSProperties = {
      width: `${cardSize.iconSize}px`,
      height: `${cardSize.iconSize}px`,
      marginBottom: displayConfig.style === BOOKMARK_DISPLAY_STYLES.DETAILED ? `${cardSize.spacing}px` : '4px',
    };

    // 标题样式
    const title: React.CSSProperties = {
      fontSize: displayConfig.style === BOOKMARK_DISPLAY_STYLES.COMPACT ? '12px' : '14px',
      lineHeight: 1.2,
      textAlign: displayConfig.textAlignment,
      marginBottom: displayConfig.showDescription ? '4px' : '0',
    };

    // 描述样式
    const description: React.CSSProperties = {
      fontSize: '12px',
      lineHeight: 1.2,
      opacity: 0.7,
      textAlign: displayConfig.textAlignment,
    };

    // 背景样式
    const background: React.CSSProperties = {
      background: 'rgba(255, 255, 255, 0.1)',
      backdropFilter: 'blur(10px)',
      border: '1px solid rgba(255, 255, 255, 0.2)',
      boxShadow: isHovered 
        ? '0 8px 32px rgba(0, 0, 0, 0.2)' 
        : '0 4px 16px rgba(0, 0, 0, 0.1)',
    };

    return {
      container,
      icon,
      title,
      description,
      background,
    };
  }, [displayConfig, bookmarkSettings, borderRadius]);

  // 状态更新方法
  const setHovered = useCallback((hovered: boolean) => {
    setCardState(prev => ({ ...prev, isHovered: hovered }));
  }, []);

  const setClicked = useCallback((clicked: boolean) => {
    setCardState(prev => ({ ...prev, isClicked: clicked }));
  }, []);

  const setDragging = useCallback((dragging: boolean) => {
    setCardState(prev => ({ ...prev, isDragging: dragging }));
  }, []);

  const setDragOver = useCallback((dragOver: boolean) => {
    setCardState(prev => ({ ...prev, isDragOver: dragOver }));
  }, []);

  const setLoading = useCallback((loading: boolean) => {
    setCardState(prev => ({ ...prev, isLoading: loading }));
  }, []);

  const setError = useCallback((error: boolean) => {
    setCardState(prev => ({ ...prev, hasError: error }));
  }, []);

  // 配置更新方法
  const updateDisplayStyle = useCallback((style: BookmarkDisplayStyle) => {
    // 这里应该更新设置，但由于这是Hook，我们只是打日志
    console.log('更新显示样式:', style);
  }, []);

  const updateBorderRadius = useCallback((radius: number) => {
    console.log('更新圆角:', radius);
  }, []);

  return {
    displayConfig,
    cardState,
    getCardStyles,
    setHovered,
    setClicked,
    setDragging,
    setDragOver,
    setLoading,
    setError,
    updateDisplayStyle,
    updateBorderRadius,
  };
};

export default useBookmarkDisplay;
