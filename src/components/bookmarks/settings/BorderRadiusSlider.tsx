/**
 * 边框圆角滑块组件
 * 支持0-20px的圆角设置
 */

import React from 'react';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { BORDER_RADIUS_RANGE, BORDER_RADIUS_PRESETS } from '@/constants';

interface BorderRadiusSliderProps {
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
  className?: string;
  showPreview?: boolean;
}

const BorderRadiusSlider: React.FC<BorderRadiusSliderProps> = ({
  value,
  onChange,
  disabled = false,
  className = '',
  showPreview = true,
}) => {
  // 预设值快速选择
  const handlePresetClick = (presetValue: number) => {
    if (!disabled) {
      onChange(presetValue);
    }
  };

  // 获取当前预设的标签
  const getCurrentPresetLabel = () => {
    const preset = BORDER_RADIUS_PRESETS.find(p => p.value === value);
    return preset ? preset.label : `${value}px`;
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium text-gray-900 dark:text-gray-100">
          圆角大小
        </Label>
        <span className="text-sm text-gray-500 dark:text-gray-400">
          {getCurrentPresetLabel()}
        </span>
      </div>

      {/* 滑块控件 */}
      <div className="px-2">
        <Slider
          value={[value]}
          onValueChange={(values) => onChange(values[0])}
          min={BORDER_RADIUS_RANGE.min}
          max={BORDER_RADIUS_RANGE.max}
          step={BORDER_RADIUS_RANGE.step}
          disabled={disabled}
          className="w-full"
        />
        
        {/* 刻度标记 */}
        <div className="flex justify-between text-xs text-gray-400 mt-1">
          <span>{BORDER_RADIUS_RANGE.min}px</span>
          <span>{BORDER_RADIUS_RANGE.max}px</span>
        </div>
      </div>

      {/* 预设值快速选择 */}
      <div className="space-y-2">
        <Label className="text-xs text-gray-600 dark:text-gray-400">
          快速选择
        </Label>
        <div className="flex flex-wrap gap-2">
          {BORDER_RADIUS_PRESETS.map((preset) => (
            <button
              key={preset.value}
              onClick={() => handlePresetClick(preset.value)}
              disabled={disabled}
              className={`
                px-2 py-1 text-xs rounded border transition-colors
                ${value === preset.value
                  ? 'bg-blue-500 text-white border-blue-500'
                  : 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700'
                }
                ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
              `}
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      {/* 实时预览 */}
      {showPreview && (
        <div className="space-y-2">
          <Label className="text-xs text-gray-600 dark:text-gray-400">
            预览效果
          </Label>
          <Card className="p-4 flex justify-center">
            <div className="flex space-x-3">
              {/* 详细样式预览 */}
              <div className="text-center">
                <div
                  className="w-16 h-12 bg-gradient-to-br from-blue-500 to-purple-500 flex flex-col items-center justify-center mb-1"
                  style={{ borderRadius: `${value}px` }}
                >
                  <div className="w-4 h-4 bg-white/80 rounded-full mb-1"></div>
                  <div className="w-8 h-0.5 bg-white/80 rounded"></div>
                </div>
                <span className="text-xs text-gray-500">详细</span>
              </div>
              
              {/* 紧凑样式预览 */}
              <div className="text-center">
                <div
                  className="w-12 h-12 bg-gradient-to-br from-green-500 to-blue-500 flex flex-col items-center justify-between p-1"
                  style={{ borderRadius: `${value}px` }}
                >
                  <div className="flex-1 flex items-center">
                    <div className="w-3 h-3 bg-white/80 rounded-full"></div>
                  </div>
                  <div className="w-6 h-0.5 bg-white/80 rounded"></div>
                </div>
                <span className="text-xs text-gray-500">紧凑</span>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default BorderRadiusSlider;
