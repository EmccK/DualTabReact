/**
 * 自动同步配置组件
 * 提供新的自动同步逻辑的配置界面
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Upload, 
  Download, 
  Clock, 
  Zap, 
  Settings,
  Info,
  AlertCircle,
  CheckCircle
} from 'lucide-react';

/**
 * 自动同步配置
 */
interface AutoSyncConfig {
  enableAutoUpload: boolean;
  enableAutoDownload: boolean;
  uploadDelay: number;
  downloadOnTabOpen: boolean;
}

/**
 * 时间记录
 */
interface TimeRecord {
  lastDataChangeTime: number;
  lastUploadTime: number;
  lastDownloadTime: number;
  deviceId: string;
}

/**
 * 组件属性
 */
interface AutoSyncConfigProps {
  className?: string;
}

/**
 * 自动同步配置组件
 */
export function AutoSyncConfig({ className = '' }: AutoSyncConfigProps) {
  const [config, setConfig] = useState<AutoSyncConfig>({
    enableAutoUpload: true,
    enableAutoDownload: true,
    uploadDelay: 2000,
    downloadOnTabOpen: true,
  });
  
  const [timeRecord, setTimeRecord] = useState<TimeRecord>({
    lastDataChangeTime: 0,
    lastUploadTime: 0,
    lastDownloadTime: 0,
    deviceId: '',
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);

  /**
   * 加载配置
   */
  const loadConfig = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await chrome.runtime.sendMessage({
        action: 'webdav_get_auto_sync_config',
      });

      if (response && response.success) {
        const { config: loadedConfig, timeRecord: loadedTimeRecord } = response.config;
        
        if (loadedConfig) {
          setConfig(loadedConfig);
        }
        
        if (loadedTimeRecord) {
          setTimeRecord(loadedTimeRecord);
        }
      } else {
        throw new Error(response?.error || 'Failed to load config');
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to load config');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * 保存配置
   */
  const saveConfig = async () => {
    try {
      setIsSaving(true);
      setError(null);
      setMessage(null);

      const response = await chrome.runtime.sendMessage({
        action: 'webdav_update_auto_sync_config',
        config,
      });

      if (response && response.success) {
        setMessage('配置已保存');
        setTimeout(() => setMessage(null), 3000);
      } else {
        throw new Error(response?.error || 'Failed to save config');
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to save config');
    } finally {
      setIsSaving(false);
    }
  };

  /**
   * 测试自动同步
   */
  const testAutoSync = async (eventType: 'data_changed' | 'tab_opened') => {
    try {
      const response = await chrome.runtime.sendMessage({
        action: 'webdav_trigger_auto_sync',
        eventType,
      });

      if (response && response.success) {
        setMessage(`${eventType === 'data_changed' ? '数据变更' : '新标签页'}事件已触发`);
        setTimeout(() => setMessage(null), 3000);
        
        // 刷新时间记录
        setTimeout(() => loadConfig(), 1000);
      } else {
        throw new Error(response?.error || 'Failed to trigger auto sync');
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to trigger auto sync');
    }
  };

  /**
   * 格式化时间
   */
  const formatTime = (timestamp: number): string => {
    if (!timestamp) return '从未';
    
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    
    if (diffMins < 1) return '刚刚';
    if (diffMins < 60) return `${diffMins}分钟前`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}小时前`;
    
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}天前`;
  };

  /**
   * 更新配置项
   */
  const updateConfig = (key: keyof AutoSyncConfig, value: any) => {
    setConfig(prev => ({
      ...prev,
      [key]: value,
    }));
  };

  // 初始化
  useEffect(() => {
    loadConfig();
  }, []);

  if (isLoading) {
    return (
      <Card className={`w-full ${className}`}>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Zap className="h-5 w-5" />
            <span>智能自动同步</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900"></div>
            <span className="ml-2">加载配置中...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`w-full ${className}`}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-sm">
          <div className="flex items-center space-x-2">
            <Zap className="h-4 w-4" />
            <span>智能自动同步</span>
            <Badge variant="secondary" className="text-xs px-1.5 py-0.5">
              新版本
            </Badge>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="h-6 px-2 text-xs"
          >
            {showAdvanced ? '收起' : '详情'}
          </Button>
        </CardTitle>
        {showAdvanced && (
          <p className="text-xs text-muted-foreground mt-1">
            自动同步：A设备数据变更后自动上传，B设备打开新标签页时自动下载最新数据
          </p>
        )}
      </CardHeader>
      
      <CardContent className="space-y-4 pt-0">
        {/* 错误和成功提示 */}
        {error && (
          <div className="flex items-center space-x-2 p-2 bg-red-50 border border-red-200 rounded text-xs">
            <AlertCircle className="h-3 w-3 text-red-500 flex-shrink-0" />
            <span className="text-red-700">{error}</span>
          </div>
        )}

        {message && (
          <div className="flex items-center space-x-2 p-2 bg-green-50 border border-green-200 rounded text-xs">
            <CheckCircle className="h-3 w-3 text-green-500 flex-shrink-0" />
            <span className="text-green-700">{message}</span>
          </div>
        )}

        {/* 基本配置 - 网格布局 */}
        <div className="space-y-3 text-xs">
          {/* 自动上传 */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="flex items-center space-x-1.5">
                <Upload className="h-3 w-3" />
                <span>自动上传</span>
              </Label>
              <Switch
                checked={config.enableAutoUpload}
                onCheckedChange={(checked) => updateConfig('enableAutoUpload', checked)}
              />
            </div>
            {config.enableAutoUpload && (
              <div className="flex items-center justify-between px-1">
                <span className="text-muted-foreground text-xs">上传延迟</span>
                <div className="flex items-center space-x-1">
                  <Input
                    type="number"
                    min="500"
                    max="10000"
                    step="500"
                    value={config.uploadDelay}
                    onChange={(e) => updateConfig('uploadDelay', parseInt(e.target.value) || 2000)}
                    className="w-24 h-5 text-xs"
                  />
                  <span className="text-muted-foreground text-xs">ms</span>
                </div>
              </div>
            )}
          </div>

          {/* 自动下载 */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="flex items-center space-x-1.5">
                <Download className="h-3 w-3" />
                <span>自动下载</span>
              </Label>
              <Switch
                checked={config.enableAutoDownload}
                onCheckedChange={(checked) => updateConfig('enableAutoDownload', checked)}
              />
            </div>
            {config.enableAutoDownload && (
              <div className="flex items-center justify-between px-1">
                <span className="text-muted-foreground text-xs">新标签页触发</span>
                <Switch
                  checked={config.downloadOnTabOpen}
                  onCheckedChange={(checked) => updateConfig('downloadOnTabOpen', checked)}
                />
              </div>
            )}
          </div>
        </div>

        {/* 高级信息 - 可折叠 */}
        {showAdvanced && (
          <>
            <Separator />
            
            {/* 同步逻辑说明 */}
            <div className="p-3 bg-blue-50 border border-blue-200 rounded text-xs">
              <div className="flex items-start space-x-2">
                <Info className="h-3 w-3 text-blue-500 mt-0.5 flex-shrink-0" />
                <div className="text-blue-700">
                  <p className="font-medium mb-1">同步逻辑：</p>
                  <div className="space-y-0.5">
                    <div>• A设备数据变更后自动上传</div>
                    <div>• B设备打开新标签页时自动下载最新数据</div>
                    <div>• 确保多设备数据实时同步</div>
                  </div>
                </div>
              </div>
            </div>

            {/* 时间记录 - 紧凑显示 */}
            <div className="space-y-2">
              <Label className="flex items-center space-x-1.5 text-xs">
                <Clock className="h-3 w-3" />
                <span>同步记录</span>
              </Label>
              
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div className="p-2 bg-gray-50 rounded">
                  <div className="font-medium text-gray-700">数据变更</div>
                  <div className="text-gray-600">{formatTime(timeRecord.lastDataChangeTime)}</div>
                </div>
                
                <div className="p-2 bg-gray-50 rounded">
                  <div className="font-medium text-gray-700">最后上传</div>
                  <div className="text-gray-600">{formatTime(timeRecord.lastUploadTime)}</div>
                </div>
                
                <div className="p-2 bg-gray-50 rounded">
                  <div className="font-medium text-gray-700">最后下载</div>
                  <div className="text-gray-600">{formatTime(timeRecord.lastDownloadTime)}</div>
                </div>
              </div>
            </div>

            {/* 测试和操作按钮 */}
            <div className="flex flex-wrap gap-1.5">
              <Button
                size="sm"
                variant="outline"
                onClick={() => testAutoSync('data_changed')}
                className="text-xs h-7 px-2"
              >
                <Upload className="h-3 w-3 mr-1" />
                测试上传
              </Button>
              
              <Button
                size="sm"
                variant="outline"
                onClick={() => testAutoSync('tab_opened')}
                className="text-xs h-7 px-2"
              >
                <Download className="h-3 w-3 mr-1" />
                测试下载
              </Button>
              
              <Button
                size="sm"
                variant="outline"
                onClick={loadConfig}
                className="text-xs h-7 px-2"
              >
                <Settings className="h-3 w-3 mr-1" />
                刷新
              </Button>
            </div>
          </>
        )}

        {/* 保存按钮 */}
        <div className="flex justify-end pt-2">
          <Button 
            onClick={saveConfig} 
            disabled={isSaving}
            size="sm"
            className="h-7 px-3 text-xs"
          >
            {isSaving ? (
              <>
                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-1"></div>
                保存中
              </>
            ) : (
              '保存配置'
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}