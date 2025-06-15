/**
 * 冲突解决对话框组件
 * 当检测到数据冲突时，让用户选择解决策略
 */

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { Separator } from '../ui/separator';
import { Alert } from '../ui/alert';
import { useWebDAVSync } from '../../hooks/webdav';
import { ConflictResolution, ConflictInfo } from '../../services/webdav/types';

/**
 * 组件属性
 */
interface ConflictDialogProps {
  isOpen: boolean;
  onClose: () => void;
  conflictInfo?: ConflictInfo;
  onResolve?: (resolution: ConflictResolution) => void;
}

/**
 * 冲突类型的图标和描述
 */
const CONFLICT_TYPE_INFO = {
  data_conflict: {
    icon: '⚠️',
    title: '数据冲突',
    description: '本地数据与远程数据存在差异',
  },
  timestamp_conflict: {
    icon: '🕐',
    title: '时间戳冲突',
    description: '数据修改时间存在异常',
  },
  hash_mismatch: {
    icon: '🔍',
    title: '数据完整性错误',
    description: '数据完整性校验失败',
  },
};

/**
 * 解决策略选项
 */
const RESOLUTION_OPTIONS = [
  {
    value: 'use_local' as ConflictResolution,
    title: '使用本地数据',
    description: '保留本地的书签和设置，覆盖远程数据',
    icon: '💾',
    pros: ['保留当前的所有更改', '不会丢失本地数据'],
    cons: ['远程设备的更改将丢失'],
  },
  {
    value: 'use_remote' as ConflictResolution,
    title: '使用远程数据',
    description: '下载远程的书签和设置，覆盖本地数据',
    icon: '☁️',
    pros: ['获取其他设备的最新更改', '确保数据一致性'],
    cons: ['本地未同步的更改将丢失'],
  },
  {
    value: 'merge' as ConflictResolution,
    title: '自动合并',
    description: '尝试自动合并本地和远程数据',
    icon: '🔄',
    pros: ['保留两边的数据', '不会丢失书签'],
    cons: ['可能产生重复书签', '合并结果需要检查'],
  },
  {
    value: 'manual' as ConflictResolution,
    title: '稍后处理',
    description: '暂时跳过冲突，稍后手动处理',
    icon: '⏸️',
    pros: ['有时间仔细考虑', '可以备份数据'],
    cons: ['同步功能暂停', '需要手动解决'],
  },
];

/**
 * 获取数据统计信息
 */
function getDataStats(data: unknown) {
  return {
    categoriesCount: data?.categories?.length || 0,
    bookmarksCount: data?.bookmarks?.length || 0,
    hasSettings: !!(data?.settings && Object.keys(data.settings).length > 0),
  };
}

/**
 * 数据预览组件
 */
function DataPreview({ 
  title, 
  data, 
  timestamp, 
  isLocal = false 
}: { 
  title: string; 
  data: unknown;
  timestamp: number; 
  isLocal?: boolean; 
}) {
  const stats = getDataStats(data);
  
  return (
    <Card className="p-4">
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="font-medium flex items-center space-x-2">
            <span>{isLocal ? '💾' : '☁️'}</span>
            <span>{title}</span>
          </h4>
          <Badge variant="outline">
            {new Date(timestamp).toLocaleString()}
          </Badge>
        </div>
        
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div className="text-center">
            <div className="font-semibold text-lg">{stats.categoriesCount}</div>
            <div className="text-gray-600 dark:text-gray-400">分类</div>
          </div>
          <div className="text-center">
            <div className="font-semibold text-lg">{stats.bookmarksCount}</div>
            <div className="text-gray-600 dark:text-gray-400">书签</div>
          </div>
          <div className="text-center">
            <div className="font-semibold text-lg">{stats.hasSettings ? '✓' : '✗'}</div>
            <div className="text-gray-600 dark:text-gray-400">设置</div>
          </div>
        </div>
      </div>
    </Card>
  );
}

/**
 * 解决策略选项组件
 */
