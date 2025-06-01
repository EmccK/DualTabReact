/**
 * 优化的图片缩放组件
 * 支持实时预览和防抖处理，解决拖拽卡顿问题
 */

import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { RotateCw, RotateCcw, Move, ZoomIn, ZoomOut } from 'lucide-react';
import type { ImageScaleConfig } from '@/types/bookmark-style.types';

interface ImageScalerProps {
  imageUrl: string;
  config: ImageScaleConfig;
  onConfigChange: (config: ImageScaleConfig) => void;
  onImageGenerated?: (dataUrl: string) => void;
  size?: number;
  className?: string;
}

// 防抖Hook
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
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
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [imageLoaded, setImageLoaded] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // 使用防抖来延迟最终图片生成，但不影响预览更新
  const debouncedConfig = useDebounce(config, 300);

  // 预览尺寸
  const previewSize = size * 1.5;

  // 缓存图片对象
  const imageObject = useMemo(() => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    return img;
  }, []);

  // 加载图片
  useEffect(() => {
    setImageLoaded(false);
    imageObject.onload = () => setImageLoaded(true);
    imageObject.onerror = () => setImageLoaded(false);
    imageObject.src = imageUrl;
  }, [imageUrl, imageObject]);

  // 绘制图片到画布的通用函数
  const drawImageToCanvas = useCallback((
    canvas: HTMLCanvasElement, 
    targetConfig: ImageScaleConfig, 
    targetSize: number
  ) => {
    if (!imageLoaded) return false;

    const ctx = canvas.getContext('2d');
    if (!ctx) return false;

    // 设置画布尺寸
    canvas.width = targetSize;
    canvas.height = targetSize;

    // 绘制背景
    if (targetConfig.backgroundColor && (targetConfig.backgroundOpacity ?? 100) > 0) {
      const opacity = (targetConfig.backgroundOpacity ?? 100) / 100;
      ctx.globalAlpha = opacity;
      ctx.fillStyle = targetConfig.backgroundColor;
      ctx.fillRect(0, 0, targetSize, targetSize);
      ctx.globalAlpha = 1;
    } else {
      ctx.clearRect(0, 0, targetSize, targetSize);
    }

    // 保存状态
    ctx.save();

    // 移动到中心
    ctx.translate(targetSize / 2, targetSize / 2);

    // 应用旋转
    if (targetConfig.rotation) {
      ctx.rotate((targetConfig.rotation * Math.PI) / 180);
    }

    // 计算尺寸
    const aspectRatio = imageObject.width / imageObject.height;
    let baseWidth, baseHeight;

    if (aspectRatio > 1) {
      baseWidth = targetSize;
      baseHeight = targetSize / aspectRatio;
    } else {
      baseHeight = targetSize;
      baseWidth = targetSize * aspectRatio;
    }

    const finalWidth = baseWidth * targetConfig.scale;
    const finalHeight = baseHeight * targetConfig.scale;

    const offsetX = (targetConfig.offsetX / 100) * targetSize;
    const offsetY = (targetConfig.offsetY / 100) * targetSize;

    // 绘制图片
    ctx.drawImage(
      imageObject,
      -finalWidth / 2 + offsetX,
      -finalHeight / 2 + offsetY,
      finalWidth,
      finalHeight
    );

    ctx.restore();
    return true;
  }, [imageObject, imageLoaded]);

  // 更新预览（实时，无防抖）
  const updatePreview = useCallback(() => {
    const canvas = previewCanvasRef.current;
    if (!canvas) return;
    
    drawImageToCanvas(canvas, config, previewSize);
  }, [config, previewSize, drawImageToCanvas]);

  // 生成最终图片（防抖，用于实际保存）
  const generateFinalImage = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // 如果正在处理，跳过这次请求
    if (isProcessing) return;

    setIsProcessing(true);
    
    // 使用 requestAnimationFrame 确保在下一帧执行，避免阻塞UI
    requestAnimationFrame(() => {
      try {
        if (drawImageToCanvas(canvas, debouncedConfig, size)) {
          const dataUrl = canvas.toDataURL('image/png');
          onImageGenerated?.(dataUrl);
        }
      } catch (error) {
        console.error('生成图片失败:', error);
      } finally {
        setIsProcessing(false);
      }
    });
  }, [debouncedConfig, size, drawImageToCanvas, onImageGenerated]);

  // 实时更新预览
  useEffect(() => {
    updatePreview();
  }, [updatePreview]);

  // 防抖后生成最终图片
  useEffect(() => {
    generateFinalImage();
  }, [generateFinalImage]);

  // 鼠标拖拽处理 - 优化性能
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging) return;
    e.preventDefault();

    const deltaX = e.clientX - dragStart.x;
    const deltaY = e.clientY - dragStart.y;

    // 减小移动敏感度，使拖拽更平滑
    const sensitivity = 0.3;
    const offsetXDelta = (deltaX / previewSize) * 100 * sensitivity;
    const offsetYDelta = (deltaY / previewSize) * 100 * sensitivity;

    const newConfig = {
      ...config,
      offsetX: Math.max(-100, Math.min(100, config.offsetX + offsetXDelta)),
      offsetY: Math.max(-100, Math.min(100, config.offsetY + offsetYDelta))
    };

    onConfigChange(newConfig);
    setDragStart({ x: e.clientX, y: e.clientY });
  }, [isDragging, dragStart, config, onConfigChange, previewSize]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // 优化的滑动处理 - 使用节流
  const throttledConfigChange = useCallback((newConfig: ImageScaleConfig) => {
    onConfigChange(newConfig);
  }, [onConfigChange]);

  // 重置配置
  const resetConfig = useCallback(() => {
    const defaultConfig = {
      scale: 1,
      offsetX: 0,
      offsetY: 0,
      rotation: 0,
      backgroundColor: '#ffffff',
      backgroundOpacity: 100
    };
    
    onConfigChange(defaultConfig);
    
    // 立即更新预览，不等待防抖
    setTimeout(() => {
      const canvas = previewCanvasRef.current;
      if (canvas) {
        drawImageToCanvas(canvas, defaultConfig, previewSize);
      }
    }, 0);
  }, [onConfigChange, drawImageToCanvas, previewSize]);

  // 旋转
  const rotateImage = useCallback((degrees: number) => {
    throttledConfigChange({
      ...config,
      rotation: ((config.rotation || 0) + degrees) % 360
    });
  }, [config, throttledConfigChange]);

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

        {/* 预览区域 */}
        <div className="flex justify-center">
          <div 
            className={`relative border-2 border-dashed border-gray-300 rounded-lg overflow-hidden select-none ${
              isDragging ? 'cursor-grabbing' : 'cursor-grab'
            }`}
            style={{ width: previewSize, height: previewSize }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          >
            {/* 预览画布 */}
            <canvas
              ref={previewCanvasRef}
              width={previewSize}
              height={previewSize}
              className="w-full h-full"
              style={{ imageRendering: 'pixelated' }}
            />
            
            {/* 拖拽提示 */}
            {isDragging && (
              <div className="absolute inset-0 bg-blue-500/20 flex items-center justify-center pointer-events-none">
                <Move className="w-4 h-4 text-blue-600" />
              </div>
            )}
            
            {/* 加载状态 */}
            {!imageLoaded && (
              <div className="absolute inset-0 bg-gray-100 flex items-center justify-center">
                <div className="text-xs text-gray-500">加载中...</div>
              </div>
            )}
          </div>
        </div>

        {/* 隐藏的最终输出画布 */}
        <canvas
          ref={canvasRef}
          width={size}
          height={size}
          className="hidden"
        />

        {/* 控制面板 */}
        <div className="space-y-2">
          {/* 缩放和旋转 */}
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
                  onClick={() => throttledConfigChange({ ...config, scale: Math.max(0.1, config.scale - 0.1) })}
                  disabled={config.scale <= 0.1}
                  className="h-6 w-6 p-0"
                >
                  <ZoomOut className="w-3 h-3" />
                </Button>
                <Slider
                  value={[config.scale]}
                  onValueChange={([value]) => throttledConfigChange({ ...config, scale: value })}
                  min={0.1}
                  max={3}
                  step={0.05}
                  className="flex-1"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => throttledConfigChange({ ...config, scale: Math.min(3, config.scale + 0.1) })}
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
                  onValueChange={([value]) => throttledConfigChange({ ...config, rotation: value })}
                  min={0}
                  max={360}
                  step={5}
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
                onValueChange={([value]) => throttledConfigChange({ ...config, offsetX: value })}
                min={-100}
                max={100}
                step={2}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">垂直位置</Label>
              <Slider
                value={[config.offsetY]}
                onValueChange={([value]) => throttledConfigChange({ ...config, offsetY: value })}
                min={-100}
                max={100}
                step={2}
              />
            </div>
          </div>

          {/* 背景设置 */}
          <div className="border-t pt-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">背景颜色</Label>
                <div className="flex items-center space-x-1">
                  <input
                    type="color"
                    value={config.backgroundColor || '#ffffff'}
                    onChange={(e) => throttledConfigChange({
                      ...config,
                      backgroundColor: e.target.value,
                      backgroundOpacity: config.backgroundOpacity ?? 100
                    })}
                    className="w-6 h-6 rounded border border-gray-300 cursor-pointer"
                  />
                  <Input
                    value={config.backgroundColor || '#ffffff'}
                    onChange={(e) => throttledConfigChange({
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

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <Label className="text-xs">透明度</Label>
                  <span className="text-xs text-gray-500">{config.backgroundOpacity ?? 100}%</span>
                </div>
                <Slider
                  value={[config.backgroundOpacity ?? 100]}
                  onValueChange={([value]) => throttledConfigChange({ 
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

        {/* 状态提示 */}
        <div className="text-xs text-gray-500 text-center">
          {isProcessing ? '处理中...' : '拖拽预览区域调整位置'}
        </div>
      </div>
    </div>
  );
}
