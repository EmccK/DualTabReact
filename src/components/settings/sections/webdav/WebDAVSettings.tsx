/**
 * WebDAV设置组件
 * 提供WebDAV服务器配置和同步设置界面
 */

import React, { useState, useEffect } from 'react';
import { Card } from '../../../ui/card';
import { Button } from '../../../ui/button';
import { Input } from '../../../ui/input';
import { Label } from '../../../ui/label';
import { Separator } from '../../../ui/separator';
import { Badge } from '../../../ui/badge';
import { Alert } from '../../../ui/alert';
import { AutoSyncConfig } from './AutoSyncConfig';
import { useWebDAVSync } from '../../../../hooks/webdav';
import type { WebDAVConfig } from '../../../../services/webdav';
import { DEFAULT_WEBDAV_CONFIG } from '../../../../services/webdav';

/**
 * 组件属性
 */
interface WebDAVSettingsProps {
  className?: string;
  onRegisterSave?: (componentId: string, saveFn: () => Promise<void>) => void;
  onUnregisterSave?: (componentId: string) => void;
}


/**
 * WebDAV设置组件
 */
export function WebDAVSettings({ className, onRegisterSave, onUnregisterSave }: WebDAVSettingsProps) {
  const [state, actions] = useWebDAVSync({
    autoLoadConfig: true,
    autoRefreshStatus: true,
    onError: (error) => {
    },
  });

  // 表单状态
  const [formData, setFormData] = useState<WebDAVConfig>(DEFAULT_WEBDAV_CONFIG);
  const [showPassword, setShowPassword] = useState(false);
  const [autoSyncConfig, setAutoSyncConfig] = useState<any>(null);

  /**
   * 从state加载配置到表单
   */
  useEffect(() => {
    if (state.config) {
      setFormData({
        serverUrl: state.config.serverUrl || DEFAULT_WEBDAV_CONFIG.serverUrl,
        username: state.config.username || DEFAULT_WEBDAV_CONFIG.username,
        password: state.config.password || DEFAULT_WEBDAV_CONFIG.password,
        syncPath: state.config.syncPath || DEFAULT_WEBDAV_CONFIG.syncPath,
        enabled: state.config.enabled || DEFAULT_WEBDAV_CONFIG.enabled,
        autoSyncInterval: state.config.autoSyncInterval || DEFAULT_WEBDAV_CONFIG.autoSyncInterval,
      });
    }
  }, [state.config]);

  /**
   * 注册/注销保存函数
   */
  useEffect(() => {
    const componentId = 'webdav-settings';
    
    // 注册保存函数
    onRegisterSave?.(componentId, handleSaveAllConfig);
    
    // 清理函数：组件卸载时注销
    return () => {
      onUnregisterSave?.(componentId);
    };
  }, [autoSyncConfig, formData]); // 依赖这些值，确保保存函数是最新的


  /**
   * 处理表单字段变化
   */
  const handleFieldChange = (field: keyof WebDAVConfig, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  /**
   * 测试连接
   */
  const handleTestConnection = async () => {
    // 先保存配置
    const success = await actions.updateConfig(formData);
    if (success) {
      // 然后测试连接
      await actions.testConnection();
    }
  };

  /**
   * 保存配置 - 统一保存函数
   */
  const handleSaveAllConfig = async () => {
    // 自动启用同步
    const configWithSync = { ...formData, enabled: true };
    setFormData(configWithSync);
    
    // 保存WebDAV基本配置
    const success = await actions.updateConfig(configWithSync);
    if (success) {
      // 启用自动同步
      await actions.enableAutoSync(true, configWithSync.autoSyncInterval);
    }
    
    // 同时保存智能同步配置
    if (autoSyncConfig) {
      try {
        const response = await chrome.runtime.sendMessage({
          action: 'webdav_update_auto_sync_config',
          config: autoSyncConfig,
        });
        
        if (!response?.success) {
        }
      } catch (error) {
      }
    }
  };

  /**
   * 保存基本配置（原来的保存按钮）
   */
  const handleSaveConfig = async () => {
    // 自动启用同步
    const configWithSync = { ...formData, enabled: true };
    setFormData(configWithSync);
    
    const success = await actions.updateConfig(configWithSync);
    if (success) {
      // 启用自动同步
      await actions.enableAutoSync(true, configWithSync.autoSyncInterval);
    }
  };

  /**
   * 处理智能同步配置变更
   */
  const handleAutoSyncConfigChange = (config: any) => {
    setAutoSyncConfig(config);
  };



  /**
   * 执行手动同步
   */
  const handleManualSync = async () => {
    await actions.sync({
      createBackup: true, // 默认创建备份
    });
  };

  /**
   * 上传数据
   */
  const handleUpload = async () => {
    await actions.upload({
      createBackup: true,
    });
  };
  

  /**
   * 下载数据
   */
  const handleDownload = async () => {
    await actions.download();
  };

  /**
   * 清除配置
   */
  const handleClearConfig = async () => {
    if (confirm('确定要清除WebDAV配置吗？这将删除所有同步设置。')) {
      await actions.clearConfig();
      setFormData(DEFAULT_WEBDAV_CONFIG);
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* 标题 */}
      <div>
        <h3 className="text-base font-semibold">WebDAV同步</h3>
        <div className="flex items-center justify-between">
          <p className="text-xs text-gray-600 dark:text-gray-400">
            通过WebDAV服务同步您的书签和设置
          </p>
          {/* 同步状态指示器 */}
          {state.isConfigured && (
            <div className="flex items-center space-x-2">
              {state.syncStatus === 'idle' && (
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                  <span className="text-xs text-gray-500">空闲</span>
                </div>
              )}
              {state.syncStatus === 'syncing' && (
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                  <span className="text-xs text-blue-600">同步中...</span>
                </div>
              )}
              {state.syncStatus === 'success' && (
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-xs text-green-600">同步成功</span>
                </div>
              )}
              {state.syncStatus === 'error' && (
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                  <span className="text-xs text-red-600">同步失败</span>
                </div>
              )}
            </div>
          )}
        </div>
        
        {/* 操作反馈提示 */}
        {state.error && (
          <Alert variant="destructive" className="mt-3">
            <span>{state.error}</span>
          </Alert>
        )}

        {state.message && !state.error && (
          <Alert className="mt-3">
            <span>{state.message}</span>
          </Alert>
        )}
      </div>

      {/* 基本配置 */}
      <Card className="p-4">
        <div className="space-y-3">
          <h4 className="text-sm font-medium">服务器配置</h4>
          
          {/* 服务器配置表单 - 使用网格布局 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* 服务器地址 */}
            <div className="space-y-1">
              <Label htmlFor="serverUrl" className="text-xs">服务器地址</Label>
              <Input
                id="serverUrl"
                type="url"
                placeholder="https://your-server.com"
                value={formData.serverUrl}
                onChange={(e) => handleFieldChange('serverUrl', e.target.value)}
                className="h-8"
              />
            </div>

            {/* 同步路径 */}
            <div className="space-y-1">
              <Label htmlFor="syncPath" className="text-xs">同步路径</Label>
              <Input
                id="syncPath"
                type="text"
                placeholder="/DualTab"
                value={formData.syncPath}
                onChange={(e) => handleFieldChange('syncPath', e.target.value)}
                className="h-8"
              />
            </div>

            {/* 用户名 */}
            <div className="space-y-1">
              <Label htmlFor="username" className="text-xs">用户名</Label>
              <Input
                id="username"
                type="text"
                placeholder="your-username"
                value={formData.username}
                onChange={(e) => handleFieldChange('username', e.target.value)}
                className="h-8"
              />
            </div>

            {/* 密码 */}
            <div className="space-y-1">
              <Label htmlFor="password" className="text-xs">密码</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="your-password"
                  value={formData.password}
                  onChange={(e) => handleFieldChange('password', e.target.value)}
                  className="h-8 pr-8"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6 p-0"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  <span className="text-xs">{showPassword ? '👁️' : '👁️‍🗨️'}</span>
                </Button>
              </div>
            </div>
          </div>

          {/* 操作按钮 */}
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={handleTestConnection}
              disabled={state.isTesting || !formData.serverUrl || !formData.username}
              variant="outline"
              size="sm"
            >
              {state.isTesting ? '测试中...' : '测试连接'}
            </Button>
            <Button
              onClick={handleSaveConfig}
              disabled={state.isLoading || !formData.serverUrl}
              size="sm"
            >
              保存配置
            </Button>
            
            {/* 手动同步操作 - 移到这里 */}
            {state.isConfigured && (
              <>
                <Button
                  onClick={handleManualSync}
                  disabled={state.isLoading}
                  size="sm"
                  variant="secondary"
                >
                  {state.isLoading ? '同步中...' : '立即同步'}
                </Button>
                <Button
                  onClick={handleUpload}
                  disabled={state.isLoading}
                  variant="outline"
                  size="sm"
                >
                  上传
                </Button>
                <Button
                  onClick={handleDownload}
                  disabled={state.isLoading}
                  variant="outline"
                  size="sm"
                >
                  下载
                </Button>
              </>
            )}
            
            {state.isConfigured && (
              <Button
                onClick={handleClearConfig}
                variant="destructive"
                size="sm"
              >
                清除配置
              </Button>
            )}
          </div>
          
          {/* 最后同步时间 - 移到这里 */}
          {state.lastSyncTime > 0 && (
            <div className="text-xs text-gray-600 dark:text-gray-400">
              最后同步: {new Date(state.lastSyncTime).toLocaleString()}
            </div>
          )}
        </div>
      </Card>

      {/* 智能自动同步配置 */}
      {state.isConfigured && (
        <>
          <Separator />
          <AutoSyncConfig 
            onConfigChange={handleAutoSyncConfigChange}
          />
        </>
      )}
    </div>
  );
}