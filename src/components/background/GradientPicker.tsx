import React, { useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Check, Palette } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { BackgroundSettings } from '@/types/settings';

interface GradientPickerProps {
  currentGradient: BackgroundSettings['gradient'];
  gradientPresets: BackgroundSettings['gradientPresets'];
  onGradientSelect: (gradient: BackgroundSettings['gradient']) => void;
  onPresetSelect: (presetId: string) => void;
  className?: string;
}

/**
 * 渐变背景选择器组件
 * 提供预设渐变选择和自定义渐变功能
 */
export function GradientPicker({
  currentGradient,
  gradientPresets,
  onGradientSelect,
  onPresetSelect,
  className,
}: GradientPickerProps) {
  
  // 检查当前是否选中某个预设
  const isPresetSelected = useCallback((preset: BackgroundSettings['gradientPresets'][0]) => {
    const current = currentGradient;
    const target = preset.gradient;
    
    return (
      current.type === target.type &&
      current.direction === target.direction &&
      current.colors.length === target.colors.length &&
      current.colors.every((color, index) => 
        color.color === target.colors[index]?.color &&
        color.position === target.colors[index]?.position
      ) &&
      current.radialPosition.x === target.radialPosition.x &&
      current.radialPosition.y === target.radialPosition.y
    );
  }, [currentGradient]);

  // 生成渐变CSS样式
  const generateGradientStyle = useCallback((gradient: BackgroundSettings['gradient']) => {
    const gradientColors = gradient.colors
      .sort((a, b) => a.position - b.position)
      .map(c => `${c.color} ${c.position}%`)
      .join(', ');
    
    if (gradient.type === 'linear') {
      return `linear-gradient(${gradient.direction}deg, ${gradientColors})`;
    } else {
      return `radial-gradient(circle at ${gradient.radialPosition.x}% ${gradient.radialPosition.y}%, ${gradientColors})`;
    }
  }, []);

  // 预设项组件
  const PresetItem = ({ preset }: { preset: BackgroundSettings['gradientPresets'][0] }) => {
    const isSelected = isPresetSelected(preset);
    const gradientStyle = generateGradientStyle(preset.gradient);

    return (
      <Card 
        className={cn(
          'cursor-pointer transition-all duration-200 hover:scale-105',
          isSelected ? 'ring-2 ring-blue-500 shadow-lg' : 'hover:shadow-md'
        )}
        onClick={() => onPresetSelect(preset.id)}
      >
        <CardContent className="p-0">
          <div className="relative">
            {/* 渐变预览 */}
            <div
              className="w-full h-20 rounded-t-lg"
              style={{ background: gradientStyle }}
            />
            
            {/* 选中标识 */}
            {isSelected && (
              <div className="absolute top-2 right-2">
                <div className="w-6 h-6 bg-white/90 rounded-full flex items-center justify-center shadow-md">
                  <Check className="w-4 h-4 text-blue-600" />
                </div>
              </div>
            )}
            
            {/* 渐变类型标识 */}
            <div className="absolute bottom-2 left-2">
              <div className={cn(
                'px-2 py-1 text-xs font-medium rounded shadow-sm',
                preset.gradient.type === 'linear' 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-purple-500 text-white'
              )}>
                {preset.gradient.type === 'linear' ? '线性' : '径向'}
              </div>
            </div>
          </div>
          
          {/* 预设名称 */}
          <div className="p-3">
            <p className="text-sm font-medium text-gray-700 text-center">
              {preset.name}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className={cn('space-y-4', className)}>
      {/* 当前渐变预览 */}
      <div className="space-y-2">
        <Label className="text-sm font-medium text-gray-700">
          当前渐变
        </Label>
        <Card>
          <CardContent className="p-3">
            <div className="flex items-center gap-3">
              <div
                className="w-16 h-10 rounded border border-gray-200"
                style={{ background: generateGradientStyle(currentGradient) }}
              />
              <div className="flex-1 text-sm text-gray-600">
                <p>{currentGradient.type === 'linear' ? '线性渐变' : '径向渐变'}</p>
                <p className="text-xs">
                  {currentGradient.colors.length} 个颜色节点
                  {currentGradient.type === 'linear' && `, ${currentGradient.direction}°`}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 预设渐变 */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Palette className="w-4 h-4 text-gray-600" />
          <Label className="text-sm font-medium text-gray-700">
            预设渐变
          </Label>
        </div>
        
        <div className="grid grid-cols-2 gap-3">
          {gradientPresets.map((preset) => (
            <PresetItem key={preset.id} preset={preset} />
          ))}
        </div>
      </div>

      {/* 自定义渐变提示 */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
        <div className="flex items-start gap-2">
          <Palette className="w-4 h-4 text-blue-600 mt-0.5" />
          <div className="text-sm text-blue-800">
            <p className="font-medium">渐变编辑器</p>
            <p className="text-xs mt-1">
              自定义渐变编辑功能将在后续版本中提供，敬请期待！
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
