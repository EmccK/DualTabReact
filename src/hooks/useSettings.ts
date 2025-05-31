import { useState, useEffect, useCallback, useRef } from 'react';
import type { AppSettings, SettingsContextType } from '@/types/settings';
import { DEFAULT_SETTINGS } from '@/types/settings';
import { chromeStorageGet, chromeStorageSet } from '@/utils/storage';

const SETTINGS_KEY = 'app_settings';

/**
 * 设置管理Hook
 * 提供完整的设置状态管理和持久化功能
 */
export function useSettings(): SettingsContextType {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);
  const [isDirty, setIsDirty] = useState(false);

  // 加载设置
  const loadSettings = useCallback(async () => {
    try {
      setIsLoading(true);
      const result = await chromeStorageGet<AppSettings>(SETTINGS_KEY);
      
      if (result.success && result.data?.[SETTINGS_KEY]) {
        const rawSettings = result.data[SETTINGS_KEY];
        
        // 直接合并默认设置，无需迁移
        const mergedSettings = mergeWithDefaults(rawSettings, DEFAULT_SETTINGS);
        setSettings(mergedSettings);
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
      setSettings(DEFAULT_SETTINGS);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 保存设置
  const saveSettings = useCallback(async (newSettings: AppSettings) => {
    try {
      const result = await chromeStorageSet({ [SETTINGS_KEY]: newSettings });
      if (result.success) {
        setIsDirty(false);
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Failed to save settings:', error);
      throw error;
    }
  }, []);

  // 更新设置
  const updateSettings = useCallback(async <T extends keyof AppSettings>(
    section: T,
    updates: Partial<AppSettings[T]>
  ) => {
    const newSettings = {
      ...settings,
      [section]: {
        ...settings[section],
        ...updates,
      },
    };

    setSettings(newSettings);
    setIsDirty(true);

    // 对于某些重要设置，立即保存
    const immediateUpdate = ['preferences', 'sync'];
    if (immediateUpdate.includes(section)) {
      await saveSettings(newSettings);
    } else {
      // 其他设置使用防抖保存
      debouncedSave(newSettings);
    }
  }, [settings, saveSettings]);

  // 重置设置
  const resetSettings = useCallback(async (section?: keyof AppSettings) => {
    let newSettings: AppSettings;
    
    if (section) {
      // 重置特定分组
      newSettings = {
        ...settings,
        [section]: DEFAULT_SETTINGS[section],
      };
    } else {
      // 重置所有设置
      newSettings = { ...DEFAULT_SETTINGS };
    }

    setSettings(newSettings);
    await saveSettings(newSettings);
  }, [settings, saveSettings]);

  // 防抖保存 - 使用useRef来保存防抖函数
  const debouncedSaveRef = useRef<NodeJS.Timeout | null>(null);
  const debouncedSave = useCallback((settingsToSave: AppSettings) => {
    if (debouncedSaveRef.current) {
      clearTimeout(debouncedSaveRef.current);
    }
    debouncedSaveRef.current = setTimeout(() => {
      saveSettings(settingsToSave);
    }, 1000);
  }, [saveSettings]);

  // 组件挂载时加载设置
  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  // 监听存储变化，实现跨标签页同步
  useEffect(() => {
    const handleStorageChange = (changes: { [key: string]: chrome.storage.StorageChange }) => {
      if (changes[SETTINGS_KEY]) {
        const newValue = changes[SETTINGS_KEY].newValue;
        if (newValue) {
          setSettings(mergeWithDefaults(newValue, DEFAULT_SETTINGS));
          setIsDirty(false);
        }
      }
    };

    if (typeof chrome !== 'undefined' && chrome.storage?.onChanged) {
      chrome.storage.onChanged.addListener(handleStorageChange);
      return () => {
        chrome.storage.onChanged.removeListener(handleStorageChange);
      };
    }
  }, []);

  return {
    settings,
    updateSettings,
    resetSettings,
    isLoading,
    isDirty,
  };
}

/**
 * 合并默认设置和保存的设置
 */
function mergeWithDefaults(saved: Partial<AppSettings>, defaults: AppSettings): AppSettings {
  const merged = { ...defaults };
  
  Object.keys(defaults).forEach((section) => {
    const sectionKey = section as keyof AppSettings;
    if (saved[sectionKey]) {
      merged[sectionKey] = {
        ...defaults[sectionKey],
        ...saved[sectionKey],
      } as any;
    }
  });
  
  return merged;
}
