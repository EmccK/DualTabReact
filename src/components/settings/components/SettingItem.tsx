import React from 'react';
import { cn } from '@/lib/utils';

interface SettingItemProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
}

/**
 * 设置项基础组件
 * 提供统一的设置项布局和样式
 */
export function SettingItem({ 
  title, 
  description, 
  children, 
  className,
  disabled = false
}: SettingItemProps) {
  return (
    <div className={cn(
      'flex items-center justify-between py-4 px-1',
      'border-b border-gray-100 last:border-b-0',
      disabled && 'opacity-50 pointer-events-none',
      className
    )}>
      <div className="flex-1 min-w-0 mr-4">
        <h3 className="text-sm font-medium text-gray-900 mb-1">
          {title}
        </h3>
        {description && (
          <p className="text-xs text-gray-500 leading-relaxed">
            {description}
          </p>
        )}
      </div>
      <div className="flex-shrink-0">
        {children}
      </div>
    </div>
  );
}
