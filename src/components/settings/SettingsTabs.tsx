import React from 'react';
import { cn } from '@/lib/utils';
import { 
  Palette, 
  BookOpen, 
  Image, 
  Cloud,
  Settings as SettingsIcon
} from 'lucide-react';

export type SettingsTab = 'preferences' | 'bookmarks' | 'background' | 'sync';

interface SettingsTabsProps {
  activeTab: SettingsTab;
  onTabChange: (tab: SettingsTab) => void;
  className?: string;
}

interface TabItem {
  id: SettingsTab;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
}

const TABS: TabItem[] = [
  {
    id: 'preferences',
    label: '应用偏好',
    icon: Palette,
    description: '搜索引擎、时间格式、界面偏好',
  },
  {
    id: 'bookmarks',
    label: '书签管理',
    icon: BookOpen,
    description: '书签显示、分类管理、排序设置',
  },
  {
    id: 'background',
    label: '背景图片',
    icon: Image,
    description: '背景类型、Unsplash设置、刷新频率',
  },
  {
    id: 'sync',
    label: '同步备份',
    icon: Cloud,
    description: 'WebDAV配置、自动同步、数据管理',
  },
];

/**
 * 设置标签页导航组件
 * 提供现代化的标签页切换界面
 */
export function SettingsTabs({ activeTab, onTabChange, className }: SettingsTabsProps) {
  return (
    <div className={cn('border-b border-gray-200', className)}>
      <nav className="flex space-x-8" aria-label="Settings navigation">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={cn(
                'group flex items-center py-4 px-1 border-b-2 font-medium text-sm transition-colors',
                'focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2',
                isActive
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              )}
              title={tab.description}
            >
              <Icon className={cn(
                'mr-2 h-4 w-4 transition-colors',
                isActive ? 'text-indigo-500' : 'text-gray-400 group-hover:text-gray-500'
              )} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
