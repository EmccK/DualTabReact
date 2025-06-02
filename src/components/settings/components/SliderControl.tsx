import React from 'react';
import { Slider } from '@/components/ui/slider';

interface SliderControlProps {
  value: number;
  onValueChange: (value: number) => void;
  min: number;
  max: number;
  step?: number;
  disabled?: boolean;
  showValue?: boolean;
  valueFormatter?: (value: number) => string;
  className?: string;
}

/**
 * 设置滑块控件组件
 * 基于Shadcn/UI Slider组件的封装
 */
export function SliderControl({ 
  value, 
  onValueChange, 
  min, 
  max, 
  step = 1,
  disabled = false,
  showValue = true,
  valueFormatter,
  className
}: SliderControlProps) {
  const handleValueChange = (values: number[]) => {
    onValueChange(values[0]);
  };

  const formatValue = (val: number) => {
    if (valueFormatter) {
      return valueFormatter(val);
    }
    return (val || 0).toString();
  };

  return (
    <div className={`flex items-center space-x-3 ${className}`}>
      <Slider
        value={[value || 0]}
        onValueChange={handleValueChange}
        min={min}
        max={max}
        step={step}
        disabled={disabled}
        className="flex-1"
      />
      {showValue && (
        <span className="text-sm text-gray-600 font-medium min-w-[3rem] text-right">
          {formatValue(value)}
        </span>
      )}
    </div>
  );
}
