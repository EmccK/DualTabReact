/**
 * 渐变选择器组件
 * 支持预设渐变选择和自定义渐变编辑
 */

import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  GRADIENT_PRESETS, 
  GRADIENT_CATEGORIES, 
  generateGradientCSS,
  getGradientsByCategory 
} from '@/utils/gradientUtils';
import { CustomGradientEditor } from '@/components/gradient';
import { createDefaultCustomGradient, generateCustomGradientCSS } from '@/utils/gradient';
import type { BackgroundSettings } from '@/types/settings';
import type { CustomGradient } from '@/types/gradient';

interface GradientPickerProps {
  value: BackgroundSettings['gradient'];
  onChange: (gradient: BackgroundSettings['gradient']) => void;
  className?: string;
}

export function GradientPicker({ value, onChange, className }: GradientPickerProps) {
  const [selectedCategory, setSelectedCategory] = useState('classic');
  const [isCustomMode, setIsCustomMode] = useState(false);

  const currentGradients = getGradientsByCategory(selectedCategory);
  const currentGradientCSS = generateGradientCSS(value);

  const handlePresetSelect = (preset: typeof GRADIENT_PRESETS[0]) => {
    onChange(preset.gradient);
  };

  // 将自定义渐变转换为背景设置格式
  const convertCustomGradientToBackground = (customGradient: CustomGradient): BackgroundSettings['gradient'] => {
    return {
      type: customGradient.type,
      direction: customGradient.direction,
      colors: customGradient.colorStops.map(stop => ({
        color: stop.color,
        position: stop.position
      }))
    };
  };

  // 将背景设置格式转换为自定义渐变
  const convertBackgroundToCustomGradient = (): CustomGradient => {
    const now = Date.now();
    return {
      id: `custom-${now}`,
      name: '自定义渐变',
      type: value.type,
      direction: value.direction,
      radialShape: 'circle',
      radialPosition: 'center',
      colorStops: value.colors.map((color, index) => ({
        id: `stop-${index}`,
        color: color.color,
        position: color.position
      })),
      createdAt: now,
      updatedAt: now
    };
  };

  const handleCustomGradientChange = (customGradient: CustomGradient) => {
    const backgroundGradient = convertCustomGradientToBackground(customGradient);
    onChange(backgroundGradient);
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* 当前渐变预览 */}
      <div className="space-y-1">
        <label className="text-xs font-medium text-gray-700">当前渐变</label>
        <div 
          className="w-full h-12 rounded-lg border border-gray-200 shadow-inner"
          style={{ background: currentGradientCSS }}
        />
      </div>

      {/* 模式切换 */}
      <div className="flex gap-1">
        <Button
          variant={!isCustomMode ? "default" : "outline"}
          size="sm"
          onClick={() => setIsCustomMode(false)}
          className="h-7 text-xs"
        >
          预设渐变
        </Button>
        <Button
          variant={isCustomMode ? "default" : "outline"}
          size="sm"
          onClick={() => setIsCustomMode(true)}
          className="h-7 text-xs"
        >
          自定义渐变
        </Button>
      </div>

      {!isCustomMode ? (
        // 预设渐变选择器
        <div className="space-y-3">
          {/* 分类选择 */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-700">渐变分类</label>
            <div className="flex flex-wrap gap-1">
              {GRADIENT_CATEGORIES.map((category) => (
                <Button
                  key={category.id}
                  variant={selectedCategory === category.id ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory(category.id)}
                  className="h-6 text-xs px-2"
                >
                  <span className="mr-1 text-xs">{category.icon}</span>
                  {category.name}
                </Button>
              ))}
            </div>
          </div>

          {/* 渐变预设网格 */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-700">
              选择渐变 
              <Badge variant="secondary" className="ml-1 text-xs">
                {currentGradients.length}个
              </Badge>
            </label>
            <div className="max-h-48 overflow-y-auto rounded-lg border">
              <div className="grid grid-cols-4 gap-2 p-2">
                {currentGradients.map((preset) => {
                  const presetCSS = generateGradientCSS(preset.gradient);
                  const isSelected = JSON.stringify(preset.gradient) === JSON.stringify(value);
                  
                  return (
                    <Card 
                      key={preset.id}
                      className={`cursor-pointer transition-all hover:scale-105 ${
                        isSelected ? 'ring-2 ring-blue-500 shadow-lg' : 'hover:shadow-md'
                      }`}
                      onClick={() => handlePresetSelect(preset)}
                    >
                      <CardContent className="p-0">
                        <div 
                          className="w-full h-12 rounded-t-lg"
                          style={{ background: presetCSS }}
                        />
                        <div className="p-1">
                          <p className="text-xs font-medium text-center text-gray-800 truncate">
                            {preset.name}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      ) : (
        // 自定义渐变编辑器
        <div className="space-y-2">
          <CustomGradientEditor
            initialGradient={convertBackgroundToCustomGradient()}
            onChange={handleCustomGradientChange}
            className="bg-gray-50 rounded-lg p-2"
          />
        </div>
      )}

      {/* 渐变信息显示 - 紧凑版 */}
      <div className="space-y-1">
        <label className="text-xs font-medium text-gray-700">渐变信息</label>
        <div className="text-xs space-y-0.5 p-2 bg-gray-50 rounded-lg font-mono">
          <div className="flex gap-4">
            <span><span className="text-gray-600">类型:</span> {value.type}</span>
            <span><span className="text-gray-600">方向:</span> {value.direction}°</span>
            <span><span className="text-gray-600">颜色:</span> {value.colors.length}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