function ResolutionOption({ 
  option, 
  isSelected, 
  onSelect 
}: { 
  option: typeof RESOLUTION_OPTIONS[0]; 
  isSelected: boolean; 
  onSelect: () => void; 
}) {
  return (
    <Card 
      className={`p-4 cursor-pointer transition-all ${
        isSelected 
          ? 'ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-900/20' 
          : 'hover:bg-gray-50 dark:hover:bg-gray-800'
      }`}
      onClick={onSelect}
    >
      <div className="space-y-3">
        <div className="flex items-center space-x-3">
          <span className="text-2xl">{option.icon}</span>
          <div className="flex-1">
            <h4 className="font-medium">{option.title}</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {option.description}
            </p>
          </div>
          <div className={`w-4 h-4 rounded-full border-2 ${
            isSelected 
              ? 'bg-blue-500 border-blue-500' 
              : 'border-gray-300 dark:border-gray-600'
          }`}>
            {isSelected && <div className="w-2 h-2 bg-white rounded-full m-0.5" />}
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div>
            <div className="font-medium text-green-700 dark:text-green-400 mb-1">优点:</div>
            <ul className="space-y-0.5">
              {option.pros.map((pro, index) => (
                <li key={index} className="flex items-start space-x-1">
                  <span className="text-green-500">•</span>
                  <span>{pro}</span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <div className="font-medium text-orange-700 dark:text-orange-400 mb-1">注意:</div>
            <ul className="space-y-0.5">
              {option.cons.map((con, index) => (
                <li key={index} className="flex items-start space-x-1">
                  <span className="text-orange-500">•</span>
                  <span>{con}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </Card>
  );
}

/**
 * 冲突解决对话框
 */
export function ConflictDialog({ 
  isOpen, 
  onClose, 
  conflictInfo,
  onResolve 
}: ConflictDialogProps) {
  const [state, actions] = useWebDAVSync();
  const [selectedResolution, setSelectedResolution] = useState<ConflictResolution>('manual');
  const [isResolving, setIsResolving] = useState(false);

  // 从状态中获取冲突信息
  const conflict = conflictInfo || (state.hasConflict ? 
    // 这里应该从存储中加载冲突信息，暂时使用模拟数据
    undefined : undefined);

  useEffect(() => {
    if (isOpen && !conflict) {
      // 如果打开对话框但没有冲突信息，关闭对话框
      onClose();
    }
  }, [isOpen, conflict, onClose]);

  /**
   * 处理解决冲突
   */
  const handleResolve = async () => {
    if (!conflict) return;

    setIsResolving(true);
    try {
      const success = await actions.resolveConflict(selectedResolution);
      if (success) {
        if (onResolve) {
          onResolve(selectedResolution);
        }
        onClose();
      }
    } catch {
      console.error('解决冲突失败');
    } finally {
      setIsResolving(false);
    }
  };

  if (!conflict) {
    return null;
  }

  const conflictTypeInfo = CONFLICT_TYPE_INFO[conflict.type];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <span>{conflictTypeInfo.icon}</span>
            <span>{conflictTypeInfo.title}</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* 冲突描述 */}
          <Alert>
            <div className="space-y-2">
              <p className="font-medium">{conflictTypeInfo.description}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                检测到本地数据与远程数据存在冲突，请选择如何处理这个冲突。
              </p>
            </div>
          </Alert>

          {/* 数据对比 */}
          <div className="space-y-4">
            <h3 className="font-medium">数据对比</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <DataPreview
                title="本地数据"
                data={conflict.localData}
                timestamp={conflict.localTimestamp}
                isLocal={true}
              />
              <DataPreview
                title="远程数据"
                data={conflict.remoteData}
                timestamp={conflict.remoteTimestamp}
                isLocal={false}
              />
            </div>
          </div>

          <Separator />

          {/* 解决策略选择 */}
          <div className="space-y-4">
            <h3 className="font-medium">选择解决策略</h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {RESOLUTION_OPTIONS.map((option) => (
                <ResolutionOption
                  key={option.value}
                  option={option}
                  isSelected={selectedResolution === option.value}
                  onSelect={() => setSelectedResolution(option.value)}
                />
              ))}
            </div>
          </div>

          {/* 推荐策略 */}
          {conflict.type === 'data_conflict' && (
            <Alert>
              <div className="flex items-start space-x-2">
                <span>💡</span>
                <div>
                  <p className="font-medium">推荐策略</p>
                  <p className="text-sm">
                    对于数据冲突，建议选择"自动合并"来保留两边的书签数据，
                    然后检查合并结果并删除重复的书签。
                  </p>
                </div>
              </div>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isResolving}>
            取消
          </Button>
          <Button 
            onClick={handleResolve} 
            disabled={isResolving}
            className="min-w-[100px]"
          >
            {isResolving ? '处理中...' : '解决冲突'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/**
 * 冲突解决提示组件（用于在页面上显示简单的冲突提示）
 */
export function ConflictBanner({ 
  onShowDialog 
}: { 
  onShowDialog: () => void 
}) {
  const [state] = useWebDAVSync();

  if (!state.hasConflict) {
    return null;
  }

  return (
    <Alert variant="destructive" className="mb-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <span>⚠️</span>
          <div>
            <p className="font-medium">检测到数据冲突</p>
            <p className="text-sm">需要选择如何处理本地和远程数据的差异</p>
          </div>
        </div>
        <Button size="sm" variant="outline" onClick={onShowDialog}>
          解决冲突
        </Button>
      </div>
    </Alert>
  );
}