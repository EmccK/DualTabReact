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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../ui/select';
import { Separator } from '../../../ui/separator';
import { Badge } from '../../../ui/badge';
import { Alert } from '../../../ui/alert';
import { useWebDAVSync } from '../../../../hooks/webdav';
import { WebDAVConfig, ConflictResolution, WEBDAV_PROVIDERS } from '../../../../services/webdav';

/**
 * 组件属性
 */
interface WebDAVSettingsProps {
  className?: string;
}

/**
 * WebDAV预设服务商
 */
const PROVIDER_OPTIONS = [
  { value: 'NEXTCLOUD', label: 'Nextcloud', icon: '☁️' },
  { value: 'OWNCLOUD', label: 'ownCloud', icon: '🌐' },
  { value: 'SYNOLOGY', label: 'Synology NAS', icon: '🗄️' },
  { value: 'QNAP', label: 'QNAP NAS', icon: '💾' },
  { value: 'GENERIC', label: '通用WebDAV', icon: '🔗' },
];

/**
 * 冲突解决策略选项
 */
const CONFLICT_RESOLUTION_OPTIONS = [
  { value: 'manual', label: '手动解决', description: '发生冲突时提示用户选择' },
  { value: 'use_local', label: '使用本地数据', description: '总是保留本地数据' },
  { value: 'use_remote', label: '使用远程数据', description: '总是使用远程数据' },
  { value: 'merge', label: '自动合并', description: '尝试自动合并数据' },
];

/**
 * 同步间隔选项
 */
