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
    <Card className={className}>
      <CardContent className="p-4 space-y-4">
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

        {/* 预览区域 */}
        <div className="flex justify-center">
          <div 
            className="relative border-2 border-dashed border-gray-300 rounded-lg overflow-hidden cursor-move"
            style={{ width: size * 2, height: size * 2 }}
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
                <Move className="w-6 h-6 text-blue-600" />
              </div>
            )}
          </div>
        </div>

        {/* 控制面板 */}
        <div className="space-y-3">
          {/* 缩放控制 */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs">缩放比例</Label>
              <span className="text-xs text-gray-500">{(config.scale * 100).toFixed(0)}%</span>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onConfigChange({ ...config, scale: Math.max(0.1, config.scale - 0.1) })}
                disabled={config.scale <= 0.1}
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
              >
                <ZoomIn className="w-3 h-3" />
              </Button>
            </div>
          </div>

          {/* 位置控制 */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label className="text-xs">水平位置</Label>
              <Slider
                value={[config.offsetX]}
                onValueChange={([value]) => onConfigChange({ ...config, offsetX: value })}
                min={-100}
                max={100}
                step={1}
              />
            </div>
            <div className="space-y-2">
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

          {/* 旋转控制 */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs">旋转角度</Label>
              <span className="text-xs text-gray-500">{config.rotation || 0}°</span>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => rotateImage(-90)}
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
              >
                <RotateCw className="w-3 h-3" />
              </Button>
            </div>
          </div>

          {/* 背景设置 */}
          <div className="space-y-3 pt-2 border-t">
            <div className="flex items-center space-x-2">
              <Palette className="w-4 h-4 text-gray-500" />
              <Label className="text-xs font-medium">背景设置</Label>
            </div>

            {/* 背景颜色 */}
            <div className="space-y-2">
              <Label className="text-xs">背景颜色</Label>
              <div className="flex items-center space-x-2">
                <input
                  type="color"
                  value={config.backgroundColor || '#ffffff'}
                  onChange={(e) => onConfigChange({
                    ...config,
                    backgroundColor: e.target.value,
                    backgroundOpacity: config.backgroundOpacity ?? 100
                  })}
                  className="w-8 h-8 rounded border border-gray-300 cursor-pointer"
                />
                <Input
                  value={config.backgroundColor || '#ffffff'}
                  onChange={(e) => onConfigChange({
                    ...config,
                    backgroundColor: e.target.value,
                    backgroundOpacity: config.backgroundOpacity ?? 100
                  })}
                  placeholder="#ffffff"
                  className="flex-1 font-mono text-xs"
                  maxLength={7}
                />
              </div>
            </div>

            {/* 背景透明度 */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs">背景透明度</Label>
                <span className="text-xs text-gray-500">{config.backgroundOpacity ?? 100}%</span>
              </div>
              <Slider
                value={[config.backgroundOpacity ?? 100]}
                onValueChange={([value]) => onConfigChange({ 
                  ...config, 
                  backgroundOpacity: value,
                  // 如果没有背景颜色但设置了透明度，给一个默认颜色
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

        {/* 提示信息 */}
        <div className="text-xs text-gray-500 text-center">
          拖拽预览区域调整位置，使用滑块精确控制
        </div>
      </CardContent>
    </Card>
  );
}
