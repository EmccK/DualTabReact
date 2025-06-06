/**
 * WebDAV设置组件
 * 提供WebDAV服务器配置和同步设置界面
 */

import React, { useState, useEffect } from 'react';
import { Card } from '../../../ui/card';
import { Button } from '../../../ui/button';
import { Input } from '../../../ui/input';
import { Label } from '../../../ui/label';
import { Switch } from '../../../ui/switch';
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
}


/**
 * WebDAV设置组件
 */
export function WebDAVSettings({ className }: WebDAVSettingsProps) {
  const [state, actions] = useWebDAVSync({
    autoLoadConfig: true,
    autoRefreshStatus: true,
    onError: (error) => {
      console.error('WebDAV Error:', error);
    },
  });

  // 表单状态
  const [formData, setFormData] = useState<WebDAVConfig>(DEFAULT_WEBDAV_CONFIG);
  const [showPassword, setShowPassword] = useState(false);

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
   * 保存配置
   */
  const handleSaveConfig = async () => {
    await actions.updateConfig(formData);
  };

  /**
   * 启用WebDAV同步
   */
  const handleEnableSync = async (enabled: boolean) => {
    const updatedConfig = { ...formData, enabled };
    setFormData(updatedConfig);
    await actions.updateConfig(updatedConfig);
    
    if (enabled) {
      await actions.enableAutoSync(true, formData.autoSyncInterval);
    } else {
      await actions.enableAutoSync(false);
    }
  };

  /**
   * 执行手动同步
   */
  const handleManualSync = async () => {
    await actions.sync({
      createBackup: true, // 默认创建备份
      conflictResolution: 'manual', // 默认手动处理冲突
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
      {/* 标题和状态 */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold">WebDAV同步</h3>
          <p className="text-xs text-gray-600 dark:text-gray-400">
            通过WebDAV服务同步您的书签和设置
          </p>
        </div>
        <div className="flex items-center space-x-2">
          {state.isConfigured && (
            <Badge variant={state.syncStatus === 'success' ? 'default' : 'secondary'} className="text-xs">
              {state.syncStatus === 'idle' && '空闲'}
              {state.syncStatus === 'syncing' && '同步中'}
              {state.syncStatus === 'success' && '同步成功'}
              {state.syncStatus === 'error' && '同步失败'}
              {state.syncStatus === 'conflict' && '存在冲突'}
            </Badge>
          )}
          <Switch
            checked={formData.enabled}
            onCheckedChange={handleEnableSync}
            disabled={!state.isConfigured || state.isLoading}
          />
        </div>
      </div>

      {/* 错误提示 */}
      {state.error && (
        <Alert variant="destructive">
          <span>{state.error}</span>
        </Alert>
      )}

      {/* 成功消息 */}
      {state.message && !state.error && (
        <Alert>
          <span>{state.message}</span>
        </Alert>
      )}

      {/* 冲突提示 */}
      {state.hasConflict && (
        <Alert variant="destructive">
          <div className="flex items-center justify-between">
            <span>检测到数据冲突，需要手动解决</span>
            <Button size="sm" variant="outline">
              解决冲突
            </Button>
          </div>
        </Alert>
      )}

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
          <AutoSyncConfig />
        </>
      )}
    </div>
  );
}