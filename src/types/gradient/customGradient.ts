/**
 * 自定义渐变编辑器类型定义
 */

export interface ColorStop {
  id: string;
  color: string;
  position: number; // 0-100 百分比位置
}

export interface CustomGradient {
  id: string;
  name: string;
  type: 'linear' | 'radial';
  direction: number; // 线性渐变角度 0-360度
  radialShape?: 'circle' | 'ellipse'; // 径向渐变形状
  radialPosition?: 'center' | 'top' | 'bottom' | 'left' | 'right';
  colorStops: ColorStop[];
  createdAt: number;
  updatedAt: number;
}

export interface GradientEditorState {
  gradient: CustomGradient;
  selectedStopId: string | null;
  isDragging: boolean;
  previewMode: boolean;
}

export interface GradientPreset {
  id: string;
  name: string;
  gradient: CustomGradient;
  category: string;
  tags: string[];
}
