/**
 * 自定义渐变工具函数
 */

import type { CustomGradient, ColorStop } from '@/types/gradient';

/**
 * 生成唯一ID
 */
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * 创建新的颜色节点
 */
export function createColorStop(color: string, position: number): ColorStop {
  return {
    id: generateId(),
    color,
    position: Math.max(0, Math.min(100, position))
  };
}

/**
 * 创建默认自定义渐变
 */
export function createDefaultCustomGradient(): CustomGradient {
  const now = Date.now();
  return {
    id: generateId(),
    name: '自定义渐变',
    type: 'linear',
    direction: 45,
    radialShape: 'circle',
    radialPosition: 'center',
    colorStops: [
      createColorStop('#3B82F6', 0),
      createColorStop('#8B5CF6', 100)
    ],
    createdAt: now,
    updatedAt: now
  };
}

/**
 * 生成渐变CSS
 */
export function generateCustomGradientCSS(gradient: CustomGradient): string {
  const sortedStops = [...gradient.colorStops].sort((a, b) => a.position - b.position);
  const colorStops = sortedStops.map(stop => `${stop.color} ${stop.position}%`).join(', ');

  if (gradient.type === 'linear') {
    return `linear-gradient(${gradient.direction}deg, ${colorStops})`;
  } else {
    const shape = gradient.radialShape || 'circle';
    const position = gradient.radialPosition || 'center';
    return `radial-gradient(${shape} at ${position}, ${colorStops})`;
  }
}

/**
 * 颜色格式转换工具
 */
export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
}

export function rgbToHex(r: number, g: number, b: number): string {
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

/**
 * 颜色亮度计算
 */
export function getColorLuminance(hex: string): number {
  const rgb = hexToRgb(hex);
  if (!rgb) return 0;

  const { r, g, b } = rgb;
  const [rs, gs, bs] = [r, g, b].map(c => {
    c = c / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });

  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

/**
 * 判断颜色是否为亮色
 */
export function isLightColor(hex: string): boolean {
  return getColorLuminance(hex) > 0.5;
}

/**
 * 生成随机颜色
 */
export function generateRandomColor(): string {
  const hue = Math.floor(Math.random() * 360);
  const saturation = Math.floor(Math.random() * 40) + 60; // 60-100%
  const lightness = Math.floor(Math.random() * 30) + 40; // 40-70%
  
  return hslToHex(hue, saturation, lightness);
}

/**
 * HSL转Hex
 */
export function hslToHex(h: number, s: number, l: number): string {
  l /= 100;
  const a = s * Math.min(l, 1 - l) / 100;
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color).toString(16).padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

/**
 * 排序颜色节点
 */
export function sortColorStops(stops: ColorStop[]): ColorStop[] {
  return [...stops].sort((a, b) => a.position - b.position);
}

/**
 * 验证渐变有效性
 */
export function validateCustomGradient(gradient: CustomGradient): string[] {
  const errors: string[] = [];

  if (!gradient.name.trim()) {
    errors.push('渐变名称不能为空');
  }

  if (gradient.colorStops.length < 2) {
    errors.push('至少需要两个颜色节点');
  }

  if (gradient.direction < 0 || gradient.direction > 360) {
    errors.push('渐变角度必须在0-360度之间');
  }

  const positions = gradient.colorStops.map(stop => stop.position);
  const uniquePositions = new Set(positions);
  if (positions.length !== uniquePositions.size) {
    errors.push('颜色节点位置不能重复');
  }

  return errors;
}

/**
 * 预设渐变模板
 */
export const CUSTOM_GRADIENT_TEMPLATES: Partial<CustomGradient>[] = [
  {
    name: '日出',
    type: 'linear',
    direction: 45,
    colorStops: [
      { id: '1', color: '#FF9A9E', position: 0 },
      { id: '2', color: '#FECFEF', position: 50 },
      { id: '3', color: '#FECFEF', position: 100 }
    ]
  },
  {
    name: '海洋',
    type: 'linear',
    direction: 135,
    colorStops: [
      { id: '1', color: '#667eea', position: 0 },
      { id: '2', color: '#764ba2', position: 100 }
    ]
  },
  {
    name: '彩虹',
    type: 'linear',
    direction: 90,
    colorStops: [
      { id: '1', color: '#FF0000', position: 0 },
      { id: '2', color: '#FF7F00', position: 16.66 },
      { id: '3', color: '#FFFF00', position: 33.33 },
      { id: '4', color: '#00FF00', position: 50 },
      { id: '5', color: '#0000FF', position: 66.66 },
      { id: '6', color: '#4B0082', position: 83.33 },
      { id: '7', color: '#9400D3', position: 100 }
    ]
  }
];
