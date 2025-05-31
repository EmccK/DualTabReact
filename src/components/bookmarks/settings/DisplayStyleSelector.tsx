/**
 * 显示样式选择器组件
 * 支持在详细样式和紧凑样式之间切换
 */

import React from 'react';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { LayoutGrid, Grid3X3 } from 'lucide-react';
import { BOOKMARK_DISPLAY_STYLES, DISPLAY_STYLE_LABELS, DISPLAY_STYLE_DESCRIPTIONS } from '@/constants';
import type { BookmarkDisplayStyle } from '@/types/bookmark-display.types';

interface DisplayStyleSelectorProps {
  value: BookmarkDisplayStyle;
  onChange: (style: BookmarkDisplayStyle) => void;
  disabled?: boolean;
  className?: string;
}

const DisplayStyleSelector: React.FC<DisplayStyleSelectorProps> = ({
  value,
  onChange,
  disabled = false,
  className = '',
}) => {
  const styles = [
    {
      value: BOOKMARK_DISPLAY_STYLES.DETAILED,
      label: DISPLAY_STYLE_LABELS[BOOKMARK_DISPLAY_STYLES.DETAILED],
      description: DISPLAY_STYLE_DESCRIPTIONS[BOOKMARK_DISPLAY_STYLES.DETAILED],
      icon: LayoutGrid,
      preview: (
        <div className="flex flex-col items-center space-y-1 p-2 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-lg">
          <div className="w-6 h-6 bg-blue-500 rounded-md"></div>
          <div className="w-8 h-1 bg-white/80 rounded"></div>
          <div className="w-6 h-0.5 bg-white/60 rounded"></div>
        </div>
      ),
    },
    {
      value: BOOKMARK_DISPLAY_STYLES.COMPACT,
      label: DISPLAY_STYLE_LABELS[BOOKMARK_DISPLAY_STYLES.COMPACT],
      description: DISPLAY_STYLE_DESCRIPTIONS[BOOKMARK_DISPLAY_STYLES.COMPACT],
      icon: Grid3X3,
      preview: (
        <div className="flex flex-col items-center justify-between p-2 bg-gradient-to-br from-green-500/20 to-blue-500/20 rounded-lg h-12">
          <div className="w-5 h-5 bg-green-500 rounded-md"></div>
          <div className="w-6 h-0.5 bg-white/80 rounded"></div>
        </div>
      ),
    },
  ];

  return (
    <div className={`space-y-3 ${className}`}>
      <Label className="text-sm font-medium text-gray-900 dark:text-gray-100">
        显示样式
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
        当前使用: {DISPLAY_STYLE_LABELS[value]}
      </div>
    </div>
  );
};

export default DisplayStyleSelector;
