/**
 * 自定义渐变编辑器 - 主组件
 */

import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Plus, 
  RotateCcw, 
  Save, 
  Palette,
  Shuffle,
  Eye,
  EyeOff
} from 'lucide-react';

import { ColorStopNode } from './ColorStopNode';
import { GradientPreview } from './GradientPreview';
import type { CustomGradient, ColorStop, GradientEditorState } from '@/types/gradient';
import { 
  createDefaultCustomGradient,
  createColorStop,
  generateCustomGradientCSS,
  generateRandomColor,
  validateCustomGradient,
  sortColorStops,
  CUSTOM_GRADIENT_TEMPLATES
} from '@/utils/gradient';

interface CustomGradientEditorProps {
  initialGradient?: CustomGradient;
  onChange: (gradient: CustomGradient) => void;
  onSave?: (gradient: CustomGradient) => void;
  className?: string;
}

export function CustomGradientEditor({
  initialGradient,
  onChange,
  onSave,
  className = ''
}: CustomGradientEditorProps) {
  const [editorState, setEditorState] = useState<GradientEditorState>(() => ({
    gradient: initialGradient || createDefaultCustomGradient(),
    selectedStopId: null,
    isDragging: false,
    previewMode: false
  }));

  const { gradient, selectedStopId, previewMode } = editorState;

  // 更新渐变状态
  const updateGradient = useCallback((updates: Partial<CustomGradient>) => {
    const newGradient = {
      ...gradient,
      ...updates,
      updatedAt: Date.now()
    };
    
    setEditorState(prev => ({
      ...prev,
      gradient: newGradient
    }));
    
    onChange(newGradient);
  }, [gradient, onChange]);

  // 添加颜色节点
  const addColorStop = useCallback(() => {
    const sortedStops = sortColorStops(gradient.colorStops);
    let newPosition = 50;
    
    // 找到合适的插入位置
    if (sortedStops.length >= 2) {
      const gaps = [];
      for (let i = 0; i < sortedStops.length - 1; i++) {
        const gap = sortedStops[i + 1].position - sortedStops[i].position;
        gaps.push({
          position: sortedStops[i].position + gap / 2,
          size: gap
        });
      }
      
      // 选择最大的间隙
      const largestGap = gaps.reduce((max, gap) => gap.size > max.size ? gap : max, gaps[0]);
      newPosition = largestGap.position;
    }

    const newStop = createColorStop(generateRandomColor(), newPosition);
    
    updateGradient({
      colorStops: [...gradient.colorStops, newStop]
    });
    
    setEditorState(prev => ({
      ...prev,
      selectedStopId: newStop.id
    }));
  }, [gradient.colorStops, updateGradient]);

  // 删除颜色节点
  const removeColorStop = useCallback((stopId: string) => {
    if (gradient.colorStops.length <= 2) return;
    
    updateGradient({
      colorStops: gradient.colorStops.filter(stop => stop.id !== stopId)
    });
    
    if (selectedStopId === stopId) {
      setEditorState(prev => ({
        ...prev,
        selectedStopId: null
      }));
    }
  }, [gradient.colorStops, selectedStopId, updateGradient]);

  // 更新颜色节点颜色
  const updateColorStopColor = useCallback((stopId: string, color: string) => {
    updateGradient({
      colorStops: gradient.colorStops.map(stop =>
        stop.id === stopId ? { ...stop, color } : stop
      )
    });
  }, [gradient.colorStops, updateGradient]);

  // 更新颜色节点位置
  const updateColorStopPosition = useCallback((stopId: string, position: number) => {
    updateGradient({
      colorStops: gradient.colorStops.map(stop =>
        stop.id === stopId ? { ...stop, position } : stop
      )
    });
  }, [gradient.colorStops, updateGradient]);

  // 选择颜色节点
  const selectColorStop = useCallback((stopId: string) => {
    setEditorState(prev => ({
      ...prev,
      selectedStopId: prev.selectedStopId === stopId ? null : stopId
    }));
  }, []);

  // 重置为默认渐变
  const resetGradient = useCallback(() => {
    const defaultGradient = createDefaultCustomGradient();
    setEditorState(prev => ({
      ...prev,
      gradient: defaultGradient,
      selectedStopId: null
    }));
    onChange(defaultGradient);
  }, [onChange]);

  // 应用模板
  const applyTemplate = useCallback((template: Partial<CustomGradient>) => {
    const newGradient = {
      ...gradient,
      ...template,
      id: gradient.id,
      createdAt: gradient.createdAt,
      updatedAt: Date.now()
    } as CustomGradient;
    
    setEditorState(prev => ({
      ...prev,
      gradient: newGradient,
      selectedStopId: null
    }));
    
    onChange(newGradient);
  }, [gradient, onChange]);

  // 保存渐变
  const handleSave = useCallback(() => {
    const errors = validateCustomGradient(gradient);
    if (errors.length > 0) {
      alert(`渐变验证失败:\n${errors.join('\n')}`);
      return;
    }
    
    if (onSave) {
      onSave(gradient);
    }
  }, [gradient, onSave]);

  const validationErrors = validateCustomGradient(gradient);
  const canSave = validationErrors.length === 0;

  return (
    <div className={`space-y-4 ${className}`}>
      {/* 预览区域 */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-2">
              <Palette className="w-4 h-4 text-indigo-600" />
              渐变预览
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setEditorState(prev => ({ ...prev, previewMode: !previewMode }))}
                className="h-7 px-2"
              >
                {previewMode ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                <span className="ml-1 text-xs">
                  {previewMode ? '编辑' : '预览'}
                </span>
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <GradientPreview 
            gradient={gradient} 
            showActions={previewMode}
          />
        </CardContent>
      </Card>

      {!previewMode && (
        <>
          {/* 基础设置 */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">基础设置</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* 渐变名称 */}
              <div className="space-y-1">
                <Label htmlFor="gradient-name" className="text-xs">渐变名称</Label>
                <Input
                  id="gradient-name"
                  value={gradient.name}
                  onChange={(e) => updateGradient({ name: e.target.value })}
                  placeholder="输入渐变名称"
                  className="h-8 text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                {/* 渐变类型 */}
                <div className="space-y-1">
                  <Label className="text-xs">渐变类型</Label>
                  <Select
                    value={gradient.type}
                    onValueChange={(type: 'linear' | 'radial') => updateGradient({ type })}
                  >
                    <SelectTrigger className="h-8 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="linear">线性渐变</SelectItem>
                      <SelectItem value="radial">径向渐变</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* 渐变方向/形状 */}
                {gradient.type === 'linear' ? (
                  <div className="space-y-1">
                    <Label className="text-xs">角度 ({gradient.direction}°)</Label>
                    <Input
                      type="range"
                      min="0"
                      max="360"
                      step="1"
                      value={gradient.direction}
                      onChange={(e) => updateGradient({ direction: parseInt(e.target.value) })}
                      className="h-8"
                    />
                  </div>
                ) : (
                  <div className="space-y-1">
                    <Label className="text-xs">形状</Label>
                    <Select
                      value={gradient.radialShape}
                      onValueChange={(radialShape: 'circle' | 'ellipse') => 
                        updateGradient({ radialShape })
                      }
                    >
                      <SelectTrigger className="h-8 text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="circle">圆形</SelectItem>
                        <SelectItem value="ellipse">椭圆</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* 颜色节点管理 */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm flex items-center gap-2">
                  颜色节点
                  <Badge variant="secondary" className="text-xs">
                    {gradient.colorStops.length}
                  </Badge>
                </CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={addColorStop}
                  className="h-7 px-2"
                >
                  <Plus className="w-3 h-3 mr-1" />
                  添加
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {sortColorStops(gradient.colorStops).map((colorStop) => (
                  <ColorStopNode
                    key={colorStop.id}
                    colorStop={colorStop}
                    isSelected={selectedStopId === colorStop.id}
                    onSelect={selectColorStop}
                    onRemove={removeColorStop}
                    onColorChange={updateColorStopColor}
                    onPositionChange={updateColorStopPosition}
                    canRemove={gradient.colorStops.length > 2}
                  />
                ))}
              </div>
            </CardContent>
          </Card>

          {/* 快速模板 */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">快速模板</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-2">
                {CUSTOM_GRADIENT_TEMPLATES.map((template, index) => (
                  <Button
                    key={index}
                    variant="ghost"
                    onClick={() => applyTemplate(template)}
                    className="h-8 justify-start text-sm"
                  >
                    <div 
                      className="w-4 h-4 rounded border mr-2"
                      style={{
                        background: generateCustomGradientCSS({
                          ...gradient,
                          ...template
                        } as CustomGradient)
                      }}
                    />
                    {template.name}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* 操作按钮 */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={resetGradient}
              className="flex-1 h-8"
            >
              <RotateCcw className="w-3 h-3 mr-1" />
              重置
            </Button>
            {onSave && (
              <Button
                onClick={handleSave}
                disabled={!canSave}
                className="flex-1 h-8"
              >
                <Save className="w-3 h-3 mr-1" />
                保存
              </Button>
            )}
          </div>

          {/* 验证错误提示 */}
          {validationErrors.length > 0 && (
            <Card className="border-red-200 bg-red-50">
              <CardContent className="p-3">
                <div className="text-sm text-red-800">
                  <p className="font-medium mb-1">渐变配置错误:</p>
                  <ul className="text-xs space-y-0.5">
                    {validationErrors.map((error, index) => (
                      <li key={index}>• {error}</li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
