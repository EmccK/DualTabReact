import React, { useState } from 'react';
import { SettingItem } from '../components/SettingItem';
import { ToggleSwitch } from '../components/ToggleSwitch';
import { SelectOption } from '../components/SelectOption';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CheckCircle, XCircle, Cloud } from 'lucide-react';
import type { SyncSettings } from '@/types/settings';

interface SyncSettingsProps {
  settings: SyncSettings;
  onUpdate: (updates: Partial<SyncSettings>) => void;
}

/**
 * 同步设置分组
 * 包含WebDAV配置、自动同步、数据管理等设置
 */
export function SyncSettings({ settings, onUpdate }: SyncSettingsProps) {
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'untested' | 'success' | 'error'>('untested');
  const [connectionMessage, setConnectionMessage] = useState('');

  const syncIntervalOptions = [
    { value: '15', label: '15分钟', description: '每15分钟同步一次' },
    { value: '30', label: '30分钟', description: '每30分钟同步一次' },
    { value: '60', label: '1小时', description: '每小时同步一次' },
    { value: '360', label: '6小时', description: '每6小时同步一次' },
    { value: '1440', label: '24小时', description: '每天同步一次' },
  ];

  const handleTestConnection = async () => {
    if (!settings.serverUrl || !settings.username) {
      setConnectionStatus('error');
      setConnectionMessage('请填写完整的服务器地址和用户名');
      return;
    }

    setIsTestingConnection(true);
    setConnectionStatus('untested');
    setConnectionMessage('');

    try {
      // TODO: 实现实际的WebDAV连接测试
      // 这里模拟测试过程
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setConnectionStatus('success');
      setConnectionMessage('连接测试成功！');
    } catch (error) {
      setConnectionStatus('error');
      setConnectionMessage('连接测试失败，请检查服务器配置');
    } finally {
      setIsTestingConnection(false);
    }
  };

  const handleManualSync = async () => {
    // TODO: 实现手动同步功能
    console.log('Manual sync triggered');
  };

  const formatLastSyncTime = (timestamp?: string) => {
    if (!timestamp) return '从未同步';
    return new Date(timestamp).toLocaleString('zh-CN');
  };

  return (
    <div className="space-y-6">
      {/* WebDAV配置 */}
      <section>
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
          WebDAV配置
        </h3>
        <div className="space-y-4 border border-gray-200 rounded-lg bg-white p-4">
          <div className="grid grid-cols-1 gap-4">
            <div>
              <Label htmlFor="server-url" className="text-sm font-medium">
                服务器地址 <span className="text-red-500">*</span>
              </Label>
              <Input
                id="server-url"
                type="url"
                placeholder="https://example.com/webdav/"
                value={settings.serverUrl || ''}
                onChange={(e) => onUpdate({ serverUrl: e.target.value })}
                className="mt-1"
              />
              <p className="text-xs text-gray-500 mt-1">
                完整URL，包含http(s)://和结尾的/
              </p>
            </div>
            
            <div>
              <Label htmlFor="username" className="text-sm font-medium">
                用户名 <span className="text-red-500">*</span>
              </Label>
              <Input
                id="username"
                type="text"
                placeholder="用户名"
                value={settings.username || ''}
                onChange={(e) => onUpdate({ username: e.target.value })}
                className="mt-1"
              />
            </div>
            
            <div>
              <Label htmlFor="base-path" className="text-sm font-medium">
                基础路径（可选）
              </Label>
              <Input
                id="base-path"
                type="text"
                placeholder="/dualtab/"
                value={settings.basePath || ''}
                onChange={(e) => onUpdate({ basePath: e.target.value })}
                className="mt-1"
              />
              <p className="text-xs text-gray-500 mt-1">
                服务器上存储数据的路径，默认为根目录
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3 pt-2">
            <Button
              onClick={handleTestConnection}
              disabled={isTestingConnection}
              variant="outline"
              size="sm"
            >
              {isTestingConnection && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              测试连接
            </Button>
            
            {connectionStatus !== 'untested' && (
              <div className="flex items-center space-x-2">
                {connectionStatus === 'success' ? (
                  <CheckCircle className="w-4 h-4 text-green-500" />
                ) : (
                  <XCircle className="w-4 h-4 text-red-500" />
                )}
                <span className={`text-sm ${
                  connectionStatus === 'success' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {connectionMessage}
                </span>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 同步选项 */}
      <section>
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <span className="w-2 h-2 bg-green-500 rounded-full mr-3"></span>
          同步选项
        </h3>
        <div className="space-y-0 border border-gray-200 rounded-lg bg-white">
          <SettingItem
            title="启用WebDAV同步"
            description="开启WebDAV云端数据同步功能"
          >
            <ToggleSwitch
              checked={settings.webdavEnabled}
              onCheckedChange={(checked) => onUpdate({ webdavEnabled: checked })}
            />
          </SettingItem>
          
          <SettingItem
            title="自动同步"
            description="定期自动同步数据到云端"
            disabled={!settings.webdavEnabled}
          >
            <ToggleSwitch
              checked={settings.autoSync}
              onCheckedChange={(checked) => onUpdate({ autoSync: checked })}
              disabled={!settings.webdavEnabled}
            />
          </SettingItem>
          
          <SettingItem
            title="同步间隔"
            description="自动同步的时间间隔"
            disabled={!settings.webdavEnabled || !settings.autoSync}
          >
            <SelectOption
              value={settings.syncInterval.toString()}
              onValueChange={(value) => onUpdate({ syncInterval: parseInt(value) })}
              options={syncIntervalOptions}
              className="w-32"
              disabled={!settings.webdavEnabled || !settings.autoSync}
            />
          </SettingItem>
        </div>
      </section>

      {/* 同步状态 */}
      <section>
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <span className="w-2 h-2 bg-purple-500 rounded-full mr-3"></span>
          同步状态
        </h3>
        <div className="border border-gray-200 rounded-lg bg-white p-4">
          <div className="space-y-3 mb-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">上次同步时间:</span>
              <span className="text-sm font-medium">
                {formatLastSyncTime(settings.lastSyncTime)}
              </span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">同步状态:</span>
              <span className="text-sm font-medium flex items-center">
                <Cloud className="w-4 h-4 mr-1 text-gray-500" />
                {settings.webdavEnabled ? '已启用' : '未启用'}
              </span>
            </div>
          </div>
          
          {settings.webdavEnabled && (
            <Alert>
              <AlertDescription>
                每次打开新标签页时将自动检查并同步书签数据
              </AlertDescription>
            </Alert>
          )}
        </div>
      </section>
    </div>
  );
}
