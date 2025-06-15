/**
 * 同步状态显示组件
 * 显示WebDAV同步的实时状态和历史记录
 */

import React from 'react';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Progress } from '../ui/progress';
import { useWebDAVSync, useSyncStatusListener } from '../../hooks/webdav';

/**
 * 组件属性
 */
interface SyncStatusProps {
  className?: string;
  showActions?: boolean;
  showDetails?: boolean;
  compact?: boolean;
}

/**
 * 同步状态图标映射
 */
const STATUS_ICONS = {
  idle: '⭕',
  syncing: '🔄',
  success: '✅',
  error: '❌',
  conflict: '⚠️',
};

/**
 * 同步状态颜色映射
 */
const STATUS_COLORS = {
  idle: 'secondary',
  syncing: 'default',
  success: 'default',
  error: 'destructive',
  conflict: 'destructive',
} as const;

/**
 * 格式化时间
 */
function formatTime(timestamp: number): string {
  if (!timestamp) return '从未';
  
  const now = Date.now();
  const diff = now - timestamp;
  
  if (diff < 60000) return '刚刚';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`;
  
  return new Date(timestamp).toLocaleString();
}


/**
 * 紧凑版同步状态组件
 */
export function CompactSyncStatus({ className }: { className?: string }) {
  const [state] = useWebDAVSync({
    autoLoadConfig: true,
    autoRefreshStatus: true,
    refreshInterval: 10000,
  });

  if (!state.isConfigured) {
    return null;
  }

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <div className="flex items-center space-x-1">
        <span className="text-sm">{STATUS_ICONS[state.syncStatus]}</span>
        <Badge variant={STATUS_COLORS[state.syncStatus]} className="text-xs">
          {state.syncStatus === 'idle' && '空闲'}
          {state.syncStatus === 'syncing' && '同步中'}
          {state.syncStatus === 'success' && '已同步'}
          {state.syncStatus === 'error' && '失败'}
          {state.syncStatus === 'conflict' && '冲突'}
        </Badge>
      </div>
      
      {state.lastSyncTime > 0 && (
        <span className="text-xs text-gray-500">
          {formatTime(state.lastSyncTime)}
        </span>
      )}
      
      {state.isLoading && (
        <div className="w-4 h-4 border-2 border-blue-200 border-t-blue-500 rounded-full animate-spin" />
      )}
    </div>
  );
}

/**
 * 主要同步状态组件
 */
export function SyncStatus({ 
  className, 
  showActions = true, 
  showDetails = true,
  compact = false 
}: SyncStatusProps) {
  const [state, actions] = useWebDAVSync({
    autoLoadConfig: true,
    autoRefreshStatus: true,
    refreshInterval: 10000,
  });

  const { syncStatus: realtimeStatus } = useSyncStatusListener();

  // 如果是紧凑模式，使用紧凑组件
  if (compact) {
    return <CompactSyncStatus className={className} />;
  }

  // 如果未配置WebDAV，显示提示
  if (!state.isConfigured) {
    return (
      <Card className={`p-4 ${className}`}>
        <div className="text-center">
          <div className="text-gray-400 mb-2">🔗</div>
          <h3 className="font-medium mb-1">未配置WebDAV同步</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            在设置中配置WebDAV服务器以启用数据同步
          </p>
        </div>
      </Card>
    );
  }

  return (
    <Card className={`p-6 ${className}`}>
      <div className="space-y-4">
        {/* 状态标题 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <span className="text-2xl">{STATUS_ICONS[state.syncStatus]}</span>
            <div>
              <h3 className="font-medium">WebDAV同步</h3>
              <div className="flex items-center space-x-2">
                <Badge variant={STATUS_COLORS[state.syncStatus]}>
                  {state.syncStatus === 'idle' && '空闲'}
                  {state.syncStatus === 'syncing' && '同步中'}
                  {state.syncStatus === 'success' && '同步成功'}
                  {state.syncStatus === 'error' && '同步失败'}
                  {state.syncStatus === 'conflict' && '存在冲突'}
                </Badge>
                {state.isLoading && (
                  <div className="w-4 h-4 border-2 border-blue-200 border-t-blue-500 rounded-full animate-spin" />
                )}
              </div>
            </div>
          </div>

          {/* 连接状态 */}
          <div className="text-right">
            <div className={`text-sm ${state.isConnected ? 'text-green-600' : 'text-gray-500'}`}>
              {state.isConnected ? '🟢 已连接' : '🔴 未连接'}
            </div>
          </div>
        </div>

        {/* 错误信息 */}
        {state.error && (
          <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
            <p className="text-sm text-red-800 dark:text-red-200">{state.error}</p>
          </div>
        )}

        {/* 成功消息 */}
        {state.message && !state.error && (
          <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md">
            <p className="text-sm text-green-800 dark:text-green-200">{state.message}</p>
          </div>
        )}

        {/* 冲突提示 */}
        {state.hasConflict && (
          <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md">
            <div className="flex items-center justify-between">
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                检测到数据冲突，需要手动解决
              </p>
              <Button size="sm" variant="outline">
                解决冲突
              </Button>
            </div>
          </div>
        )}

        {/* 同步进度 */}
        {state.syncStatus === 'syncing' && realtimeStatus.progress !== undefined && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>同步进度</span>
              <span>{realtimeStatus.progress || 0}%</span>
            </div>
            <Progress value={realtimeStatus.progress || 0} className="w-full" />
            {realtimeStatus.currentStep && (
              <p className="text-xs text-gray-600 dark:text-gray-400">
                {realtimeStatus.currentStep}
              </p>
            )}
          </div>
        )}

        {/* 详细信息 */}
        {showDetails && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600 dark:text-gray-400">最后同步:</span>
                <div className="font-medium">{formatTime(state.lastSyncTime)}</div>
              </div>
              <div>
                <span className="text-gray-600 dark:text-gray-400">服务器:</span>
                <div className="font-medium truncate" title={state.config?.serverUrl}>
                  {state.config?.serverUrl ? new URL(state.config.serverUrl).hostname : '-'}
                </div>
              </div>
              <div>
                <span className="text-gray-600 dark:text-gray-400">用户名:</span>
                <div className="font-medium">{state.config?.username || '-'}</div>
              </div>
              <div>
                <span className="text-gray-600 dark:text-gray-400">自动同步:</span>
                <div className="font-medium">
                  {state.config?.enabled ? `每${state.config.autoSyncInterval}分钟` : '已禁用'}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 操作按钮 */}
        {showActions && (
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={() => actions.sync()}
              disabled={state.isLoading || state.syncStatus === 'syncing'}
              size="sm"
            >
              {state.isLoading ? '同步中...' : '立即同步'}
            </Button>
            
            <Button
              onClick={() => actions.testConnection()}
              disabled={state.isTesting}
              variant="outline"
              size="sm"
            >
              {state.isTesting ? '测试中...' : '测试连接'}
            </Button>
            
            <Button
              onClick={() => actions.refreshStatus()}
              variant="ghost"
              size="sm"
            >
              刷新状态
            </Button>

            {state.hasConflict && (
              <Button
                onClick={() => actions.resolveConflict('manual')}
                variant="destructive"
                size="sm"
              >
                解决冲突
              </Button>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}

/**
 * 同步状态监控器（用于在其他组件中嵌入状态显示）
 */
export function SyncStatusMonitor({ onStatusChange }: { onStatusChange?: (status: unknown) => void }) {
  useWebDAVSync({
    autoLoadConfig: true,
    autoRefreshStatus: true,
    refreshInterval: 30000,
  });

  useSyncStatusListener((status) => {
    if (onStatusChange) {
      onStatusChange(status);
    }
  });

  // 这个组件不渲染任何内容，只是用来监控状态
  return null;
}

/**
 * 同步状态指示器（用于显示在工具栏等位置）
 */
export function SyncStatusIndicator({ className }: { className?: string }) {
  const [state] = useWebDAVSync({
    autoLoadConfig: false,
    autoRefreshStatus: true,
    refreshInterval: 30000,
  });

  if (!state.isConfigured) {
    return null;
  }

  return (
    <div className={`flex items-center space-x-1 ${className}`} title="WebDAV同步状态">
      <span className="text-sm">{STATUS_ICONS[state.syncStatus]}</span>
      {state.isLoading && (
        <div className="w-3 h-3 border border-blue-200 border-t-blue-500 rounded-full animate-spin" />
      )}
    </div>
  );
}