const SYNC_INTERVAL_OPTIONS = [
  { value: 5, label: '5分钟' },
  { value: 15, label: '15分钟' },
  { value: 30, label: '30分钟' },
  { value: 60, label: '1小时' },
  { value: 180, label: '3小时' },
  { value: 360, label: '6小时' },
  { value: 720, label: '12小时' },
  { value: 1440, label: '24小时' },
];

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
  const [formData, setFormData] = useState<WebDAVConfig>({
    serverUrl: '',
    username: '',
    password: '',
    syncPath: '/DualTab',
    enabled: false,
    autoSyncInterval: 30,
  });

  const [advancedSettings, setAdvancedSettings] = useState({
    conflictResolution: 'manual' as ConflictResolution,
    enableBackup: true,
    maxRetries: 3,
    networkTimeout: 30,
  });

  const [selectedProvider, setSelectedProvider] = useState<string>('GENERIC');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  /**
   * 从state加载配置到表单
   */
  useEffect(() => {
    if (state.config) {
      setFormData({
        serverUrl: state.config.serverUrl || '',
        username: state.config.username || '',
        password: state.config.password || '',
        syncPath: state.config.syncPath || '/DualTab',
        enabled: state.config.enabled || false,
        autoSyncInterval: state.config.autoSyncInterval || 30,
      });
    }
  }, [state.config]);

  /**
   * 处理提供商选择
   */
  const handleProviderChange = (providerKey: string) => {
    setSelectedProvider(providerKey);
    const provider = WEBDAV_PROVIDERS[providerKey as keyof typeof WEBDAV_PROVIDERS];
    
    if (provider && formData.serverUrl) {
      // 根据提供商模板更新同步路径
      let newSyncPath = formData.syncPath;
      if (provider.pathTemplate !== '/') {
        newSyncPath = provider.pathTemplate.replace('{username}', formData.username) + '/DualTab';
      }
      
      setFormData(prev => ({
        ...prev,
        syncPath: newSyncPath,
      }));
    }
  };

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
      createBackup: advancedSettings.enableBackup,
      conflictResolution: advancedSettings.conflictResolution,
    });
  };

  /**
   * 上传数据
   */
  const handleUpload = async () => {
    await actions.upload({
      createBackup: advancedSettings.enableBackup,
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
      setFormData({
        serverUrl: '',
        username: '',
        password: '',
        syncPath: '/DualTab',
        enabled: false,
        autoSyncInterval: 30,
      });
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* 标题和状态 */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">WebDAV同步</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            通过WebDAV服务同步您的书签和设置
          </p>
        </div>
        <div className="flex items-center space-x-2">
          {state.isConfigured && (
            <Badge variant={state.syncStatus === 'success' ? 'default' : 'secondary'}>
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
      <Card className="p-6">
        <div className="space-y-4">
          <h4 className="font-medium">服务器配置</h4>
          
          {/* 服务商选择 */}
          <div className="space-y-2">
            <Label htmlFor="provider">WebDAV服务商</Label>
            <Select value={selectedProvider} onValueChange={handleProviderChange}>
              <SelectTrigger>
                <SelectValue placeholder="选择WebDAV服务商" />
              </SelectTrigger>
              <SelectContent>
                {PROVIDER_OPTIONS.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    <span className="flex items-center space-x-2">
                      <span>{option.icon}</span>
                      <span>{option.label}</span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 服务器地址 */}
          <div className="space-y-2">
            <Label htmlFor="serverUrl">服务器地址</Label>
            <Input
              id="serverUrl"
              type="url"
              placeholder="https://your-server.com"
              value={formData.serverUrl}
              onChange={(e) => handleFieldChange('serverUrl', e.target.value)}
            />
          </div>

          {/* 用户名 */}
          <div className="space-y-2">
            <Label htmlFor="username">用户名</Label>
            <Input
              id="username"
              type="text"
              placeholder="your-username"
              value={formData.username}
              onChange={(e) => handleFieldChange('username', e.target.value)}
            />
          </div>

          {/* 密码 */}
          <div className="space-y-2">
            <Label htmlFor="password">密码</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="your-password"
                value={formData.password}
                onChange={(e) => handleFieldChange('password', e.target.value)}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-2 top-1/2 -translate-y-1/2"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? '👁️' : '👁️‍🗨️'}
              </Button>
            </div>
          </div>

          {/* 同步路径 */}
          <div className="space-y-2">
            <Label htmlFor="syncPath">同步路径</Label>
            <Input
              id="syncPath"
              type="text"
              placeholder="/DualTab"
              value={formData.syncPath}
              onChange={(e) => handleFieldChange('syncPath', e.target.value)}
            />
          </div>

          {/* 操作按钮 */}
          <div className="flex space-x-2">
            <Button
              onClick={handleTestConnection}
              disabled={state.isTesting || !formData.serverUrl || !formData.username}
              variant="outline"
            >
              {state.isTesting ? '测试中...' : '测试连接'}
            </Button>
            <Button
              onClick={handleSaveConfig}
              disabled={state.isLoading || !formData.serverUrl}
            >
              保存配置
            </Button>
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
        </div>
      </Card>

      {/* 同步设置 */}
      {state.isConfigured && (
        <Card className="p-6">
          <div className="space-y-4">
            <h4 className="font-medium">同步设置</h4>
            
            {/* 自动同步间隔 */}
            <div className="space-y-2">
              <Label htmlFor="autoSyncInterval">自动同步间隔</Label>
              <Select
                value={formData.autoSyncInterval?.toString() || '30'}
                onValueChange={(value) => handleFieldChange('autoSyncInterval', parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SYNC_INTERVAL_OPTIONS.map(option => (
                    <SelectItem key={option.value} value={option.value.toString()}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 手动同步操作 */}
            <Separator />
            <div className="space-y-3">
              <h5 className="text-sm font-medium">手动同步</h5>
              <div className="flex flex-wrap gap-2">
                <Button
                  onClick={handleManualSync}
                  disabled={state.isLoading}
                  size="sm"
                >
                  {state.isLoading ? '同步中...' : '立即同步'}
                </Button>
                <Button
                  onClick={handleUpload}
                  disabled={state.isLoading}
                  variant="outline"
                  size="sm"
                >
                  上传数据
                </Button>
                <Button
                  onClick={handleDownload}
                  disabled={state.isLoading}
                  variant="outline"
                  size="sm"
                >
                  下载数据
                </Button>
              </div>
            </div>

            {/* 最后同步时间 */}
            {state.lastSyncTime > 0 && (
              <div className="text-sm text-gray-600 dark:text-gray-400">
                最后同步时间: {new Date(state.lastSyncTime).toLocaleString()}
              </div>
            )}
          </div>
        </Card>
      )}

      {/* 高级设置 */}
      {state.isConfigured && (
        <Card className="p-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">高级设置</h4>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAdvanced(!showAdvanced)}
              >
                {showAdvanced ? '收起' : '展开'}
              </Button>
            </div>

            {showAdvanced && (
              <div className="space-y-4">
                {/* 冲突解决策略 */}
                <div className="space-y-2">
                  <Label htmlFor="conflictResolution">冲突解决策略</Label>
                  <Select
                    value={advancedSettings.conflictResolution}
                    onValueChange={(value) => 
                      setAdvancedSettings(prev => ({
                        ...prev,
                        conflictResolution: value as ConflictResolution
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CONFLICT_RESOLUTION_OPTIONS.map(option => (
                        <SelectItem key={option.value} value={option.value}>
                          <div>
                            <div>{option.label}</div>
                            <div className="text-xs text-gray-500">{option.description}</div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* 自动备份 */}
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="enableBackup">创建备份</Label>
                    <p className="text-xs text-gray-500">同步前自动创建数据备份</p>
                  </div>
                  <Switch
                    id="enableBackup"
                    checked={advancedSettings.enableBackup}
                    onCheckedChange={(checked) =>
                      setAdvancedSettings(prev => ({ ...prev, enableBackup: checked }))
                    }
                  />
                </div>

                {/* 网络超时 */}
                <div className="space-y-2">
                  <Label htmlFor="networkTimeout">网络超时（秒）</Label>
                  <Input
                    id="networkTimeout"
                    type="number"
                    min="5"
                    max="300"
                    value={advancedSettings.networkTimeout}
                    onChange={(e) =>
                      setAdvancedSettings(prev => ({
                        ...prev,
                        networkTimeout: parseInt(e.target.value) || 30
                      }))
                    }
                  />
                </div>

                {/* 重试次数 */}
                <div className="space-y-2">
                  <Label htmlFor="maxRetries">最大重试次数</Label>
                  <Input
                    id="maxRetries"
                    type="number"
                    min="0"
                    max="10"
                    value={advancedSettings.maxRetries}
                    onChange={(e) =>
                      setAdvancedSettings(prev => ({
                        ...prev,
                        maxRetries: parseInt(e.target.value) || 3
                      }))
                    }
                  />
                </div>
              </div>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}