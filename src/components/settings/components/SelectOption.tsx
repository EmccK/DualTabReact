import React from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

interface SelectOption {
  value: string;
  label: string;
  description?: string;
}

interface SelectOptionProps {
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  options: SelectOption[];
  disabled?: boolean;
  className?: string;
}

/**
 * 设置选择器组件
 * 基于Shadcn/UI Select组件的封装
 */
export function SelectOption({ 
  value, 
  onValueChange, 
  placeholder = '请选择',
  options,
  disabled = false,
  className
}: SelectOptionProps) {
  return (
    <Select
      value={value}
      onValueChange={onValueChange}
      disabled={disabled}
    >
      <SelectTrigger className={cn("text-sm", className)}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {options.map((option) => (
          <SelectItem 
            key={option.value} 
            value={option.value}
            className="text-sm"
          >
            <span className="whitespace-nowrap">{option.label}</span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
