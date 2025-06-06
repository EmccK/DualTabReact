/**
 * 缓存管理组件
 * 处理图片缓存的查看、清理和配置
 */

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  HardDrive, 
  Trash2, 
  RefreshCw, 
  AlertTriangle,
  CheckCircle,
  Loader2,
  BarChart3,
  Settings,
  Zap
} from 'lucide-react';

import { SettingItem } from '../../components/SettingItem';
import { SliderControl } from '../../components/SliderControl';
import { ToggleSwitch } from '../../components/ToggleSwitch';
import { SelectOption } from '../../components/SelectOption';
import { useCacheManager } from '@/hooks/background';

// 清理策略选项
const CLEANUP_STRATEGY_OPTIONS = [
  { value: 'lru', label: 'LRU (最少使用)' },
  { value: 'fifo', label: 'FIFO (先进先出)' },
  { value: 'size', label: '按大小 (大文件优先)' }
];

export function CacheManagement() {
  const {
    settings,
    stats,
    loading,
    operating,
    error,
    updateSettings,
    cleanupCache,
    preloadImages,
    getUsagePercentage,
    formatSize,
    getRecommendedCleanupStrategy,
    categorySummary,
    cacheHealth
  } = useCacheManager();

  const [cleanupStrategy, setCleanupStrategy] = useState<'all' | 'expired' | 'lru' | 'size'>('lru');

  const handleCleanup = async (strategy: typeof cleanupStrategy) => {
    const confirmed = strategy === 'all' 
      ? confirm('确定要清除所有缓存吗？这将删除所有已下载的图片。')
      : confirm(`确定要使用${CLEANUP_STRATEGY_OPTIONS.find(s => s.value === strategy)?.label}策略清理缓存吗？`);
    
    if (!confirmed) return;

    try {
      const result = await cleanupCache(strategy);
      if (result.success) {
        alert(`清理完成！清理了 ${result.data?.cleanedCount || 0} 个文件，释放了 ${result.data?.freedSpace || 0} MB 空间。`);
      } else {
        alert(`清理失败: ${result.message}`);
      }
    } catch {
      alert('清理操作失败，请重试');
    }
  };

  const handlePreload = async () => {
    try {
      const result = await preloadImages();
      if (result.success) {
        alert('预加载完成！');
      } else {
        alert(`预加载失败: ${result.message}`);
      }
    } catch {
      alert('预加载操作失败，请重试');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
        <span className="ml-2 text-gray-600">加载缓存信息中...</span>
      </div>
    );
  }

  const usagePercentage = getUsagePercentage();
  const recommendedStrategy = getRecommendedCleanupStrategy();

  return (
    <div className="space-y-4">
      {/* 缓存状态概览 */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <HardDrive className="w-4 h-4 text-indigo-600" />
            缓存状态概览
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* 缓存使用情况 */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">存储空间使用</span>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">
                  {formatSize(stats?.currentSizeInMB || 0)} / {formatSize(settings?.maxSizeInMB || 50)}
                </span>
                <Badge 
                  variant={cacheHealth.status === 'good' ? 'default' : 
                          cacheHealth.status === 'warning' ? 'secondary' : 'destructive'}
                  className="text-xs"
                >
                  {usagePercentage}%
                </Badge>
              </div>
            </div>
            <Progress value={usagePercentage} className="h-2" />
            <p className="text-xs text-gray-500 flex items-center gap-1">
              {cacheHealth.status === 'good' && <CheckCircle className="w-3 h-3 text-green-500" />}
              {cacheHealth.status === 'warning' && <AlertTriangle className="w-3 h-3 text-yellow-500" />}
              {cacheHealth.status === 'danger' && <AlertTriangle className="w-3 h-3 text-red-500" />}
              {cacheHealth.message}
            </p>
          </div>

          {/* 文件统计 */}
          <div className="grid grid-cols-2 gap-4 text-center">
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="text-lg font-semibold text-gray-800">{stats?.fileCount || 0}</div>
              <div className="text-xs text-gray-500">缓存文件数</div>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="text-lg font-semibold text-gray-800">
                {stats?.hitRate ? `${Math.round(stats.hitRate)}%` : 'N/A'}
              </div>
              <div className="text-xs text-gray-500">缓存命中率</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 分类统计 */}
      {categorySummary.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-indigo-600" />
              分类统计
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {categorySummary.slice(0, 5).map(({ category, count, size, percentage }) => (
                <div key={category} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">{category}</Badge>
                    <span className="text-gray-600">{count} 张</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500">{formatSize(size)}</span>
                    <span className="text-xs text-gray-400">({percentage}%)</span>
                  </div>
                </div>
              ))}
              {categorySummary.length > 5 && (
                <p className="text-xs text-gray-500 text-center pt-2">
                  还有 {categorySummary.length - 5} 个分类...
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 缓存设置 */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Settings className="w-4 h-4 text-indigo-600" />
            缓存设置
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* 最大缓存大小 */}
          <SettingItem
            label="最大缓存大小"
            description="限制图片缓存占用的存储空间"
          >
            <SliderControl
              value={settings?.maxSizeInMB || 50}
              onChange={(value) => updateSettings({ maxSizeInMB: value })}
              min={10}
              max={500}
              step={10}
              suffix="MB"
              className="w-32"
            />
          </SettingItem>

          {/* 缓存过期时间 */}
          <SettingItem
            label="缓存过期时间"
            description="图片缓存的保留天数"
          >
            <SliderControl
              value={settings?.expirationDays || 30}
              onChange={(days) => updateSettings({ expirationDays: days })}
              min={7}
              max={90}
              step={7}
              suffix="天"
              className="w-32"
            />
          </SettingItem>

          {/* 自动清理设置 */}
          <SettingItem
            label="自动清理"
            description="当缓存空间不足时自动清理旧文件"
          >
            <ToggleSwitch
              checked={settings?.autoCleanup.enabled || false}
              onCheckedChange={(enabled) => updateSettings({ 
                autoCleanup: { ...settings?.autoCleanup, enabled } 
              })}
            />
          </SettingItem>

          {/* 自动清理阈值 */}
          {settings?.autoCleanup.enabled && (
            <SettingItem
              label="清理触发阈值"
              description="缓存使用率达到此百分比时触发自动清理"
            >
              <SliderControl
                value={settings?.autoCleanup.threshold || 80}
                onChange={(threshold) => updateSettings({ 
                  autoCleanup: { ...settings?.autoCleanup, threshold } 
                })}
                min={50}
                max={95}
                step={5}
                suffix="%"
                className="w-32"
              />
            </SettingItem>
          )}

          {/* 自动清理策略 */}
          {settings?.autoCleanup.enabled && (
            <SettingItem
              label="清理策略"
              description="自动清理时使用的策略"
            >
              <SelectOption
                value={settings?.autoCleanup.strategy || 'lru'}
                onValueChange={(strategy) => updateSettings({ 
                  autoCleanup: { ...settings?.autoCleanup, strategy } 
                })}
                options={CLEANUP_STRATEGY_OPTIONS}
                className="w-48"
              />
            </SettingItem>
          )}
        </CardContent>
      </Card>

      {/* 缓存操作 */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Zap className="w-4 h-4 text-indigo-600" />
            缓存操作
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* 清理操作 */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <SelectOption
                value={cleanupStrategy}
                onValueChange={setCleanupStrategy}
                options={[
                  { value: 'expired', label: '清理过期缓存' },
                  { value: 'lru', label: 'LRU清理 (推荐)' },
                  { value: 'size', label: '按大小清理' },
                  { value: 'all', label: '清除所有缓存' }
                ]}
                className="flex-1"
              />
              <Button
                onClick={() => handleCleanup(cleanupStrategy)}
                disabled={operating}
                variant={cleanupStrategy === 'all' ? 'destructive' : 'default'}
                className="px-6"
              >
                {operating ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
                {operating ? '清理中...' : '执行清理'}
              </Button>
            </div>
            
            {recommendedStrategy !== cleanupStrategy && (
              <p className="text-xs text-orange-600 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" />
                建议使用 "{CLEANUP_STRATEGY_OPTIONS.find(s => s.value === recommendedStrategy)?.label}" 策略
              </p>
            )}
          </div>

          {/* 预加载操作 */}
          <div className="pt-2 border-t">
            <Button
              onClick={handlePreload}
              disabled={operating || !settings?.preload.enabled}
              variant="outline"
              className="w-full"
            >
              {operating ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4 mr-2" />
              )}
              {operating ? '预加载中...' : '预加载热门图片'}
            </Button>
            {!settings?.preload.enabled && (
              <p className="text-xs text-gray-500 text-center mt-1">
                预加载功能未启用
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 错误信息 */}
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* 使用提示 */}
      <Card className="bg-purple-50 border-purple-200">
        <CardContent className="p-4">
          <div className="flex items-start gap-2">
            <div className="text-purple-600 mt-0.5">💡</div>
            <div className="text-sm text-purple-800">
              <p className="font-medium mb-2">缓存管理小贴士：</p>
              <ul className="text-xs space-y-1 text-purple-700">
                <li>• <strong>LRU策略</strong>：删除最少使用的文件，保留常用图片</li>
                <li>• <strong>按大小清理</strong>：优先删除大文件，快速释放空间</li>
                <li>• <strong>自动清理</strong>：建议开启，避免手动管理缓存空间</li>
                <li>• <strong>合理设置</strong>：缓存大小建议设置为50-200MB</li>
                <li>• <strong>定期清理</strong>：过期缓存会自动清理，无需担心</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
