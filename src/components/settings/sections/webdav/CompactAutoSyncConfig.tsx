/**
 * 简化版自动同步配置组件
 * 仅显示核心功能，适合空间受限的界面
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  Upload, 
  Download, 
  Zap,
  AlertCircle,
  CheckCircle,
  ChevronDown,
  ChevronUp
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
interface CompactAutoSyncConfigProps {
  className?: string;
}

/**
 * 简化版自动同步配置组件
 */
export function CompactAutoSyncConfig({ className = '' }: CompactAutoSyncConfigProps) {
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
  const [isExpanded, setIsExpanded] = useState(false);

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
        setMessage('已保存');
        setTimeout(() => setMessage(null), 2000);
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
   * 格式化时间
   */
  const formatTime = (timestamp: number): string => {
    if (!timestamp) return '从未';
    
    const now = new Date();
    const date = new Date(timestamp);
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
        <CardContent className="p-3">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900"></div>
            <span className="ml-2 text-xs">加载中...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  const isEnabled = config.enableAutoUpload || config.enableAutoDownload;

  return (
    <Card className={`w-full ${className}`}>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between text-sm">
          <div className="flex items-center space-x-2">
            <Zap className="h-4 w-4" />
            <span>智能同步</span>
            <Badge variant="secondary" className="text-xs px-1 py-0">
              新
            </Badge>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="h-6 w-6 p-0"
          >
            {isExpanded ? 
              <ChevronUp className="h-3 w-3" /> : 
              <ChevronDown className="h-3 w-3" />
            }
          </Button>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-3 pt-0 pb-3">
        {/* 状态提示 */}
        {error && (
          <div className="flex items-center space-x-2 p-2 bg-red-50 border border-red-200 rounded text-xs">
            <AlertCircle className="h-3 w-3 text-red-500 flex-shrink-0" />
            <span className="text-red-700 truncate">{error}</span>
          </div>
        )}

        {message && (
          <div className="flex items-center space-x-2 p-2 bg-green-50 border border-green-200 rounded text-xs">
            <CheckCircle className="h-3 w-3 text-green-500 flex-shrink-0" />
            <span className="text-green-700">{message}</span>
          </div>
        )}

        {/* 基本开关 */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="flex items-center justify-between p-2 border rounded">
            <div className="flex items-center space-x-1">
              <Upload className="h-3 w-3" />
              <span>自动上传</span>
            </div>
            <Switch
              checked={config.enableAutoUpload}
              onCheckedChange={(checked) => updateConfig('enableAutoUpload', checked)}
            />
          </div>

          <div className="flex items-center justify-between p-2 border rounded">
            <div className="flex items-center space-x-1">
              <Download className="h-3 w-3" />
              <span>自动下载</span>
            </div>
            <Switch
              checked={config.enableAutoDownload}
              onCheckedChange={(checked) => updateConfig('enableAutoDownload', checked)}
            />
          </div>
        </div>

        {/* 状态显示 */}
        {isEnabled && (
          <div className="text-xs text-muted-foreground">
            上传: {formatTime(timeRecord.lastUploadTime)} | 
            下载: {formatTime(timeRecord.lastDownloadTime)}
          </div>
        )}

        {/* 展开的详细配置 */}
        {isExpanded && (
          <div className="space-y-3 border-t pt-3">
            {/* 上传延迟配置 */}
            {config.enableAutoUpload && (
              <div className="flex items-center justify-between text-xs">
                <Label>延迟:</Label>
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

            {/* 新标签页下载配置 */}
            {config.enableAutoDownload && (
              <div className="flex items-center justify-between text-xs">
                <Label>新标签页时下载</Label>
                <Switch
                  checked={config.downloadOnTabOpen}
                  onCheckedChange={(checked) => updateConfig('downloadOnTabOpen', checked)}
                />
              </div>
            )}

            {/* 说明文字 */}
            <div className="text-xs text-muted-foreground p-2 bg-blue-50 rounded">
              数据变更后自动上传，新标签页时智能下载（仅当远程数据更新时）
            </div>
          </div>
        )}

        {/* 保存按钮 */}
        <div className="flex justify-end">
          <Button 
            onClick={saveConfig} 
            disabled={isSaving}
            size="sm"
            className="h-6 px-3 text-xs"
          >
            {isSaving ? '保存中...' : '保存'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}