import React from 'react';
import type { SearchEngineConfig } from '@/types/search';

interface SearchEngineIconProps {
  engine: SearchEngineConfig;
  onClick?: () => void;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  isClickable?: boolean;
}

const sizeMap = {
  sm: 'w-6 h-6',
  md: 'w-8 h-8',
  lg: 'w-10 h-10',
};

/**
 * 搜索引擎图标组件
 */
export function SearchEngineIcon({ 
  engine, 
  onClick, 
  className = '', 
  size = 'md',
  isClickable = false 
}: SearchEngineIconProps) {
  const sizeClass = sizeMap[size];
  
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onClick?.();
  };

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    // 如果图标加载失败，使用文字替代
    const img = e.target as HTMLImageElement;
    img.style.display = 'none';
    
    const textSpan = document.createElement('span');
    textSpan.textContent = engine.name;
    textSpan.className = 'text-sm font-medium text-gray-600';
    img.parentNode?.insertBefore(textSpan, img);
  };

  return (
    <div
      className={`flex items-center justify-center ${sizeClass} ${
        isClickable ? 'cursor-pointer hover:opacity-80 transition-all duration-200 hover:scale-105' : ''
      } ${className}`}
      onClick={isClickable ? handleClick : undefined}
      title={engine.name}
    >
      <img
        src={engine.logo}
        alt={engine.name}
        className={`${sizeClass} object-contain transition-transform duration-200`}
        onError={handleImageError}
      />
    </div>
  );
}
