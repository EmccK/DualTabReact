import React from 'react';
import { SettingItem } from '../components/SettingItem';
import { ToggleSwitch } from '../components/ToggleSwitch';
import { SelectOption } from '../components/SelectOption';
import type { AppPreferences } from '@/types/settings';

interface AppPreferencesProps {
  preferences: AppPreferences;
  onUpdate: (updates: Partial<AppPreferences>) => void;
}

/**
 * 应用偏好设置分组
 * 包含搜索引擎、时间格式、界面偏好等设置
 */
export function AppPreferences({ preferences, onUpdate }: AppPreferencesProps) {
  const searchEngineOptions = [
    { 
      value: 'google', 
      label: 'Google'
    },
    { 
      value: 'baidu', 
      label: '百度'
    },
    { 
      value: 'bing', 
      label: 'Bing'
    },
  ];

  const timeFormatOptions = [
    { 
      value: '24h', 
      label: '24小时制'
    },
    { 
      value: '12h', 
      label: '12小时制'
    },
  ];

  const dateFormatOptions = [
    { 
      value: 'zh-CN', 
      label: '中文格式'
    },
    { 
      value: 'en-US', 
      label: '英文格式'
    },
  ];

  return (
    <div className="space-y-6">
      {/* 搜索设置 */}
      <section>
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <span className="w-2 h-2 bg-indigo-500 rounded-full mr-3"></span>
          搜索设置
        </h3>
        <div className="space-y-0 border border-gray-200 rounded-lg bg-white">
          <SettingItem
            title="默认搜索引擎"
            description="选择新标签页搜索框使用的默认搜索引擎"
          >
            <SelectOption
              value={preferences.searchEngine}
              onValueChange={(value) => onUpdate({ searchEngine: value as AppPreferences['searchEngine'] })}
              options={searchEngineOptions}
              className="w-24"
            />
          </SettingItem>
          
          <SettingItem
            title="自动聚焦搜索框"
            description="打开新标签页时自动聚焦到搜索框"
          >
            <ToggleSwitch
              checked={preferences.autoFocusSearch}
              onCheckedChange={(checked) => onUpdate({ autoFocusSearch: checked })}
            />
          </SettingItem>
          
          <SettingItem
            title="新标签页打开搜索结果"
            description="搜索结果在新标签页中打开"
          >
            <ToggleSwitch
              checked={preferences.openInNewTab}
              onCheckedChange={(checked) => onUpdate({ openInNewTab: checked })}
            />
          </SettingItem>
        </div>
      </section>

      {/* 时间显示设置 */}
      <section>
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <span className="w-2 h-2 bg-green-500 rounded-full mr-3"></span>
          时间显示
        </h3>
        <div className="space-y-0 border border-gray-200 rounded-lg bg-white">
          <SettingItem
            title="时间格式"
            description="选择时间显示的格式"
          >
            <SelectOption
              value={preferences.timeFormat}
              onValueChange={(value) => onUpdate({ timeFormat: value as AppPreferences['timeFormat'] })}
              options={timeFormatOptions}
              className="w-28"
            />
          </SettingItem>
          
          <SettingItem
            title="日期格式"
            description="选择日期显示的格式"
          >
            <SelectOption
              value={preferences.dateFormat}
              onValueChange={(value) => onUpdate({ dateFormat: value as AppPreferences['dateFormat'] })}
              options={dateFormatOptions}
              className="w-28"
            />
          </SettingItem>
          
          <SettingItem
            title="显示秒数"
            description="在时间显示中包含秒数"
          >
            <ToggleSwitch
              checked={preferences.showSeconds}
              onCheckedChange={(checked) => onUpdate({ showSeconds: checked })}
            />
          </SettingItem>
        </div>
      </section>
    </div>
  );
}
