import React, { useRef, useEffect } from 'react';
import { SearchEngineSelector } from './SearchEngineSelector';
import { useSearchEngine } from '@/hooks/useSearchEngine';
import type { AppPreferences } from '@/types/settings';
import type { SearchEngineId } from '@/types/search';

interface SearchBoxProps {
  preferences: AppPreferences;
  isGlassEffect?: boolean;
  className?: string;
}

/**
 * 搜索框组件
 * 支持多种搜索引擎切换和自动聚焦设置
 */
export function SearchBox({ preferences, isGlassEffect = true, className = '' }: SearchBoxProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const { currentEngine, switchSearchEngine, performSearch } = useSearchEngine();

  // 自动聚焦功能
  useEffect(() => {
    if (preferences.autoFocusSearch && inputRef.current) {
      // 延迟聚焦，避免干扰页面初始化
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [preferences.autoFocusSearch]);

  // 处理搜索引擎切换
  const handleEngineChange = (engineId: SearchEngineId) => {
    switchSearchEngine(engineId);
  };

  // 处理搜索
  const handleSearch = (query: string) => {
    performSearch(query);
  };

  // 处理键盘事件
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const query = (e.target as HTMLInputElement).value;
      handleSearch(query);
    }
  };

  return (
    <div className={`w-full max-w-3xl mx-auto relative z-50 ${className}`}>
      <div 
        className={`${
          isGlassEffect ? 'bg-white/90 backdrop-blur-md' : 'bg-white/95'
        } rounded-full shadow-lg border border-white/30 flex items-center transition-all duration-300 hover:shadow-xl hover:bg-white/95 relative overflow-visible`}
      >
        <SearchEngineSelector
          currentEngine={currentEngine}
          onEngineChange={handleEngineChange}
          isGlassEffect={isGlassEffect}
        />
        <input
          ref={inputRef}
          type="text"
          placeholder={currentEngine.placeholder}
          className="flex-1 bg-transparent outline-none text-xl text-gray-700 placeholder-gray-500 font-medium pl-0 pr-4 py-4"
          onKeyDown={handleKeyDown}
        />
      </div>
    </div>
  );
}
