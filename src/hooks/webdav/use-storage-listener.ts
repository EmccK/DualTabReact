/**
 * Chrome存储监听Hook
 * 监听存储变化并自动触发React组件重新渲染
 */

import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * 存储变化事件类型
 */
export interface StorageChangeEvent {
  key: string;
  oldValue: any;
  newValue: any;
  areaName: 'local' | 'sync' | 'managed';
}

/**
 * Hook选项
 */
export interface UseStorageListenerOptions {
  /** 要监听的存储键列表 */
  keys?: string[];
  /** 存储区域 */
  area?: 'local' | 'sync' | 'managed';
  /** 变化回调 */
  onChange?: (changes: StorageChangeEvent[]) => void;
  /** 是否启用调试日志 */
  debug?: boolean;
}

/**
 * 存储监听Hook
 * 监听Chrome存储变化，自动触发组件重新渲染
 */
export function useStorageListener(options: UseStorageListenerOptions = {}) {
  const {
    keys = [],
    area = 'local',
    onChange,
    debug = false,
  } = options;

  const [changedKeys, setChangedKeys] = useState<string[]>([]);
  const [lastChangeTime, setLastChangeTime] = useState<number>(0);
  const listenerRef = useRef<((changes: any, areaName: string) => void) | null>(null);

  /**
   * 处理存储变化
   */
  const handleStorageChange = useCallback((changes: any, areaName: string) => {
    if (areaName !== area) {
      return;
    }

    const changeEvents: StorageChangeEvent[] = [];
    const affectedKeys: string[] = [];

    for (const [key, change] of Object.entries(changes)) {
      // 如果指定了监听的键，只处理这些键
      if (keys.length > 0 && !keys.includes(key)) {
        continue;
      }

      const changeEvent: StorageChangeEvent = {
        key,
        oldValue: (change as any).oldValue,
        newValue: (change as any).newValue,
        areaName: areaName as any,
      };

      changeEvents.push(changeEvent);
      affectedKeys.push(key);
    }

    if (changeEvents.length > 0) {
      setChangedKeys(affectedKeys);
      setLastChangeTime(Date.now());

      if (onChange) {
        onChange(changeEvents);
      }
    }
  }, [area, keys, onChange, debug]);

  /**
   * 处理来自background script的存储变化消息
   */
  const handleRuntimeMessage = useCallback((message: any, _sender: any, _sendResponse: any) => {
    if (message.action === 'storage_changed' && message.data?.changes) {
      const changes = message.data.changes;
      const affectedKeys = keys.length === 0 ? changes : keys.filter(key => changes.includes(key));

      if (affectedKeys.length > 0) {
        setChangedKeys(affectedKeys);
        setLastChangeTime(Date.now());

        if (onChange && debug) {
        }
      }
    }
    return false; // 不需要异步响应
  }, [keys, onChange, debug]);

  /**
   * 设置监听器
   */
  useEffect(() => {
    listenerRef.current = handleStorageChange;
    chrome.storage.onChanged.addListener(handleStorageChange);

    // 同时监听来自background script的消息
    chrome.runtime.onMessage.addListener(handleRuntimeMessage);

    return () => {
      if (listenerRef.current) {
        chrome.storage.onChanged.removeListener(listenerRef.current);
      }
      chrome.runtime.onMessage.removeListener(handleRuntimeMessage);
      if (debug) {
      }
    };
  }, [handleStorageChange, handleRuntimeMessage, keys, area, debug]);

  return {
    changedKeys,
    lastChangeTime,
  };
}

/**
 * 专门监听WebDAV相关存储变化的Hook
 */
export function useWebDAVStorageListener(
  onChange?: (changes: StorageChangeEvent[]) => void
) {
  return useStorageListener({
    keys: [
      'webdav_config',
      'sync_metadata',
      'sync_status',
      'last_sync_time',
      'conflict_data',
      'bookmark_categories',
      'bookmarks',
      'app_settings',
    ],
    area: 'local',
    onChange,
    debug: process.env.NODE_ENV === 'development',
  });
}

/**
 * 监听特定存储键的Hook
 */
