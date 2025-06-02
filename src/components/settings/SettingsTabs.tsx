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
    description: '背景类型、渐变设置、随机图片',
  },
  {
    id: 'sync',
    label: '数据同步',
    icon: Cloud,
    description: 'WebDAV同步、备份恢复、冲突解决',
  },
];

/**
 * 设置标签页导航组件
 * 提供现代化的标签页切换界面
 */
export function SettingsTabs({ activeTab, onTabChange, className }: SettingsTabsProps) {
  const activeTabRef = React.useRef<HTMLButtonElement>(null);
  
  // 确保活动Tab获得焦点，而不是第一个Tab
  React.useEffect(() => {
    if (activeTabRef.current) {
      activeTabRef.current.focus();
    }
  }, [activeTab]);

  return (
    <div className={cn('bg-gray-50 p-1 rounded-xl border border-gray-200', className)}>
      <nav className="flex space-x-1" aria-label="Settings navigation">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          
          return (
            <button
              key={tab.id}
              ref={isActive ? activeTabRef : null}
              onClick={() => onTabChange(tab.id)}
              className={cn(
                'group relative flex flex-col items-center justify-center px-4 py-3 rounded-lg font-medium text-sm transition-all duration-200',
                'min-w-0 flex-1',
                // 分离焦点样式和激活样式
                isActive
                  ? 'bg-white text-indigo-700 shadow-sm border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:ring-offset-1'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-white/50 focus:outline-none focus:ring-2 focus:ring-gray-400/50 focus:ring-offset-1'
              )}
              title={tab.description}
            >
              <Icon className={cn(
                'h-5 w-5 transition-colors mb-1',
                isActive ? 'text-indigo-600' : 'text-gray-500 group-hover:text-gray-700'
              )} />
              <span className="text-xs leading-none">{tab.label}</span>
              
              {/* 活动指示器 */}
              {isActive && (
                <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-indigo-500/5 to-purple-500/5" />
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );
}
