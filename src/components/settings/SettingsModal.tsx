import React, { useState } from 'react';
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
import { WebDAVSettings } from './sections/webdav/WebDAVSettings';
import { useSettings } from '@/hooks/useSettings';
import { Settings, Save, RotateCcw, X } from 'lucide-react';

interface SettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * 主设置弹窗组件
 * 提供完整的应用设置管理界面
 */
export function SettingsModal({ open, onOpenChange }: SettingsModalProps) {
  // 直接从localStorage读取初始activeTab
  const [activeTab, setActiveTab] = useState<SettingsTab>(() => {
    const saved = localStorage.getItem('settingsLastActiveTab') as SettingsTab;
    return saved && ['preferences', 'bookmarks', 'background', 'sync'].includes(saved) 
      ? saved 
      : 'preferences';
  });
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const { settings, updateSettings, resetSettings, isLoading, isDirty } = useSettings();
  
  // 存储各个组件的保存函数
  const [componentSaveFunctions, setComponentSaveFunctions] = useState<Record<string, () => Promise<void>>>({});

  const handleTabChange = (tab: SettingsTab) => {
    setActiveTab(tab);
    localStorage.setItem('settingsLastActiveTab', tab);
  };

  const handleSave = async () => {
    try {
      // 执行所有组件的保存函数
      const savePromises = Object.values(componentSaveFunctions).map(saveFn => saveFn());
      await Promise.all(savePromises);
      
      onOpenChange(false);
    } catch {
      // Ignore settings save errors
    }
  };

  // 注册组件保存函数
  const registerSaveFunction = (componentId: string, saveFn: () => Promise<void>) => {
    setComponentSaveFunctions(prev => ({
      ...prev,
      [componentId]: saveFn
    }));
  };

  // 注销组件保存函数
  const unregisterSaveFunction = (componentId: string) => {
    setComponentSaveFunctions(prev => {
      const newFunctions = { ...prev };
      delete newFunctions[componentId];
      return newFunctions;
    });
  };

  const handleReset = async () => {
    if (showResetConfirm) {
      try {
        await resetSettings(activeTab);
        setShowResetConfirm(false);
      } catch (error) {
        console.error('重置设置失败:', error);
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
        return <WebDAVSettings onRegisterSave={registerSaveFunction} onUnregisterSave={unregisterSaveFunction} />;
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
