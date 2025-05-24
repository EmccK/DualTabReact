import React, { useRef, useEffect } from 'react';
import type { AppPreferences } from '@/types/settings';

interface SearchBoxProps {
  preferences: AppPreferences;
  isGlassEffect?: boolean;
  className?: string;
}

/**
 * 搜索框组件
 * 支持多种搜索引擎和自动聚焦设置
 */
export function SearchBox({ preferences, isGlassEffect = true, className = '' }: SearchBoxProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  // 搜索引擎配置
  const searchEngines = {
    google: {
      name: 'Google',
      logo: './images/google-logo.png',
      url: 'https://www.google.com/search',
      param: 'q',
    },
    baidu: {
      name: '百度',
      logo: './images/baidu-logo.svg',
      url: 'https://www.baidu.com/s',
      param: 'wd',
    },
    bing: {
      name: 'Bing',
      logo: './images/bing-logo.svg',
      url: 'https://www.bing.com/search',
      param: 'q',
    },
  };

  const currentEngine = searchEngines[preferences.searchEngine];

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

  // 处理搜索
  const handleSearch = (query: string) => {
    if (query.trim()) {
      const searchUrl = `${currentEngine.url}?${currentEngine.param}=${encodeURIComponent(query)}`;
      
      if (preferences.openInNewTab) {
        window.open(searchUrl, '_blank');
      } else {
        window.location.href = searchUrl;
      }
    }
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
    <div className={`w-full max-w-2xl ${className}`}>
      <div 
        className={`${
          isGlassEffect ? 'bg-white/90 backdrop-blur-md' : 'bg-white/95'
        } rounded-full shadow-lg border border-white/30 p-4 flex items-center transition-all duration-300 hover:shadow-xl hover:bg-white/95`}
      >
        <img
          src={currentEngine.logo}
          alt={currentEngine.name}
          className="w-8 h-8 mr-4"
          onError={(e) => {
            // 如果图标加载失败，使用文字替代
            const target = e.target as HTMLImageElement;
            target.style.display = 'none';
            const textSpan = document.createElement('span');
            textSpan.textContent = currentEngine.name;
            textSpan.className = 'text-sm font-medium text-gray-600 mr-4';
            target.parentNode?.insertBefore(textSpan, target);
          }}
        />
        <input
          ref={inputRef}
          type="text"
          placeholder={`在${currentEngine.name}中搜索`}
          className="flex-1 bg-transparent outline-none text-lg text-gray-700 placeholder-gray-500 font-medium"
          onKeyDown={handleKeyDown}
        />
      </div>
    </div>
  );
}
