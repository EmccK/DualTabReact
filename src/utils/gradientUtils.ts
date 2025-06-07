/**
 * 渐变工具函数
 * 用于处理CSS渐变生成、渐变预设管理等功能
 */

import type { BackgroundSettings } from '@/types/settings';

export interface GradientPreset {
  id: string;
  name: string;
  category: string;
  gradient: BackgroundSettings['gradient'];
}

/**
 * 根据渐变设置生成CSS渐变字符串
 */
export function generateGradientCSS(gradient: BackgroundSettings['gradient']): string {
  try {
    if (!gradient || !gradient.colors || gradient.colors.length === 0) {
      return 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
    }

    const { type, direction = 135, colors, centerX = 50, centerY = 50, shape = 'ellipse', size = 'farthest-corner' } = gradient;
    
    // 确保至少有两个颜色
    let validColors = colors.filter(color => color && color.color);
    if (validColors.length === 0) {
      return 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
    }
    if (validColors.length === 1) {
      validColors = [validColors[0], validColors[0]];
    }
    
    // 生成颜色停止点字符串
    const colorStops = validColors
      .sort((a, b) => a.position - b.position)
      .map(stop => `${stop.color} ${Math.max(0, Math.min(100, stop.position))}%`)
      .join(', ');
    
    switch (type) {
      case 'linear':
        return `linear-gradient(${direction}deg, ${colorStops})`;
      
      case 'radial':
        return `radial-gradient(${shape} ${size} at ${centerX}% ${centerY}%, ${colorStops})`;
      
      case 'conic':
        return `conic-gradient(from ${direction}deg at ${centerX}% ${centerY}%, ${colorStops})`;
      
      default:
        return `linear-gradient(135deg, ${colorStops})`;
    }
  } catch (error) {
    return 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
  }
}

/**
 * 预设渐变色集合
 */
export const GRADIENT_PRESETS: GradientPreset[] = [
  // 经典渐变
  {
    id: 'classic-sky',
    name: '天空蓝',
    category: 'classic',
    gradient: {
      type: 'linear',
      direction: 135,
      colors: [
        { color: '#667eea', position: 0 },
        { color: '#764ba2', position: 100 }
      ]
    }
  },
  {
    id: 'classic-sunset',
    name: '晚霞橙',
    category: 'classic',
    gradient: {
      type: 'linear',
      direction: 135,
      colors: [
        { color: '#f093fb', position: 0 },
        { color: '#f5576c', position: 100 }
      ]
    }
  },
  {
    id: 'classic-mint',
    name: '薄荷绿',
    category: 'classic',
    gradient: {
      type: 'linear',
      direction: 135,
      colors: [
        { color: '#4facfe', position: 0 },
        { color: '#00f2fe', position: 100 }
      ]
    }
  },
  {
    id: 'classic-purple',
    name: '紫色梦境',
    category: 'classic',
    gradient: {
      type: 'linear',
      direction: 135,
      colors: [
        { color: '#a8edea', position: 0 },
        { color: '#fed6e3', position: 100 }
      ]
    }
  },
  
  // 日落系列
  {
    id: 'sunset-warm',
    name: '日落时分',
    category: 'sunset',
    gradient: {
      type: 'linear',
      direction: 135,
      colors: [
        { color: '#fa709a', position: 0 },
        { color: '#fee140', position: 100 }
      ]
    }
  },
  {
    id: 'sunset-peach',
    name: '桃色黄昏',
    category: 'sunset',
    gradient: {
      type: 'linear',
      direction: 135,
      colors: [
        { color: '#ffecd2', position: 0 },
        { color: '#fcb69f', position: 100 }
      ]
    }
  },
  {
    id: 'sunset-fire',
    name: '火焰夕阳',
    category: 'sunset',
    gradient: {
      type: 'linear',
      direction: 135,
      colors: [
        { color: '#ff9a9e', position: 0 },
        { color: '#fecfef', position: 50 },
        { color: '#fecfef', position: 100 }
      ]
    }
  },
  
  // 海洋天空系列
  {
    id: 'ocean-deep',
    name: '深海蓝',
    category: 'ocean',
    gradient: {
      type: 'linear',
      direction: 135,
      colors: [
        { color: '#667db6', position: 0 },
        { color: '#0082c8', position: 50 },
        { color: '#0082c8', position: 100 }
      ]
    }
  },
  {
    id: 'ocean-wave',
    name: '海浪青',
    category: 'ocean',
    gradient: {
      type: 'linear',
      direction: 135,
      colors: [
        { color: '#89f7fe', position: 0 },
        { color: '#66a6ff', position: 100 }
      ]
    }
  },
  {
    id: 'sky-fresh',
    name: '清新天空',
    category: 'ocean',
    gradient: {
      type: 'linear',
      direction: 135,
      colors: [
        { color: '#a1c4fd', position: 0 },
        { color: '#c2e9fb', position: 100 }
      ]
    }
  },
  
  // 彩虹梦幻系列
  {
    id: 'rainbow-soft',
    name: '柔和彩虹',
    category: 'rainbow',
    gradient: {
      type: 'linear',
      direction: 90,
      colors: [
        { color: '#ff9a9e', position: 0 },
        { color: '#fad0c4', position: 25 },
        { color: '#a8edea', position: 50 },
        { color: '#fed6e3', position: 75 },
        { color: '#d299c2', position: 100 }
      ]
    }
  },
  {
    id: 'rainbow-bright',
    name: '明亮彩虹',
    category: 'rainbow',
    gradient: {
      type: 'linear',
      direction: 45,
      colors: [
        { color: '#ff6b6b', position: 0 },
        { color: '#feca57', position: 25 },
        { color: '#48dbfb', position: 50 },
        { color: '#ff9ff3', position: 75 },
        { color: '#54a0ff', position: 100 }
      ]
    }
  },
  
  // 深色主题系列
  {
    id: 'dark-elegant',
    name: '优雅深色',
    category: 'dark',
    gradient: {
      type: 'linear',
      direction: 135,
      colors: [
        { color: '#2c3e50', position: 0 },
        { color: '#4a6741', position: 100 }
      ]
    }
  },
  {
    id: 'dark-purple',
    name: '深紫夜空',
    category: 'dark',
    gradient: {
      type: 'linear',
      direction: 135,
      colors: [
        { color: '#1a1a2e', position: 0 },
        { color: '#16213e', position: 50 },
        { color: '#0f3460', position: 100 }
      ]
    }
  },
  {
    id: 'dark-red',
    name: '暗红渐变',
    category: 'dark',
    gradient: {
      type: 'linear',
      direction: 135,
      colors: [
        { color: '#434343', position: 0 },
        { color: '#000000', position: 100 }
      ]
    }
  },
  
  // 纯色模拟（单色渐变）
  {
    id: 'solid-blue',
    name: '纯蓝色',
    category: 'solid',
    gradient: {
      type: 'linear',
      direction: 0,
      colors: [
        { color: '#4F46E5', position: 0 },
        { color: '#4F46E5', position: 100 }
      ]
    }
  },
  {
    id: 'solid-green',
    name: '纯绿色',
    category: 'solid',
    gradient: {
      type: 'linear',
      direction: 0,
      colors: [
        { color: '#10B981', position: 0 },
        { color: '#10B981', position: 100 }
      ]
    }
  },
  {
    id: 'solid-purple',
    name: '纯紫色',
    category: 'solid',
    gradient: {
      type: 'linear',
      direction: 0,
      colors: [
        { color: '#8B5CF6', position: 0 },
        { color: '#8B5CF6', position: 100 }
      ]
    }
  },
  {
    id: 'solid-red',
    name: '纯红色',
    category: 'solid',
    gradient: {
      type: 'linear',
      direction: 0,
      colors: [
        { color: '#EF4444', position: 0 },
        { color: '#EF4444', position: 100 }
      ]
    }
  },
  {
    id: 'solid-yellow',
    name: '纯黄色',
    category: 'solid',
    gradient: {
      type: 'linear',
      direction: 0,
      colors: [
        { color: '#F59E0B', position: 0 },
        { color: '#F59E0B', position: 100 }
      ]
    }
  }
];

