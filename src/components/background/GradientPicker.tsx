/**
 * 渐变选择器组件
 * 支持预设渐变选择
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
import type { BackgroundSettings } from '@/types/settings';

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

  return (
    <div className={`space-y-4 ${className}`}>
      {/* 当前渐变预览 */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700">当前渐变</label>
        <div 
          className="w-full h-16 rounded-lg border border-gray-200 shadow-inner"
          style={{ background: currentGradientCSS }}
        />
      </div>

      {/* 模式切换 */}
      <div className="flex gap-2">
        <Button
          variant={!isCustomMode ? "default" : "outline"}
          size="sm"
          onClick={() => setIsCustomMode(false)}
        >
          预设渐变
        </Button>
        <Button
          variant={isCustomMode ? "default" : "outline"}
          size="sm"
          onClick={() => setIsCustomMode(true)}
        >
          自定义渐变
        </Button>
      </div>

      {!isCustomMode ? (
        // 预设渐变选择器
        <div className="space-y-4">
          {/* 分类选择 */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">渐变分类</label>
            <div className="flex flex-wrap gap-2">
              {GRADIENT_CATEGORIES.map((category) => (
                <Button
                  key={category.id}
                  variant={selectedCategory === category.id ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory(category.id)}
                  className="h-8"
                >
                  <span className="mr-1">{category.icon}</span>
                  {category.name}
                </Button>
              ))}
            </div>
          </div>

          {/* 渐变预设网格 */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              选择渐变 
              <Badge variant="secondary" className="ml-2">
                {currentGradients.length}个
              </Badge>
            </label>
            <div className="max-h-64 overflow-y-auto rounded-lg border">
              <div className="grid grid-cols-2 gap-3 p-4">
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
                          className="w-full h-20 rounded-t-lg"
                          style={{ background: presetCSS }}
                        />
                        <div className="p-3">
                          <p className="text-sm font-medium text-center text-gray-800">
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
        <div className="space-y-4">
          <div className="p-4 border border-gray-200 rounded-lg bg-gray-50">
            <p className="text-sm text-gray-600 text-center">
              🚧 自定义渐变编辑器即将推出
            </p>
            <p className="text-xs text-gray-500 text-center mt-1">
              目前可以使用预设渐变，后续版本将支持完全自定义
            </p>
          </div>
        </div>
      )}

      {/* 渐变信息显示 */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700">渐变信息</label>
        <div className="text-xs space-y-1 p-3 bg-gray-50 rounded-lg font-mono">
          <div><span className="text-gray-600">类型:</span> {value.type}</div>
          <div><span className="text-gray-600">方向:</span> {value.direction}°</div>
          <div><span className="text-gray-600">颜色数:</span> {value.colors.length}</div>
          <div className="break-all">
            <span className="text-gray-600">CSS:</span> {currentGradientCSS}
          </div>
        </div>
      </div>
    </div>
  );
}
