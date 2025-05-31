/**
 * 书签样式选择器组件
 * 用于在卡片样式和图标样式之间切换
 */

import React from 'react';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { LayoutGrid, Grid3X3 } from 'lucide-react';
import { 
  BOOKMARK_STYLE_TYPES, 
  STYLE_TYPE_LABELS, 
  STYLE_TYPE_DESCRIPTIONS 
} from '@/constants/bookmark-style.constants';
import type { BookmarkStyleType } from '@/types/bookmark-style.types';

interface BookmarkStyleSelectorProps {
  value: BookmarkStyleType;
  onChange: (style: BookmarkStyleType) => void;
  disabled?: boolean;
  className?: string;
}

const BookmarkStyleSelector: React.FC<BookmarkStyleSelectorProps> = ({
  value,
  onChange,
  disabled = false,
  className = '',
}) => {
  const styles = [
    {
      value: BOOKMARK_STYLE_TYPES.CARD,
      label: STYLE_TYPE_LABELS[BOOKMARK_STYLE_TYPES.CARD],
      description: STYLE_TYPE_DESCRIPTIONS[BOOKMARK_STYLE_TYPES.CARD],
      icon: LayoutGrid,
      preview: (
        <div className="flex items-center space-x-2 p-2 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-lg w-full">
          <div className="w-6 h-6 bg-blue-500 rounded flex-shrink-0"></div>
          <div className="flex-1">
            <div className="w-12 h-1 bg-white/80 rounded mb-1"></div>
            <div className="w-8 h-0.5 bg-white/60 rounded"></div>
          </div>
        </div>
      ),
    },
    {
      value: BOOKMARK_STYLE_TYPES.ICON,
      label: STYLE_TYPE_LABELS[BOOKMARK_STYLE_TYPES.ICON],
      description: STYLE_TYPE_DESCRIPTIONS[BOOKMARK_STYLE_TYPES.ICON],
      icon: Grid3X3,
      preview: (
        <div className="flex flex-col items-center space-y-1 p-2">
          <div className="w-8 h-8 bg-green-500 rounded-lg"></div>
          <div className="w-10 h-0.5 bg-white/80 rounded"></div>
        </div>
      ),
    },
  ];

  return (
    <div className={`space-y-3 ${className}`}>
      <Label className="text-sm font-medium text-gray-900 dark:text-gray-100">
        书签样式
      </Label>
      
      <div className="grid grid-cols-2 gap-3">
        {styles.map((style) => {
          const Icon = style.icon;
          const isSelected = value === style.value;
          
          return (
            <Card
              key={style.value}
              className={`
                relative cursor-pointer transition-all duration-200 hover:shadow-md
                ${isSelected 
                  ? 'ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-950/50' 
                  : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'
                }
                ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
              `}
              onClick={() => !disabled && onChange(style.value)}
            >
              <div className="p-4 space-y-3">
                {/* 图标和标题 */}
                <div className="flex items-center space-x-2">
                  <Icon 
                    size={16} 
                    className={`
                      ${isSelected ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500'}
                    `}
                  />
                  <span className={`
                    text-sm font-medium
                    ${isSelected ? 'text-blue-700 dark:text-blue-300' : 'text-gray-700 dark:text-gray-300'}
                  `}>
                    {style.label}
                  </span>
                </div>
                
                {/* 预览 */}
                <div className="flex justify-center">
                  {style.preview}
                </div>
                
                {/* 描述 */}
                <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                  {style.description}
                </p>
                
                {/* 选中指示器 */}
                {isSelected && (
                  <div className="absolute top-2 right-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  </div>
                )}
              </div>
            </Card>
          );
        })}
      </div>
      
      {/* 当前选择提示 */}
      <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
        当前样式: {STYLE_TYPE_LABELS[value]}
      </div>
    </div>
  );
};

export default BookmarkStyleSelector;
