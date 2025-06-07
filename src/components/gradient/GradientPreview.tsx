/**
 * 自定义渐变编辑器 - 渐变预览组件
 */

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Copy, Download } from 'lucide-react';
import type { CustomGradient } from '@/types/gradient';
import { generateCustomGradientCSS } from '@/utils/gradient';

interface GradientPreviewProps {
  gradient: CustomGradient;
  className?: string;
  showActions?: boolean;
}

export function GradientPreview({ 
  gradient, 
  className = '',
  showActions = false
}: GradientPreviewProps) {
  const gradientCSS = generateCustomGradientCSS(gradient);

  const handleCopyCSS = async () => {
    try {
      await navigator.clipboard.writeText(`background: ${gradientCSS};`);
      // TODO: 添加成功提示
    } catch {
      // Ignore clipboard copy errors
    }
  };

  const handleDownloadSVG = () => {
    const svg = `
      <svg width="400" height="300" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            ${gradient.colorStops
              .sort((a, b) => a.position - b.position)
              .map(stop => 
                `<stop offset="${stop.position}%" stop-color="${stop.color}" />`
              ).join('')}
          </linearGradient>
        </defs>
        <rect width="100%" height="100%" fill="url(#gradient)" />
      </svg>
    `;
    
    const blob = new Blob([svg], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${gradient.name.replace(/\s+/g, '_')}_gradient.svg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <Card className={`overflow-hidden ${className}`}>
      <div 
        className="w-full h-32 relative"
        style={{ background: gradientCSS }}
      >
        {/* 网格背景用于透明度预览 */}
        <div 
          className="absolute inset-0 opacity-10"
          style={{
            backgroundColor: 'transparent',
            backgroundImage: `
              linear-gradient(45deg, #000 25%, transparent 25%), 
              linear-gradient(-45deg, #000 25%, transparent 25%), 
              linear-gradient(45deg, transparent 75%, #000 75%), 
              linear-gradient(-45deg, transparent 75%, #000 75%)
            `,
            backgroundSize: '10px 10px',
            backgroundPosition: '0 0, 0 5px, 5px -5px, -5px 0px'
          }}
        />
      </div>
      
      <CardContent className="p-3">
        <div className="space-y-2">
          {/* 渐变信息 */}
          <div>
            <h4 className="font-medium text-sm text-gray-800 truncate">
              {gradient.name}
            </h4>
            <p className="text-xs text-gray-500">
              {gradient.type === 'linear' ? '线性' : '径向'} • 
              {gradient.colorStops.length} 个颜色
            </p>
          </div>

          {/* CSS 代码预览 */}
          <div className="bg-gray-50 rounded p-2 text-xs font-mono">
            <div className="text-gray-600 truncate" title={gradientCSS}>
              {gradientCSS}
            </div>
          </div>

          {/* 操作按钮 */}
          {showActions && (
            <div className="flex gap-1 pt-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCopyCSS}
                className="flex-1 h-7 text-xs"
              >
                <Copy className="w-3 h-3 mr-1" />
                复制CSS
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDownloadSVG}
                className="flex-1 h-7 text-xs"
              >
                <Download className="w-3 h-3 mr-1" />
                下载SVG
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
