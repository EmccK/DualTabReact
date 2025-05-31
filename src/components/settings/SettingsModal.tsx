import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { SettingsTabs, type SettingsTab } from './SettingsTabs';
import { AppPreferences } from './sections/AppPreferences';
import { BookmarkSettings } from './sections/BookmarkSettings';
import { BackgroundSettings } from './sections/BackgroundSettings';
import { SyncSettings } from './sections/SyncSettings';
import { useSettings } from '@/hooks/useSettings';
import { Settings, Save, RotateCcw, X } from 'lucide-react';
import type { Bookmark, BookmarkCategory } from '@/types';

/**
 * 合并同名分类并更新书签的categoryId引用
 * 解决不同设备间categoryId不一致的问题
 */
async function mergeCategoriesAndUpdateBookmarks(
  remoteBookmarks: Bookmark[], 
  remoteCategories: BookmarkCategory[]
): Promise<{ bookmarks: Bookmark[], categories: BookmarkCategory[] }> {
  try {
    // 获取本地现有的分类数据
    const localData = await chrome.storage.local.get(['categories']);
    const localCategories: BookmarkCategory[] = localData.categories || [];
    
    console.log('开始分类合并:', {
      本地分类: localCategories.length,
      远程分类: remoteCategories.length,
    });
    
    // 创建分类名称到最终分类的映射
    const categoryMapping = new Map<string, string>(); // 远程categoryId -> 最终categoryId
    const finalCategories: BookmarkCategory[] = [];
    
    // 先处理本地分类，建立名称索引
    const localCategoryByName = new Map<string, BookmarkCategory>();
    localCategories.forEach(cat => {
      localCategoryByName.set(cat.name, cat);
    });
    
    // 处理远程分类
    remoteCategories.forEach(remoteCat => {
      const localCat = localCategoryByName.get(remoteCat.name);
      
      if (localCat) {
        // 找到同名分类，使用本地分类的ID
        categoryMapping.set(remoteCat.id, localCat.id);
        
        // 检查是否已经添加到最终列表
        if (!finalCategories.find(c => c.id === localCat.id)) {
          finalCategories.push(localCat);
        }
        
        console.log(`合并分类: "${remoteCat.name}" ${remoteCat.id} -> ${localCat.id}`);
      } else {
        // 新分类，直接使用
        categoryMapping.set(remoteCat.id, remoteCat.id);
        finalCategories.push(remoteCat);
        
        console.log(`新增分类: "${remoteCat.name}" ${remoteCat.id}`);
      }
    });
    
    // 添加本地独有的分类
    localCategories.forEach(localCat => {
      if (!finalCategories.find(c => c.id === localCat.id)) {
        finalCategories.push(localCat);
        console.log(`保留本地分类: "${localCat.name}" ${localCat.id}`);
      }
    });
    
    // 更新远程书签的categoryId
    const updatedBookmarks = remoteBookmarks.map(bookmark => {
      if (bookmark.categoryId && categoryMapping.has(bookmark.categoryId)) {
        const newCategoryId = categoryMapping.get(bookmark.categoryId)!;
        
        if (newCategoryId !== bookmark.categoryId) {
          console.log(`更新书签分类: "${bookmark.title}" ${bookmark.categoryId} -> ${newCategoryId}`);
        }
        
        return {
          ...bookmark,
          categoryId: newCategoryId,
        };
      }
      return bookmark;
    });
    
    console.log('分类合并完成:', {
      最终分类数: finalCategories.length,
      更新书签数: updatedBookmarks.length,
      映射规则: Array.from(categoryMapping.entries()),
    });
    
    return {
      bookmarks: updatedBookmarks,
      categories: finalCategories,
    };
  } catch (error) {
    console.error('分类合并失败:', error);
    // 出错时返回原始数据
    return {
      bookmarks: remoteBookmarks,
      categories: remoteCategories,
    };
  }
}

interface SettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDataUpdated?: (data: {
    bookmarks: any[];
    categories: any[];
    settings: any;
  }) => void;
}

/**
 * 主设置弹窗组件
 * 提供完整的应用设置管理界面
 */
