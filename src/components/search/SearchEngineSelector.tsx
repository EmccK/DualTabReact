import React, { useState, useRef, useEffect } from 'react';
import { SearchEngineIcon } from './SearchEngineIcon';
import { getAllSearchEngines } from '@/utils/search-engines';
import type { SearchEngineConfig, SearchEngineId } from '@/types/search';
import { ChevronDown } from 'lucide-react';

interface SearchEngineSelectorProps {
  currentEngine: SearchEngineConfig;
  onEngineChange: (engineId: SearchEngineId) => void;
}

/**
 * 搜索引擎选择器组件，始终使用毛玻璃效果
 */
export function SearchEngineSelector({ 
  currentEngine, 
  onEngineChange
}: SearchEngineSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const allEngines = getAllSearchEngines();

  // 处理点击外部关闭下拉菜单
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  const handleToggleDropdown = () => {
    setIsOpen(!isOpen);
  };

  const handleEngineSelect = (engineId: SearchEngineId) => {
    onEngineChange(engineId);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        ref={buttonRef}
        onClick={handleToggleDropdown}
        className="group flex items-center pl-4 py-4 rounded-l-full hover:bg-black/5 transition-colors"
        title="切换搜索引擎"
      >
        <SearchEngineIcon 
          engine={currentEngine} 
          size="md"
        />
        <ChevronDown 
          className={`w-4 h-4 text-gray-500 transition-all duration-200 ml-0 ${
            isOpen ? 'rotate-180 opacity-100' : 'opacity-0 group-hover:opacity-100'
          }`} 
        />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 py-2 min-w-36 rounded-lg shadow-lg border z-[9999] bg-white/95 backdrop-blur-md border-white/30">
          {allEngines.map((engine) => (
            <button
              key={engine.id}
              onClick={() => handleEngineSelect(engine.id as SearchEngineId)}
              className={`w-full flex items-center space-x-3 px-4 py-2 text-left hover:bg-black/5 transition-colors ${
                engine.id === currentEngine.id ? 'bg-blue-50' : ''
              }`}
            >
              <SearchEngineIcon 
                engine={engine} 
                size="sm"
              />
              <span className="text-sm font-medium text-gray-700">
                {engine.name}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
