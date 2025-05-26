/**
 * 自定义渐变编辑器 - 颜色节点组件
 */

import React from 'react';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import type { ColorStop } from '@/types/gradient';
import { isLightColor } from '@/utils/gradient';

interface ColorStopNodeProps {
  colorStop: ColorStop;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onRemove: (id: string) => void;
  onColorChange: (id: string, color: string) => void;
  onPositionChange: (id: string, position: number) => void;
  canRemove: boolean;
}

export function ColorStopNode({
  colorStop,
  isSelected,
  onSelect,
  onRemove,
  onColorChange,
  onPositionChange,
  canRemove
}: ColorStopNodeProps) {
  const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onColorChange(colorStop.id, e.target.value);
  };

  const handlePositionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const position = parseFloat(e.target.value);
    if (!isNaN(position)) {
      onPositionChange(colorStop.id, Math.max(0, Math.min(100, position)));
    }
  };

  const isLight = isLightColor(colorStop.color);

  return (
    <div 
      className={`
        relative flex items-center gap-2 p-3 rounded-lg border-2 cursor-pointer transition-all
        ${isSelected 
          ? 'border-blue-500 bg-blue-50 shadow-md' 
          : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
        }
      `}
      onClick={() => onSelect(colorStop.id)}
    >
      {/* 颜色预览和选择 */}
      <div className="relative">
        <div 
          className="w-8 h-8 rounded-lg border border-gray-300 shadow-inner"
          style={{ backgroundColor: colorStop.color }}
        />
        <input
          type="color"
          value={colorStop.color}
          onChange={handleColorChange}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          title="选择颜色"
        />
      </div>

      {/* 颜色信息 */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={colorStop.color.toUpperCase()}
            onChange={(e) => {
              const color = e.target.value;
              if (/^#[0-9A-Fa-f]{6}$/.test(color)) {
                onColorChange(colorStop.id, color);
              }
            }}
            className="text-sm font-mono bg-transparent border-none outline-none w-20"
            placeholder="#FFFFFF"
          />
          <span className="text-xs text-gray-500">
            {colorStop.position.toFixed(1)}%
          </span>
        </div>
        
        {/* 位置滑块 */}
        <input
          type="range"
          min="0"
          max="100"
          step="0.1"
          value={colorStop.position}
          onChange={handlePositionChange}
          className="w-full mt-1 h-1 slider"
        />
      </div>

      {/* 删除按钮 */}
      {canRemove && (
        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            onRemove(colorStop.id);
          }}
          className="p-1 h-6 w-6 text-red-500 hover:text-red-700 hover:bg-red-50"
        >
          <X className="w-3 h-3" />
        </Button>
      )}
    </div>
  );
}
