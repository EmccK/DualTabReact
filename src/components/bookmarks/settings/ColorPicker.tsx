/**
 * 增强的颜色选择器组件
 * 支持预设颜色、自定义颜色和渐变
 */

import React, { useState, useCallback } from 'react';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Palette, Pipette, Paintbrush } from 'lucide-react';
import { DEFAULT_COLOR_PALETTE, PRESET_BACKGROUND_COLORS, PRESET_TEXT_COLORS } from '@/constants';

interface ColorPickerProps {
  value?: string;
  onChange: (color: string) => void;
  label?: string;
  disabled?: boolean;
  className?: string;
  showGradient?: boolean;
  type?: 'background' | 'text' | 'border';
}

const ColorPicker: React.FC<ColorPickerProps> = ({
  value = '#3b82f6',
  onChange,
  label = '颜色',
  disabled = false,
  className = '',
  showGradient = false,
  type = 'background',
}) => {
  const [customColor, setCustomColor] = useState(value);
  const [isCustomMode, setIsCustomMode] = useState(false);

  // 获取预设颜色
  const getPresetColors = () => {
    switch (type) {
      case 'text':
        return PRESET_TEXT_COLORS;
      case 'background':
        return PRESET_BACKGROUND_COLORS;
      default:
        return DEFAULT_COLOR_PALETTE.map((color, index) => ({
          label: `颜色 ${index + 1}`,
          value: color,
        }));
    }
  };

  // 处理预设颜色选择
  const handlePresetSelect = useCallback((color: string) => {
    onChange(color);
    setCustomColor(color);
    setIsCustomMode(false);
  }, [onChange]);

  // 处理自定义颜色输入
  const handleCustomColorChange = useCallback((color: string) => {
    setCustomColor(color);
    // 验证颜色格式
    if (/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(color)) {
      onChange(color);
    }
  }, [onChange]);

  // 处理原生颜色选择器
  const handleNativeColorChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const color = e.target.value;
    setCustomColor(color);
    onChange(color);
  }, [onChange]);

  const presetColors = getPresetColors();

  return (
    <div className={`space-y-3 ${className}`}>
      <Label className="text-sm font-medium text-gray-900 dark:text-gray-100">
        {label}
      </Label>

      <Tabs defaultValue="preset" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="preset" className="flex items-center space-x-1">
            <Palette size={14} />
            <span>预设</span>
          </TabsTrigger>
          <TabsTrigger value="custom" className="flex items-center space-x-1">
            <Pipette size={14} />
            <span>自定义</span>
          </TabsTrigger>
        </TabsList>

        {/* 预设颜色选择 */}
        <TabsContent value="preset" className="space-y-3">
          <div className="grid grid-cols-5 gap-2">
            {presetColors.map((color, index) => (
              <button
                key={index}
                onClick={() => handlePresetSelect(color.value)}
                disabled={disabled}
                className={`
                  w-full aspect-square rounded-lg border-2 transition-all duration-200
                  ${value === color.value 
                    ? 'border-gray-800 dark:border-gray-200 scale-110' 
                    : 'border-gray-300 dark:border-gray-600 hover:scale-105'
                  }
                  ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                `}
                style={{ backgroundColor: color.value }}
                title={color.label}
              />
            ))}
          </div>
          
          {/* 当前选择显示 */}
          <Card className="p-3">
            <div className="flex items-center space-x-3">
              <div
                className="w-8 h-8 rounded-lg border border-gray-300 dark:border-gray-600"
                style={{ backgroundColor: value }}
              />
              <div>
                <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  当前颜色
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 font-mono">
                  {value}
                </div>
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* 自定义颜色选择 */}
        <TabsContent value="custom" className="space-y-3">
          <div className="space-y-3">
            {/* 原生颜色选择器 */}
            <div className="flex items-center space-x-3">
              <input
                type="color"
                value={value}
                onChange={handleNativeColorChange}
                disabled={disabled}
                className="w-12 h-12 rounded-lg border border-gray-300 dark:border-gray-600 cursor-pointer disabled:cursor-not-allowed"
              />
              <div className="flex-1">
                <Label className="text-sm text-gray-600 dark:text-gray-400">
                  点击选择颜色
                </Label>
              </div>
            </div>

            {/* 手动输入 */}
            <div className="space-y-2">
              <Label className="text-sm text-gray-600 dark:text-gray-400">
                或输入颜色代码
              </Label>
              <Input
                type="text"
                value={customColor}
                onChange={(e) => handleCustomColorChange(e.target.value)}
                placeholder="#3b82f6"
                disabled={disabled}
                className="font-mono"
              />
            </div>

            {/* 颜色预览 */}
            <Card className="p-3">
              <div className="flex items-center space-x-3">
                <div
                  className="w-12 h-12 rounded-lg border border-gray-300 dark:border-gray-600"
                  style={{ backgroundColor: value }}
                />
                <div>
                  <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    预览效果
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 font-mono">
                    {value}
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* 快速操作 */}
      <div className="flex justify-between items-center pt-2 border-t border-gray-200 dark:border-gray-700">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onChange('transparent')}
          disabled={disabled}
        >
          透明
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onChange('#ffffff')}
          disabled={disabled}
        >
          重置
        </Button>
      </div>
    </div>
  );
};

export default ColorPicker;
