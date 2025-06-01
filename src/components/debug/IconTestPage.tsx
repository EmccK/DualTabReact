/**
 * 图标测试页面
 * 用于测试和验证图标优化效果
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { BookmarkIcon } from '@/components/icon';
import { getFaviconFallbackUrls, getCachedFaviconUrl } from '@/utils/icon-utils';
import { detectUrlIconQuality } from '@/utils/icon-quality-detector';

const IconTestPage: React.FC = () => {
  const [testUrl, setTestUrl] = useState('https://github.com');
  const [fallbackUrls, setFallbackUrls] = useState<string[]>([]);
  const [bestUrl, setBestUrl] = useState<string | null>(null);
  const [qualityReport, setQualityReport] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  // 测试网站列表
  const testSites = [
    'https://github.com',
    'https://google.com',
    'https://stackoverflow.com',
    'https://youtube.com',
    'https://twitter.com',
    'https://facebook.com',
    'https://linkedin.com',
    'https://reddit.com',
    'https://amazon.com',
    'https://netflix.com',
    'localhost:3000',
    '192.168.1.1',
  ];

  // 测试图标获取
  const testIconFetch = async (url: string) => {
    setIsLoading(true);
    try {
      // 获取fallback URLs
      const urls = getFaviconFallbackUrls(url, 32);
      setFallbackUrls(urls);

      // 获取最佳URL
      const best = await getCachedFaviconUrl(url, 32);
      setBestUrl(best);

      // 质量检测
      if (best) {
        const report = await detectUrlIconQuality(best);
        setQualityReport(report);
      }
    } catch (error) {
      console.error('Test failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // 初始测试
  useEffect(() => {
    testIconFetch(testUrl);
  }, []);

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'bg-green-100 text-green-800';
    if (score >= 60) return 'bg-yellow-100 text-yellow-800';
    if (score >= 30) return 'bg-orange-100 text-orange-800';
    return 'bg-red-100 text-red-800';
  };

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>图标获取测试工具</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              value={testUrl}
              onChange={(e) => setTestUrl(e.target.value)}
              placeholder="输入要测试的网站URL"
              className="flex-1"
            />
            <Button 
              onClick={() => testIconFetch(testUrl)}
              disabled={isLoading}
            >
              {isLoading ? '测试中...' : '测试'}
            </Button>
          </div>

          <div className="flex flex-wrap gap-2">
            {testSites.map((site) => (
              <Button
                key={site}
                variant="outline"
                size="sm"
                onClick={() => {
                  setTestUrl(site);
                  testIconFetch(site);
                }}
              >
                {site}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 图标预览 */}
      <Card>
        <CardHeader>
          <CardTitle>图标预览</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="text-center">
              <div className="mb-2">新统一组件</div>
              <BookmarkIcon
                bookmark={{
                  id: 'test',
                  name: '测试网站',
                  title: '测试网站',
                  url: testUrl,
                  iconType: 'official',
                  createdAt: Date.now(),
                  updatedAt: Date.now(),
                }}
                networkMode="external"
                size={64}
                borderRadius={8}
                showLoadingState={true}
              />
            </div>
            
            {bestUrl && (
              <div className="text-center">
                <div className="mb-2">最佳URL</div>
                <div className="w-16 h-16 border rounded-lg overflow-hidden bg-white flex items-center justify-center">
                  {bestUrl.startsWith('http') ? (
                    <img src={bestUrl} alt="Best icon" className="w-full h-full object-contain" />
                  ) : (
                    <div className="text-2xl">{bestUrl}</div>
                  )}
                </div>
                <div className="text-xs text-gray-500 mt-1 break-all max-w-20">
                  {bestUrl.length > 30 ? bestUrl.substring(0, 30) + '...' : bestUrl}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Fallback URLs */}
      <Card>
        <CardHeader>
          <CardTitle>备用URL列表 ({fallbackUrls.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {fallbackUrls.map((url, index) => (
              <div key={index} className="border rounded-lg p-3">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="outline">#{index + 1}</Badge>
                  <div className="w-6 h-6 border rounded overflow-hidden bg-white flex items-center justify-center">
                    {url.startsWith('http') ? (
                      <img 
                        src={url} 
                        alt={`Icon ${index + 1}`} 
                        className="w-full h-full object-contain"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className="text-xs">{url}</div>
                    )}
                  </div>
                </div>
                <div className="text-xs text-gray-600 break-all">
                  {url}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 质量报告 */}
      {qualityReport && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              质量报告
              <Badge className={getScoreColor(qualityReport.score)}>
                {qualityReport.score}/100
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <div className="text-sm text-gray-500">尺寸</div>
                <div className="font-medium">
                  {qualityReport.dimensions 
                    ? `${qualityReport.dimensions.width}x${qualityReport.dimensions.height}`
                    : '未知'
                  }
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-500">加载时间</div>
                <div className="font-medium">{Math.round(qualityReport.loadTime)}ms</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">状态</div>
                <div className="font-medium">
                  {qualityReport.isValid ? '✅ 有效' : '❌ 无效'}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-500">问题数量</div>
                <div className="font-medium">{qualityReport.issues.length}</div>
              </div>
            </div>

            {qualityReport.issues && qualityReport.issues.length > 0 && (
              <div>
                <div className="text-sm font-medium mb-2">发现的问题:</div>
                <div className="space-y-2">
                  {qualityReport.issues?.map((issue: any, index: number) => (
                    <div key={index} className="border-l-4 border-orange-400 pl-3 py-1">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {issue.severity}
                        </Badge>
                        <span className="text-sm">{issue.message}</span>
                      </div>
                      {issue.fix && (
                        <div className="text-xs text-gray-600 mt-1">
                          💡 {issue.fix}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {qualityReport.suggestions && qualityReport.suggestions.length > 0 && (
              <div>
                <div className="text-sm font-medium mb-2">优化建议:</div>
                <ul className="list-disc list-inside space-y-1">
                  {qualityReport.suggestions?.map((suggestion: string, index: number) => (
                    <li key={index} className="text-sm text-gray-600">{suggestion}</li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default IconTestPage;
