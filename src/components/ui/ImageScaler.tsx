/**
 * 图片缩放组件
 * 支持图片预览、缩放、位置调整和旋转
 */

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { RotateCw, RotateCcw, Move, ZoomIn, ZoomOut, Palette } from 'lucide-react';
import type { ImageScaleConfig } from '@/types/bookmark-style.types';

interface ImageScalerProps {
  imageUrl: string;
  config: ImageScaleConfig;
  onConfigChange: (config: ImageScaleConfig) => void;
  onImageGenerated?: (dataUrl: string) => void;
  size?: number; // 输出图片尺寸，默认64px
  className?: string;
}

export function ImageScaler({
  imageUrl,
  config,
  onConfigChange,
  onImageGenerated,
  size = 64,
  className
}: ImageScalerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [imageLoaded, setImageLoaded] = useState(false);

  // 生成缩放后的图片
  const generateScaledImage = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !imageLoaded) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      // 设置画布尺寸
      canvas.width = size;
      canvas.height = size;

      // 绘制背景
      if (config.backgroundColor && (config.backgroundOpacity ?? 100) > 0) {
        const opacity = (config.backgroundOpacity ?? 100) / 100;
        ctx.globalAlpha = opacity;
        ctx.fillStyle = config.backgroundColor;
        ctx.fillRect(0, 0, size, size);
        ctx.globalAlpha = 1; // 重置透明度
      } else {
        // 透明背景
        ctx.clearRect(0, 0, size, size);
      }

      // 保存当前状态
      ctx.save();

      // 移动到画布中心
      ctx.translate(size / 2, size / 2);

      // 应用旋转
      if (config.rotation) {
        ctx.rotate((config.rotation * Math.PI) / 180);
      }

      // 计算适合画布的基础尺寸（100%时正好放下）
      const aspectRatio = img.width / img.height;
      let baseWidth, baseHeight;

      if (aspectRatio > 1) {
        // 宽图片：以宽度为准
        baseWidth = size;
        baseHeight = size / aspectRatio;
      } else {
        // 高图片或正方形：以高度为准
        baseHeight = size;
        baseWidth = size * aspectRatio;
      }

      // 应用用户缩放
      const finalWidth = baseWidth * config.scale;
      const finalHeight = baseHeight * config.scale;

      // 应用偏移（转换为像素值）
      const offsetX = (config.offsetX / 100) * size;
      const offsetY = (config.offsetY / 100) * size;

      // 绘制图片
      ctx.drawImage(
        img,
        -finalWidth / 2 + offsetX,
        -finalHeight / 2 + offsetY,
        finalWidth,
        finalHeight
      );

      // 恢复状态
      ctx.restore();

      // 生成数据URL
      const dataUrl = canvas.toDataURL('image/png');
      onImageGenerated?.(dataUrl);
    };

    img.src = imageUrl;
  }, [imageUrl, config, size, imageLoaded, onImageGenerated]);

  // 当配置改变时重新生成图片
  useEffect(() => {
    generateScaledImage();
  }, [generateScaledImage]);

  // 检查图片是否加载完成
  useEffect(() => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => setImageLoaded(true);
    img.onerror = () => setImageLoaded(false);
    img.src = imageUrl;
  }, [imageUrl]);

  // 处理鼠标拖拽
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging) return;

    const deltaX = e.clientX - dragStart.x;
    const deltaY = e.clientY - dragStart.y;

    // 转换为百分比偏移
    const offsetXDelta = (deltaX / size) * 100;
    const offsetYDelta = (deltaY / size) * 100;

    onConfigChange({
      ...config,
      offsetX: Math.max(-100, Math.min(100, config.offsetX + offsetXDelta)),
      offsetY: Math.max(-100, Math.min(100, config.offsetY + offsetYDelta))
    });

    setDragStart({ x: e.clientX, y: e.clientY });
  }, [isDragging, dragStart, config, onConfigChange, size]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // 重置配置
  const resetConfig = useCallback(() => {
    onConfigChange({
      scale: 1,
      offsetX: 0,
      offsetY: 0,
      rotation: 0,
      backgroundColor: '#ffffff',
      backgroundOpacity: 100
    });
  }, [onConfigChange]);

  // 旋转图片
  const rotateImage = useCallback((degrees: number) => {
    onConfigChange({
      ...config,
      rotation: ((config.rotation || 0) + degrees) % 360
    });
  }, [config, onConfigChange]);

  return (
    <div className={className}>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium">图片缩放调整</Label>
          <Button
            variant="outline"
            size="sm"
            onClick={resetConfig}
            className="text-xs"
          >
            重置
          </Button>
        </div>

        {/* 预览区域 - 缩小尺寸 */}
        <div className="flex justify-center">
          <div 
            className="relative border-2 border-dashed border-gray-300 rounded-lg overflow-hidden cursor-move"
            style={{ width: size * 1.5, height: size * 1.5 }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          >
            <canvas
              ref={canvasRef}
              width={size}
              height={size}
              className="w-full h-full object-contain"
              style={{ imageRendering: 'crisp-edges' }}
            />
            {isDragging && (
              <div className="absolute inset-0 bg-blue-500/20 flex items-center justify-center">
                <Move className="w-4 h-4 text-blue-600" />
              </div>
            )}
          </div>
        </div>

        {/* 控制面板 - 紧凑布局 */}
        <div className="space-y-2">
          {/* 缩放和旋转在一行 */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <Label className="text-xs">缩放</Label>
                <span className="text-xs text-gray-500">{(config.scale * 100).toFixed(0)}%</span>
              </div>
              <div className="flex items-center space-x-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onConfigChange({ ...config, scale: Math.max(0.1, config.scale - 0.1) })}
                  disabled={config.scale <= 0.1}
                  className="h-6 w-6 p-0"
                >
                  <ZoomOut className="w-3 h-3" />
                </Button>
                <Slider
                  value={[config.scale]}
                  onValueChange={([value]) => onConfigChange({ ...config, scale: value })}
                  min={0.1}
                  max={3}
                  step={0.1}
                  className="flex-1"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onConfigChange({ ...config, scale: Math.min(3, config.scale + 0.1) })}
                  disabled={config.scale >= 3}
                  className="h-6 w-6 p-0"
                >
                  <ZoomIn className="w-3 h-3" />
                </Button>
              </div>
            </div>
            
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <Label className="text-xs">旋转</Label>
                <span className="text-xs text-gray-500">{config.rotation || 0}°</span>
              </div>
              <div className="flex items-center space-x-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => rotateImage(-90)}
                  className="h-6 w-6 p-0"
                >
                  <RotateCcw className="w-3 h-3" />
                </Button>
                <Slider
                  value={[config.rotation || 0]}
                  onValueChange={([value]) => onConfigChange({ ...config, rotation: value })}
                  min={0}
                  max={360}
                  step={15}
                  className="flex-1"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => rotateImage(90)}
                  className="h-6 w-6 p-0"
                >
                  <RotateCw className="w-3 h-3" />
                </Button>
              </div>
            </div>
          </div>

          {/* 位置控制 */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">水平位置</Label>
              <Slider
                value={[config.offsetX]}
                onValueChange={([value]) => onConfigChange({ ...config, offsetX: value })}
                min={-100}
                max={100}
                step={1}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">垂直位置</Label>
              <Slider
                value={[config.offsetY]}
                onValueChange={([value]) => onConfigChange({ ...config, offsetY: value })}
                min={-100}
                max={100}
                step={1}
              />
            </div>
          </div>

          {/* 背景设置 - 折叠显示 */}
          <div className="border-t pt-2">
            <div className="grid grid-cols-2 gap-3">
              {/* 背景颜色 */}
              <div className="space-y-1">
                <Label className="text-xs">背景颜色</Label>
                <div className="flex items-center space-x-1">
                  <input
                    type="color"
                    value={config.backgroundColor || '#ffffff'}
                    onChange={(e) => onConfigChange({
                      ...config,
                      backgroundColor: e.target.value,
                      backgroundOpacity: config.backgroundOpacity ?? 100
                    })}
                    className="w-6 h-6 rounded border border-gray-300 cursor-pointer"
                  />
                  <Input
                    value={config.backgroundColor || '#ffffff'}
                    onChange={(e) => onConfigChange({
                      ...config,
                      backgroundColor: e.target.value,
                      backgroundOpacity: config.backgroundOpacity ?? 100
                    })}
                    placeholder="#ffffff"
                    className="flex-1 font-mono text-xs h-6"
                    maxLength={7}
                  />
                </div>
              </div>

              {/* 背景透明度 */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <Label className="text-xs">透明度</Label>
                  <span className="text-xs text-gray-500">{config.backgroundOpacity ?? 100}%</span>
                </div>
                <Slider
                  value={[config.backgroundOpacity ?? 100]}
                  onValueChange={([value]) => onConfigChange({ 
                    ...config, 
                    backgroundOpacity: value,
                    backgroundColor: config.backgroundColor || '#ffffff'
                  })}
                  min={0}
                  max={100}
                  step={5}
                  className="w-full"
                />
              </div>
            </div>
          </div>
        </div>

        {/* 提示信息 */}
        <div className="text-xs text-gray-500 text-center">
          拖拽预览区域调整位置
        </div>
      </div>
    </div>
  );
}