export function SettingsModal({ open, onOpenChange, onDataUpdated }: SettingsModalProps) {
  // 直接从localStorage读取初始activeTab
  const [activeTab, setActiveTab] = useState<SettingsTab>(() => {
    const saved = localStorage.getItem('settingsLastActiveTab') as SettingsTab;
    return saved && ['preferences', 'bookmarks', 'background', 'sync'].includes(saved) 
      ? saved 
      : 'preferences';
  });
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const { settings, updateSettings, resetSettings, isLoading, isDirty } = useSettings();

  const handleTabChange = (tab: SettingsTab) => {
    setActiveTab(tab);
    localStorage.setItem('settingsLastActiveTab', tab);
  };

  const handleSave = async () => {
    try {
      // 设置会自动保存，这里主要是用户反馈
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to save settings:', error);
    }
  };

  const handleReset = async () => {
    if (showResetConfirm) {
      try {
        await resetSettings(activeTab);
        setShowResetConfirm(false);
      } catch (error) {
        console.error('Failed to reset settings:', error);
      }
    } else {
      setShowResetConfirm(true);
    }
  };

  const handleClose = () => {
    setShowResetConfirm(false);
    onOpenChange(false);
  };


  const renderTabContent = () => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-4"></div>
            <p className="text-gray-500">加载设置中...</p>
          </div>
        </div>
      );
    }

    switch (activeTab) {
      case 'preferences':
        return (
          <AppPreferences
            preferences={settings.preferences}
            onUpdate={(updates) => updateSettings('preferences', updates)}
          />
        );
      case 'bookmarks':
        return (
          <BookmarkSettings
            settings={settings.bookmarks}
            onUpdate={(updates) => updateSettings('bookmarks', updates)}
          />
        );
      case 'background':
        return <BackgroundSettings />;
      case 'sync':
        return (
          <SyncSettings
            settings={settings.sync}
            onUpdate={(updates) => updateSettings('sync', updates)}
            getLocalData={async () => {
              try {
                // 从Chrome存储中获取实际的本地数据
                const result = await chrome.storage.local.get(['bookmarks', 'categories']);
                
                console.log('获取本地数据:', {
                  bookmarks: result.bookmarks?.length || 0,
                  categories: result.categories?.length || 0,
                  hasSettings: !!settings
                });
                
                return {
                  bookmarks: result.bookmarks || [],
                  categories: result.categories || [],
                  settings: settings,
                };
              } catch (error) {
                console.error('获取本地数据失败:', error);
                return {
                  bookmarks: [],
                  categories: [],
                  settings: settings,
                };
              }
            }}
            onDataUpdated={async (syncedData) => {
              try {
                console.log('接收到同步数据:', {
                  bookmarks: syncedData.bookmarks?.length || 0,
                  categories: syncedData.categories?.length || 0,
                  settings: !!syncedData.settings,
                });
                
                // 检查数据是否有效
                if (!syncedData.bookmarks || !Array.isArray(syncedData.bookmarks)) {
                  console.error('书签数据无效:', syncedData.bookmarks);
                  syncedData.bookmarks = [];
                }
                
                if (!syncedData.categories || !Array.isArray(syncedData.categories)) {
                  console.error('分类数据无效:', syncedData.categories);
                  syncedData.categories = [];
                }
                
                // 处理分类ID冲突：合并同名分类并更新书签引用
                const processedData = await mergeCategoriesAndUpdateBookmarks(
                  syncedData.bookmarks, 
                  syncedData.categories
                );
                
                console.log('分类合并后的数据:', {
                  bookmarks: processedData.bookmarks.length,
                  categories: processedData.categories.length,
                });
                
                // 将处理后的书签和分类数据保存到Chrome存储
                await chrome.storage.local.set({
                  bookmarks: processedData.bookmarks,
                  categories: processedData.categories,
                });
                
                // 设置数据通过useSettings机制更新
                const settingsKey = 'app_settings';
                await chrome.storage.local.set({
                  [settingsKey]: syncedData.settings
                });
                
                console.log('同步数据已保存到Chrome存储', {
                  bookmarks: processedData.bookmarks.length,
                  categories: processedData.categories.length,
                  settings: !!syncedData.settings,
                });
                
                // 通知主应用组件更新状态，使用处理后的数据
                onDataUpdated?.({
                  ...syncedData,
                  bookmarks: processedData.bookmarks,
                  categories: processedData.categories,
                });
              } catch (error) {
                console.error('保存同步数据失败:', error);
              }
            }}
          />
        );
      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] p-0">
        <DialogHeader className="px-6 py-3 border-b border-gray-200">
          <DialogTitle className="flex items-center text-lg font-semibold">
            <Settings className="w-4 h-4 mr-2 text-indigo-600" />
            应用设置
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col h-full">
          {/* 标签页导航 */}
          <div className="px-6 py-2">
            <SettingsTabs
              activeTab={activeTab}
              onTabChange={handleTabChange}
            />
          </div>

          {/* 设置内容区域 */}
          <div className="flex-1 overflow-y-auto px-6 py-4">
            {showResetConfirm && (
              <Alert className="mb-4 border-orange-200 bg-orange-50">
                <AlertDescription className="flex items-center justify-between">
                  <span className="text-sm">确定要重置当前分组的所有设置吗？此操作不可撤销。</span>
                  <div className="flex space-x-2 ml-4">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setShowResetConfirm(false)}
                    >
                      取消
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={handleReset}
                    >
                      确认重置
                    </Button>
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {renderTabContent()}
          </div>

          {/* 底部按钮栏 */}
          <div className="flex items-center justify-between px-6 py-3 border-t border-gray-200 bg-gray-50 rounded-b-lg">
            <div className="flex items-center space-x-3">
              <Button
                variant="outline"
                size="sm"
                onClick={handleReset}
                disabled={isLoading}
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                {showResetConfirm ? '确认重置' : '重置设置'}
              </Button>
              
              {isDirty && (
                <span className="text-sm text-orange-600 flex items-center">
                  <div className="w-2 h-2 bg-orange-500 rounded-full mr-2 animate-pulse"></div>
                  有未保存的更改
                </span>
              )}
            </div>

            <div className="flex items-center space-x-3">
              <Button
                variant="outline"
                onClick={handleClose}
                disabled={isLoading}
              >
                <X className="w-4 h-4 mr-2" />
                取消
              </Button>
              <Button
                onClick={handleSave}
                disabled={isLoading}
                className="bg-indigo-600 hover:bg-indigo-700"
              >
                <Save className="w-4 h-4 mr-2" />
                保存设置
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
