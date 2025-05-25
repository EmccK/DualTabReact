import { useState, useEffect, useCallback, useRef } from 'react';
import type { Attribution, AttributionState, AttributionDisplayConfig } from '@/types/attribution';
import { isAttributionComplete } from '@/utils/attribution';

/**
 * 归属信息显示控制Hook
 * 管理归属信息的显示状态、自动隐藏和交互行为
 */
export function useAttributionDisplay(
  attribution: Attribution | null,
  config: AttributionDisplayConfig = {
    show: true,
    position: 'bottom-right',
    style: 'compact',
    autoHide: false,
    autoHideDelay: 3000,
    opacity: 0.8
  }
) {
  // 归属信息状态
  const [state, setState] = useState<AttributionState>({
    current: null,
    isVisible: false,
    isLoading: false,
    error: null
  });

  // 鼠标悬停状态
  const [isHovered, setIsHovered] = useState(false);
  
  // 自动隐藏定时器引用
  const autoHideTimerRef = useRef<NodeJS.Timeout | null>(null);

  /**
   * 清除自动隐藏定时器
   */
  const clearAutoHideTimer = useCallback(() => {
    if (autoHideTimerRef.current) {
      clearTimeout(autoHideTimerRef.current);
      autoHideTimerRef.current = null;
    }
  }, []);

  /**
   * 设置自动隐藏定时器
   */
  const setAutoHideTimer = useCallback(() => {
    if (!config.autoHide || isHovered) return;
    
    clearAutoHideTimer();
    autoHideTimerRef.current = setTimeout(() => {
      setState(prev => ({ ...prev, isVisible: false }));
    }, config.autoHideDelay);
  }, [config.autoHide, config.autoHideDelay, isHovered, clearAutoHideTimer]);

  /**
   * 显示归属信息
   */
  const showAttribution = useCallback(() => {
    if (!config.show || !attribution) return;
    
    setState(prev => ({
      ...prev,
      current: attribution,
      isVisible: true,
      error: null
    }));

    // 设置自动隐藏
    if (config.autoHide && !isHovered) {
      setAutoHideTimer();
    }
  }, [attribution, config.show, config.autoHide, isHovered, setAutoHideTimer]);

  /**
   * 隐藏归属信息
   */
  const hideAttribution = useCallback(() => {
    setState(prev => ({ ...prev, isVisible: false }));
    clearAutoHideTimer();
  }, [clearAutoHideTimer]);

  /**
   * 鼠标进入处理
   */
  const handleMouseEnter = useCallback(() => {
    setIsHovered(true);
    clearAutoHideTimer();
    
    // 如果配置为显示且有归属信息，则显示
    if (config.show && attribution && isAttributionComplete(attribution)) {
      showAttribution();
    }
  }, [config.show, attribution, showAttribution, clearAutoHideTimer]);

  /**
   * 鼠标离开处理
   */
  const handleMouseLeave = useCallback(() => {
    setIsHovered(false);
    
    // 重新设置自动隐藏定时器
    if (config.autoHide && state.isVisible) {
      setAutoHideTimer();
    }
  }, [config.autoHide, state.isVisible, setAutoHideTimer]);

  /**
   * 点击归属信息处理
   */
  const handleAttributionClick = useCallback((linkType: 'profile' | 'photo' | 'download' = 'profile') => {
    if (!attribution || attribution.source !== 'unsplash') return;
    
    // 这里将在组件中处理链接跳转
    return { attribution, linkType };
  }, [attribution]);

  /**
   * 更新归属信息
   */
  const updateAttribution = useCallback((newAttribution: Attribution | null) => {
    setState(prev => ({
      ...prev,
      current: newAttribution,
      isVisible: config.show && !!newAttribution && isAttributionComplete(newAttribution),
      error: null
    }));
  }, [config.show]);

  /**
   * 设置错误状态
   */
  const setError = useCallback((error: string) => {
    setState(prev => ({
      ...prev,
      error,
      isVisible: false
    }));
  }, []);

  // 监听归属信息变化
  useEffect(() => {
    if (!attribution) {
      setState(prev => ({ ...prev, current: null, isVisible: false }));
      return;
    }

    // 验证归属信息完整性
    if (!isAttributionComplete(attribution)) {
      setError('归属信息不完整');
      return;
    }

    // 更新当前归属信息
    setState(prev => ({
      ...prev,
      current: attribution,
      isVisible: config.show,
      error: null
    }));

    // 如果启用自动隐藏且未被悬停，设置定时器
    if (config.show && config.autoHide && !isHovered) {
      setAutoHideTimer();
    }
  }, [attribution, config.show, config.autoHide, isHovered, setAutoHideTimer]);

  // 监听配置变化
  useEffect(() => {
    if (!config.show) {
      hideAttribution();
    } else if (attribution && isAttributionComplete(attribution)) {
      showAttribution();
    }
  }, [config.show, attribution, hideAttribution, showAttribution]);

  // 清理定时器
  useEffect(() => {
    return () => {
      clearAutoHideTimer();
    };
  }, [clearAutoHideTimer]);

  return {
    // 状态
    state,
    isHovered,
    
    // 操作方法
    showAttribution,
    hideAttribution,
    updateAttribution,
    setError,
    
    // 事件处理器
    handleMouseEnter,
    handleMouseLeave,
    handleAttributionClick,
    
    // 辅助方法
    isComplete: isAttributionComplete(attribution),
    shouldShow: config.show && state.isVisible && isAttributionComplete(state.current)
  };
}
