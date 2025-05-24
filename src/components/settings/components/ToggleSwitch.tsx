import React from 'react';
import { Switch } from '@/components/ui/switch';

interface ToggleSwitchProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
  size?: 'sm' | 'default';
}

/**
 * 设置开关组件
 * 基于Shadcn/UI Switch组件的封装
 */
export function ToggleSwitch({ 
  checked, 
  onCheckedChange, 
  disabled = false,
  size = 'default'
}: ToggleSwitchProps) {
  return (
    <Switch
      checked={checked}
      onCheckedChange={onCheckedChange}
      disabled={disabled}
      className={size === 'sm' ? 'scale-90' : ''}
    />
  );
}
