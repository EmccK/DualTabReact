
/**
 * WebDAV基础设置组件
 */

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../ui/card';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';
import { Switch } from '../../ui/switch';
import { Slider } from '../../ui/slider';
import { Alert } from '../../ui/alert';
import { Save, TestTube2, RotateCcw, CheckCircle, XCircle, RefreshCw } from 'lucide-react';
import type { WebDAVSettings as WebDAVSettingsType, SyncProgress } from '../../../types/webdav';

interface WebDAVSettingsProps {
  settings: WebDAVSettingsType;
  onSettingsChange: (settings: WebDAVSettingsType) => Promise<void>;
  onTestConnection: (config: WebDAVSettingsType['config']) => Promise<boolean>;
  onManualSync?: () => Promise<void>;
  syncProgress?: SyncProgress | null;
}

export function WebDAVSettings({
  settings,
  onSettingsChange,
  onTestConnection,
  onManualSync,
  syncProgress,
}: WebDAVSettingsProps) {
  const [localSettings, setLocalSettings] = useState(settings);
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  const updateLocalSettings = (updates: Partial<WebDAVSettingsType>) => {
    setLocalSettings(prev => ({ ...prev, ...updates }));
  };

  const updateConfig = (updates: Partial<WebDAVSettingsType['config']>) => {
    setLocalSettings(prev => ({
      ...prev,
      config: { ...prev.config, ...updates }
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSettingsChange(localSettings);
      setTestResult({ success: true, message: '设置已保存' });
    } catch (error: any) {
      setTestResult({ success: false, message: error.message || '保存失败' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleTest = async () => {
    setIsTesting(true);
    setTestResult(null);
    
    try {
      const success = await onTestConnection(localSettings.config);
      setTestResult({
        success,
        message: success ? '连接成功！' : '连接失败，请检查配置'
      });
    } catch (error: any) {
      setTestResult({
        success: false,
        message: error.message || '连接测试失败'
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleReset = () => {
    setLocalSettings(settings);
    setTestResult(null);
  };

  const handleManualSync = async () => {
    if (!onManualSync) return;
    
    setIsSyncing(true);
    setTestResult(null);
    
    try {
      await onManualSync();
      setTestResult({
        success: true,
        message: '同步完成！'
      });
    } catch (error: any) {
      setTestResult({
        success: false,
        message: error.message || '同步失败'
      });
    } finally {
      setIsSyncing(false);
    }
  };


  return (
    <div className="space-y-4">
      {/* 启用WebDAV */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">启用WebDAV同步</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="enable-webdav" className="text-sm font-medium">启用WebDAV同步</Label>
              <p className="text-xs text-gray-500 mt-1">
                将书签和设置同步到WebDAV服务器
              </p>
            </div>
            <Switch
              id="enable-webdav"
              checked={localSettings.enabled}
              onCheckedChange={(checked) => updateLocalSettings({ enabled: checked })}
            />
          </div>
        </CardContent>
      </Card>

      {/* 服务器配置 */}
      {localSettings.enabled && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">服务器配置</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 pt-0">
            {/* 服务器地址 */}
            <div className="space-y-1">
              <Label htmlFor="server-url" className="text-sm">服务器地址</Label>
              <Input
                id="server-url"
                type="url"
                placeholder="https://your-webdav-server.com/dav"
                value={localSettings.config.serverUrl}
                onChange={(e) => updateConfig({ serverUrl: e.target.value })}
                className="h-8"
              />
            </div>

            {/* 用户名和密码 */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="username" className="text-sm">用户名</Label>
                <Input
                  id="username"
                  type="text"
                  placeholder="用户名"
                  value={localSettings.config.username}
                  onChange={(e) => updateConfig({ username: e.target.value })}
                  className="h-8"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="password" className="text-sm">密码</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="密码"
                  value={localSettings.config.password}
                  onChange={(e) => updateConfig({ password: e.target.value })}
                  className="h-8"
                />
              </div>
            </div>


            {/* 基础路径 */}
            <div className="space-y-1">
              <Label htmlFor="base-path" className="text-sm">基础路径 (可选)</Label>
              <Input
                id="base-path"
                type="text"
                placeholder="/dualtab"
                value={localSettings.config.basePath}
                onChange={(e) => updateConfig({ basePath: e.target.value })}
                className="h-8"
              />
            </div>

            {/* 操作按钮 */}
            <div className="flex flex-wrap gap-2 pt-3 border-t">
              <Button
                onClick={handleTest}
                disabled={isTesting || !localSettings.config.serverUrl || !localSettings.config.username}
                variant="outline"
                size="sm"
                className="h-7 text-xs"
              >
                <TestTube2 className="h-3 w-3 mr-1" />
                {isTesting ? '测试中' : '测试'}
              </Button>
              
              <Button
                onClick={handleSave}
                disabled={isSaving}
                size="sm"
                className="h-7 text-xs"
              >
                <Save className="h-3 w-3 mr-1" />
                {isSaving ? '保存中' : '保存'}
              </Button>

              {onManualSync && localSettings.enabled && (
                <Button
                  onClick={handleManualSync}
                  disabled={isSyncing || syncProgress?.status === 'syncing'}
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs"
                >
                  <RefreshCw className="h-3 w-3 mr-1" />
                  {isSyncing || syncProgress?.status === 'syncing' ? '同步中' : '同步'}
                </Button>
              )}

              <Button
                onClick={handleReset}
                variant="ghost"
                size="sm"
                className="h-7 text-xs"
              >
                <RotateCcw className="h-3 w-3 mr-1" />
                重置
              </Button>
            </div>

            {/* 测试结果 */}
            {testResult && (
              <Alert variant={testResult.success ? "default" : "destructive"}>
                <div className="flex items-center gap-2">
                  {testResult.success ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-500" />
                  )}
                  <span>{testResult.message}</span>
                </div>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}

      {/* 同步设置 */}
      {localSettings.enabled && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">同步设置</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 pt-0">
            {/* 自动同步 */}
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="auto-sync" className="text-sm font-medium">自动同步</Label>
                <p className="text-xs text-gray-500 mt-1">
                  定期自动同步数据到服务器
                </p>
              </div>
              <Switch
                id="auto-sync"
                checked={localSettings.autoSync}
                onCheckedChange={(checked) => updateLocalSettings({ autoSync: checked })}
              />
            </div>

            {/* 同步间隔 */}
            {localSettings.autoSync && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-sm">同步间隔</Label>
                  <span className="text-xs text-gray-500">
                    {localSettings.syncInterval} 分钟
                  </span>
                </div>
                <Slider
                  value={[localSettings.syncInterval]}
                  onValueChange={([value]) => updateLocalSettings({ syncInterval: value })}
                  min={5}
                  max={1440}
                  step={5}
                  className="flex-1"
                />
                <div className="flex justify-between text-xs text-gray-400">
                  <span>5分钟</span>
                  <span>24小时</span>
                </div>
              </div>
            )}

            {/* 重试设置 */}
            <div className="space-y-2 pt-3 border-t">
              <div className="flex items-center justify-between">
                <Label className="text-sm">最大重试次数</Label>
                <span className="text-xs text-gray-500">
                  {localSettings.maxRetries} 次
                </span>
              </div>
              <Slider
                value={[localSettings.maxRetries]}
                onValueChange={([value]) => updateLocalSettings({ maxRetries: value })}
                min={1}
                max={10}
                step={1}
                className="flex-1"
              />
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
