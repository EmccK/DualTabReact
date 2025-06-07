/**
 * 图标管理面板
 * 提供图标缓存管理、质量检测、批量优化等功能
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  RefreshCw, 
  Trash2, 
  Download, 
  CheckCircle, 
  Clock,
  BarChart3,
  Settings
} from 'lucide-react';
import { getIconCacheStats, clearIconCache, preloadBookmarkIcons } from '@/utils/icon-utils';
import { iconQualityDetector } from '@/utils/icon-quality-detector';
import type { Bookmark } from '@/types';

interface IconManagementPanelProps {
  bookmarks: Bookmark[];
  onRefreshBookmarks?: () => void;
}

interface CacheStats {
  totalEntries: number;
  totalSize: number;
  hitRate: number;
  oldestEntry: number;
  newestEntry: number;
}

interface QualityStats {
  totalChecked: number;
  highQuality: number;
  mediumQuality: number;
  lowQuality: number;
  failed: number;
}

const IconManagementPanel: React.FC<IconManagementPanelProps> = ({
  bookmarks,
  onRefreshBookmarks
}) => {
  const [cacheStats, setCacheStats] = useState<CacheStats | null>(null);
  const [qualityStats, setQualityStats] = useState<QualityStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isPreloading, setIsPreloading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // 加载缓存统计
  const loadCacheStats = async () => {
    try {
      const stats = await getIconCacheStats();
      setCacheStats(stats);
    } catch (error) {
    }
  };

  // 分析图标质量
  const analyzeIconQuality = async () => {
    setIsAnalyzing(true);
    try {
      const faviconBookmarks = bookmarks.filter(b => 
        b.iconType === 'favicon' || b.iconType === 'official' || !b.iconType
      );

      const icons = faviconBookmarks.map(b => ({
        iconUrl: b.icon || `https://www.google.com/s2/favicons?domain=${new URL(b.url).hostname}&sz=32`,
        originalUrl: b.url
      }));

      const reports = await iconQualityDetector.batchDetect(icons);
      
      const stats: QualityStats = {
        totalChecked: reports.length,
        highQuality: reports.filter(r => r.score >= 80).length,
        mediumQuality: reports.filter(r => r.score >= 60 && r.score < 80).length,
        lowQuality: reports.filter(r => r.score >= 30 && r.score < 60).length,
        failed: reports.filter(r => r.score < 30).length,
      };

      setQualityStats(stats);
    } catch (error) {
    } finally {
      setIsAnalyzing(false);
    }
  };

  // 预加载所有图标
  const preloadAllIcons = async () => {
    setIsPreloading(true);
    try {
      const bookmarkData = bookmarks
        .filter(b => b.iconType === 'favicon' || b.iconType === 'official' || !b.iconType)
        .map(b => ({ url: b.url, title: b.title }));
      
      await preloadBookmarkIcons(bookmarkData);
      await loadCacheStats();
    } catch (error) {
    } finally {
      setIsPreloading(false);
    }
  };

  // 清理缓存
  const handleClearCache = async () => {
    setIsLoading(true);
    try {
      await clearIconCache();
      await loadCacheStats();
      setQualityStats(null);
    } catch (error) {
    } finally {
      setIsLoading(false);
    }
  };

  // 刷新统计
  const refreshStats = async () => {
    setIsLoading(true);
    await loadCacheStats();
    setIsLoading(false);
  };

  // 初始化加载
  useEffect(() => {
    loadCacheStats();
  }, []);

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatHitRate = (rate: number) => {
    return `${(rate * 100).toFixed(1)}%`;
  };

  return (
    <div className="space-y-6">
      {/* 缓存统计 */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            图标缓存统计
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={refreshStats}
            disabled={isLoading}
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </CardHeader>
        <CardContent>
          {cacheStats ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {cacheStats.totalEntries}
                </div>
                <div className="text-sm text-gray-500">缓存条目</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {formatHitRate(cacheStats.hitRate)}
                </div>
                <div className="text-sm text-gray-500">命中率</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {formatFileSize(cacheStats.totalSize)}
                </div>
                <div className="text-sm text-gray-500">缓存大小</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {bookmarks.filter(b => b.iconType === 'favicon' || b.iconType === 'official' || !b.iconType).length}
                </div>
                <div className="text-sm text-gray-500">Favicon书签</div>
              </div>
            </div>
          ) : (
            <div className="text-center text-gray-500">加载中...</div>
          )}
        </CardContent>
      </Card>

      {/* 质量分析 */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5" />
            图标质量分析
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={analyzeIconQuality}
            disabled={isAnalyzing}
          >
            {isAnalyzing ? (
              <Clock className="w-4 h-4 animate-spin" />
            ) : (
              <Settings className="w-4 h-4" />
            )}
            {isAnalyzing ? '分析中...' : '开始分析'}
          </Button>
        </CardHeader>
        <CardContent>
          {qualityStats ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <Badge variant="default" className="bg-green-100 text-green-800">
                    高质量: {qualityStats.highQuality}
                  </Badge>
                </div>
                <div className="text-center">
                  <Badge variant="default" className="bg-yellow-100 text-yellow-800">
                    中等: {qualityStats.mediumQuality}
                  </Badge>
                </div>
                <div className="text-center">
                  <Badge variant="default" className="bg-orange-100 text-orange-800">
                    低质量: {qualityStats.lowQuality}
                  </Badge>
                </div>
                <div className="text-center">
                  <Badge variant="destructive">
                    失败: {qualityStats.failed}
                  </Badge>
                </div>
              </div>
              
              {qualityStats.totalChecked > 0 && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>质量分布</span>
                    <span>{qualityStats.totalChecked} 个图标</span>
                  </div>
                  <Progress 
                    value={(qualityStats.highQuality / qualityStats.totalChecked) * 100} 
                    className="h-2"
                  />
                </div>
              )}
            </div>
          ) : (
            <div className="text-center text-gray-500">
              点击"开始分析"检测图标质量
            </div>
          )}
        </CardContent>
      </Card>

      {/* 操作按钮 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            图标管理操作
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button
              onClick={preloadAllIcons}
              disabled={isPreloading}
              className="flex items-center gap-2"
            >
              {isPreloading ? (
                <Clock className="w-4 h-4 animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              {isPreloading ? '预加载中...' : '预加载所有图标'}
            </Button>

            <Button
              variant="outline"
              onClick={handleClearCache}
              disabled={isLoading}
              className="flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              清理缓存
            </Button>

            <Button
              variant="outline"
              onClick={onRefreshBookmarks}
              className="flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              刷新书签
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default IconManagementPanel;
