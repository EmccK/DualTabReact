import React from 'react';
import { BackgroundManager } from '@/components/background';
import type { BackgroundSettings as BackgroundSettingsType } from '@/types/settings';

interface BackgroundSettingsProps {
  settings: BackgroundSettingsType;
  onUpdate: (updates: Partial<BackgroundSettingsType>) => void;
}

/**
 * 背景设置分组
 * 提供完整的背景管理功能
 */
export function BackgroundSettings({ settings, onUpdate }: BackgroundSettingsProps) {
  return (
    <div className="space-y-6">
      {/* 背景管理器 */}
      <BackgroundManager showPreview={true} />
      
      {/* 使用说明 */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-medium text-blue-900 mb-2">使用说明</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• <strong>纯色背景</strong>：选择单一颜色作为页面背景</li>
          <li>• <strong>渐变背景</strong>：使用预设的精美渐变色彩（默认）</li>
          <li>• <strong>本地图片</strong>：上传和管理自定义背景图片</li>
          <li>• <strong>Unsplash</strong>：使用高质量的网络图片（即将推出）</li>
          <li>• <strong>显示效果</strong>：调节透明度、模糊、亮度等视觉效果</li>
          <li>• <strong>叠加层</strong>：添加半透明颜色叠加层，改善文字可读性</li>
        </ul>
      </div>
    </div>
  );
}