/**
 * 渐变预设分类
 */
export const GRADIENT_CATEGORIES = [
  { id: 'classic', name: '经典渐变', icon: '🌈' },
  { id: 'sunset', name: '日落系列', icon: '🌅' },
  { id: 'ocean', name: '海洋天空', icon: '🌊' },
  { id: 'rainbow', name: '彩虹梦幻', icon: '✨' },
  { id: 'dark', name: '深色主题', icon: '🌙' },
  { id: 'solid', name: '纯色模拟', icon: '⬛' }
];

/**
 * 根据分类获取渐变预设
 */
export function getGradientsByCategory(category: string): GradientPreset[] {
  return GRADIENT_PRESETS.filter(preset => preset.category === category);
}

/**
 * 根据ID获取渐变预设
 */
export function getGradientById(id: string): GradientPreset | undefined {
  return GRADIENT_PRESETS.find(preset => preset.id === id);
}

/**
 * 创建纯色渐变（用于从纯色转换为渐变）
 */
export function createSolidGradient(color: string): BackgroundSettings['gradient'] {
  return {
    type: 'linear',
    direction: 0,
    colors: [
      { color, position: 0 },
      { color, position: 100 }
    ]
  };
}

/**
 * 检查渐变是否为纯色（所有颜色停止点颜色相同）
 */
export function isSolidGradient(gradient: BackgroundSettings['gradient']): boolean {
  if (gradient.colors.length === 0) return false;
  const firstColor = gradient.colors[0].color;
  return gradient.colors.every(stop => stop.color === firstColor);
}

/**
 * 从渐变中提取主色调（第一个颜色停止点的颜色）
 */
export function extractMainColor(gradient: BackgroundSettings['gradient']): string {
  return gradient.colors.length > 0 ? gradient.colors[0].color : '#4F46E5';
}

/**
 * 验证渐变配置是否有效
 */
export function validateGradient(gradient: BackgroundSettings['gradient']): boolean {
  if (!gradient || !gradient.colors || gradient.colors.length < 2) {
    return false;
  }
  
  // 检查颜色停止点是否有效
  for (const stop of gradient.colors) {
    if (!stop.color || stop.position < 0 || stop.position > 100) {
      return false;
    }
  }
  
  // 检查渐变类型特定参数
  if (gradient.type === 'radial' || gradient.type === 'conic') {
    if (typeof gradient.centerX !== 'number' || typeof gradient.centerY !== 'number') {
      return false;
    }
  }
  
  return true;
}
