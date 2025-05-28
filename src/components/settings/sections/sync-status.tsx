/**
 * WebDAV同步状态组件
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Badge } from '../../ui/badge';
import { Button } from '../../ui/button';
import { Progress } from '../../ui/progress';
import { Alert, AlertDescription } from '../../ui/alert';
import {
  RefreshCw,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Play,
  Pause,
  RotateCcw,
  History,
} from 'lucide-react';
import type { 
  SyncProgress, 
  SyncHistory, 
  SyncConflict, 
  SyncStatus 
} from '../../../types/webdav';

interface SyncStatusProps {
  progress: SyncProgress | null;
  history: SyncHistory[];
  conflicts: SyncConflict[];
  isAutoSyncEnabled: boolean;
  onManualSync: () => void;
  onToggleAutoSync: () => void;
  onResolveConflict: (index: number, resolution: 'local' | 'remote' | 'skip') => void;
}

export function SyncStatus({
  progress,
  history,
  conflicts,
  isAutoSyncEnabled,
  onManualSync,
  onToggleAutoSync,
  onResolveConflict,
}: SyncStatusProps) {
  // 获取状态图标和颜色
  const getStatusInfo = (status: SyncStatus) => {
    switch (status) {
      case 'idle':
        return { icon: Clock, color: 'text-gray-500', bg: 'bg-gray-100' };
      case 'syncing':
        return { icon: RefreshCw, color: 'text-blue-500', bg: 'bg-blue-100' };
      case 'success':
        return { icon: CheckCircle, color: 'text-green-500', bg: 'bg-green-100' };
      case 'error':
        return { icon: XCircle, color: 'text-red-500', bg: 'bg-red-100' };
      case 'conflict':
        return { icon: AlertTriangle, color: 'text-yellow-500', bg: 'bg-yellow-100' };
      default:
        return { icon: Clock, color: 'text-gray-500', bg: 'bg-gray-100' };
    }
  };

  // 格式化状态文本
  const getStatusText = (status: SyncStatus) => {
    switch (status) {
      case 'idle': return '空闲';
      case 'syncing': return '同步中';
      case 'success': return '成功';
      case 'error': return '错误';
      case 'conflict': return '冲突';
      default: return '未知';
    }
  };

  const currentStatus = progress?.status || 'idle';
  const statusInfo = getStatusInfo(currentStatus);
  const StatusIcon = statusInfo.icon;

  return (
    <div className="space-y-6">
      {/* 当前同步状态 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <StatusIcon className={`h-5 w-5 ${statusInfo.color}`} />
            同步状态
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* 状态信息 */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className={statusInfo.bg}>
                {getStatusText(currentStatus)}
              </Badge>
              {progress?.current && (
                <span className="text-sm text-gray-600">
                  正在处理: {progress.current}
                </span>
              )}
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={onToggleAutoSync}
              >
                {isAutoSyncEnabled ? (
                  <>
                    <Pause className="h-4 w-4 mr-1" />
                    暂停自动同步
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 mr-1" />
                    启用自动同步
                  </>
                )}
              </Button>
              <Button
                size="sm"
                onClick={onManualSync}
                disabled={currentStatus === 'syncing'}
              >
                <RotateCcw className="h-4 w-4 mr-1" />
                手动同步
              </Button>
            </div>
          </div>

          {/* 同步进度 */}
          {progress && currentStatus === 'syncing' && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>进度</span>
                <span>{progress.completed} / {progress.total}</span>
              </div>
              <Progress 
                value={(progress.completed / progress.total) * 100} 
                className="h-2"
              />
              {progress.estimatedTime && (
                <p className="text-xs text-gray-500">
                  预计剩余时间: {Math.round(progress.estimatedTime / 1000)}秒
                </p>
              )}
            </div>
          )}

          {/* 错误信息 */}
          {progress?.error && (
            <Alert className="border-red-200 bg-red-50">
              <XCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">
                {progress.error}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* 冲突处理 */}
      {conflicts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              同步冲突
              <Badge variant="destructive">{conflicts.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {conflicts.map((conflict, index) => (
              <div key={index} className="border rounded-lg p-3 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{conflict.item.name}</p>
                    <p className="text-sm text-gray-600">
                      冲突类型: {conflict.type === 'modified' ? '同时修改' : conflict.type}
                    </p>
                  </div>
                  <Badge variant="outline" className="text-yellow-600">
                    需要处理
                  </Badge>
                </div>
                
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onResolveConflict(index, 'local')}
                  >
                    使用本地
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onResolveConflict(index, 'remote')}
                  >
                    使用远程
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => onResolveConflict(index, 'skip')}
                  >
                    跳过
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* 同步历史 */}
      {history.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              同步历史
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {history.slice(0, 5).map((record) => {
                const recordStatusInfo = getStatusInfo(record.status);
                const RecordIcon = recordStatusInfo.icon;
                
                return (
                  <div key={record.id} className="flex items-center justify-between p-2 border rounded">
                    <div className="flex items-center gap-3">
                      <RecordIcon className={`h-4 w-4 ${recordStatusInfo.color}`} />
                      <div>
                        <p className="text-sm font-medium">
                          {new Date(record.timestamp).toLocaleString()}
                        </p>
                        <p className="text-xs text-gray-600">
                          {record.itemCount} 项目 · 耗时 {Math.round(record.duration / 1000)}秒
                          {record.conflictCount ? ` · ${record.conflictCount} 个冲突` : ''}
                        </p>
                      </div>
                    </div>
                    <Badge 
                      variant={record.status === 'success' ? 'default' : 'destructive'}
                      className="text-xs"
                    >
                      {getStatusText(record.status)}
                    </Badge>
                  </div>
                );
              })}
            </div>
            
            {history.length > 5 && (
              <p className="text-xs text-gray-500 mt-3 text-center">
                显示最近 5 条记录，共 {history.length} 条
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* 空状态 */}
      {history.length === 0 && !progress && (
        <Card>
          <CardContent className="text-center py-8">
            <RefreshCw className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 mb-2">暂无同步记录</p>
            <p className="text-sm text-gray-400">
              点击"手动同步"开始第一次数据同步
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