export function useStorageKey<T = any>(
  key: string,
  defaultValue: T,
  area: 'local' | 'sync' = 'local'
): [T, (value: T) => Promise<void>, boolean] {
  const [value, setValue] = useState<T>(defaultValue);
  const [isLoading, setIsLoading] = useState(true);

  /**
   * 加载存储值
   */
  const loadValue = useCallback(async () => {
    try {
      const result = await chrome.storage[area].get([key]);
      const storedValue = result[key];
      setValue(storedValue !== undefined ? storedValue : defaultValue);
    } catch (error) {
      setValue(defaultValue);
    } finally {
      setIsLoading(false);
    }
  }, [key, defaultValue, area]);

  /**
   * 保存存储值
   */
  const saveValue = useCallback(async (newValue: T) => {
    try {
      await chrome.storage[area].set({ [key]: newValue });
      setValue(newValue);
    } catch (error) {
      throw error;
    }
  }, [key, area]);

  /**
   * 监听存储变化
   */
  useStorageListener({
    keys: [key],
    area,
    onChange: (changes) => {
      const change = changes.find(c => c.key === key);
      if (change && change.newValue !== undefined) {
        setValue(change.newValue);
      }
    },
  });

  /**
   * 初始加载
   */
  useEffect(() => {
    loadValue();
  }, [loadValue]);

  return [value, saveValue, isLoading];
}

/**
 * 监听书签数据变化的Hook
 */
export function useBookmarkStorageListener() {
  const [lastUpdateTime, setLastUpdateTime] = useState<number>(0);

  useStorageListener({
    keys: ['bookmark_categories', 'bookmarks'],
    area: 'local',
    onChange: () => {
      setLastUpdateTime(Date.now());
    },
  });

  return { lastUpdateTime };
}

/**
 * 监听应用设置变化的Hook
 */
export function useSettingsStorageListener() {
  const [lastUpdateTime, setLastUpdateTime] = useState<number>(0);

  useStorageListener({
    keys: ['app_settings'],
    area: 'local',
    onChange: () => {
      setLastUpdateTime(Date.now());
    },
  });

  return { lastUpdateTime };
}

/**
 * 批量监听多个存储键的Hook
 */
export function useMultipleStorageKeys(
  keys: string[],
  area: 'local' | 'sync' = 'local'
): Record<string, any> {
  const [values, setValues] = useState<Record<string, any>>({});

  /**
   * 加载所有值
   */
  const loadValues = useCallback(async () => {
    try {
      const result = await chrome.storage[area].get(keys);
      setValues(result);
    } catch (error) {
    }
  }, [keys, area]);

  /**
   * 监听变化
   */
  useStorageListener({
    keys,
    area,
    onChange: (changes) => {
      setValues(prev => {
        const updated = { ...prev };
        changes.forEach(change => {
          if (change.newValue !== undefined) {
            updated[change.key] = change.newValue;
          } else {
            delete updated[change.key];
          }
        });
        return updated;
      });
    },
  });

  /**
   * 初始加载
   */
  useEffect(() => {
    loadValues();
  }, [loadValues]);

  return values;
}

/**
 * 监听Chrome消息的Hook
 */
export function useRuntimeMessageListener(
  messageFilter?: (message: any) => boolean,
  onMessage?: (message: any, sender: any) => void
) {
  const listenerRef = useRef<((message: any, sender: any, sendResponse: any) => void) | null>(null);

  useEffect(() => {
    const handleMessage = (message: any, sender: any, sendResponse: any) => {
      if (messageFilter && !messageFilter(message)) {
        return;
      }

      if (onMessage) {
        onMessage(message, sender);
      }

      // 如果不需要异步响应，返回false
      return false;
    };

    listenerRef.current = handleMessage;
    chrome.runtime.onMessage.addListener(handleMessage);

    return () => {
      if (listenerRef.current) {
        chrome.runtime.onMessage.removeListener(listenerRef.current);
      }
    };
  }, [messageFilter, onMessage]);
}

/**
 * 监听同步状态变化的Hook
 */
export function useSyncStatusListener(
  onStatusChange?: (status: any) => void
) {
  const [syncStatus, setSyncStatus] = useState<any>({
    status: 'idle',
    message: null,
    timestamp: 0,
  });

  useRuntimeMessageListener(
    (message) => message.action === 'sync_status_changed',
    (message) => {
      const newStatus = message.data || {};
      setSyncStatus(newStatus);
      
      if (onStatusChange) {
        onStatusChange(newStatus);
      }
    }
  );

  return { syncStatus };
}