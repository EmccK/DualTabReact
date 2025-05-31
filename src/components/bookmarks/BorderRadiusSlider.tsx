/**
 * 圆角大小滑块组件
 * 用于调整书签的圆角大小
 */

import React from 'react';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { BORDER_RADIUS_CONFIG, PRESET_BORDER_RADIUS } from '@/constants/bookmark-style.constants';

interface BorderRadiusSliderProps {
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
  className?: string;
}

const BorderRadiusSlider: React.FC<BorderRadiusSliderProps> = ({
  value,
  onChange,
  disabled = false,
  className = '',
}) => {
  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium text-gray-900 dark:text-gray-100">
          圆角大小
        </Label>
        <span className="text-sm text-gray-500 dark:text-gray-400">
          {value}px
        </span>
      </div>
      
      {/* 滑块 */}
      <div className="px-2">
        <Slider
          value={[value]}
          onValueChange={(values) => onChange(values[0])}
          min={BORDER_RADIUS_CONFIG.min}
          max={BORDER_RADIUS_CONFIG.max}
          step={BORDER_RADIUS_CONFIG.step}
          disabled={disabled}
          className="w-full"
        />
      </div>
      
      {/* 预设值快捷按钮 */}
      <div className="flex flex-wrap gap-2">
        {PRESET_BORDER_RADIUS.map((preset) => (
          <button
            key={preset.value}
            onClick={() => !disabled && onChange(preset.value)}
            disabled={disabled}
            className={`
              px-2 py-1 text-xs rounded transition-colors
              ${value === preset.value
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
              }
              ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
            `}
          >
            {preset.label}
          </button>
        ))}
      </div>
      
      {/* 预览效果 */}
      <div className="flex items-center justify-center p-4 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-lg">
        <div
          className="w-12 h-12 bg-blue-500 transition-all duration-200"
          style={{ 
            borderRadius: `${value}px`
          }}
        />
      </div>
      
      {/* 说明文字 */}
      <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
        在卡片样式中调整整体圆角，在图标样式中调整图标圆角
      </p>
    </div>
  );
};

export default BorderRadiusSlider;
