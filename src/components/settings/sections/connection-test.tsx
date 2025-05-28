/**
 * WebDAV连接测试组件
 */

import React, { useState } from 'react';
import { Button } from '../../ui/button';
import { Alert, AlertDescription } from '../../ui/alert';
import { Badge } from '../../ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { 
  Loader2, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Wifi,
  Server,
  Shield,
  HardDrive
} from 'lucide-react';
import type { WebDAVConfig, WebDAVConnectionStatus } from '../../../types/webdav';

interface ConnectionTestProps {
  config: WebDAVConfig;
  onTest: (config: WebDAVConfig) => Promise<{
    success: boolean;
    status?: WebDAVConnectionStatus;
    error?: string;
    details?: {
      responseTime: number;
      serverInfo?: string;
      features?: string[];
    };
  }>;
}

export function ConnectionTest({ config, onTest }: ConnectionTestProps) {
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    status?: WebDAVConnectionStatus;
    error?: string;
    details?: {
      responseTime: number;
      serverInfo?: string;
      features?: string[];
    };
  } | null>(null);

  const handleTest = async () => {
    setIsTesting(true);
    setTestResult(null);

    try {
      const result = await onTest(config);
      setTestResult(result);
    } catch (error: any) {
      setTestResult({
        success: false,
        error: error.message || '连接测试失败',
      });
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wifi className="h-5 w-5" />
          连接测试
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button
          onClick={handleTest}
          disabled={isTesting}
          className="w-full"
          variant={testResult?.success ? 'default' : 'outline'}
        >
          {isTesting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              正在测试连接...
            </>
          ) : testResult?.success ? (
            <>
              <CheckCircle className="mr-2 h-4 w-4" />
              重新测试
            </>
          ) : (
            '开始测试'
          )}
        </Button>

        {/* 测试结果 */}
        {testResult && (
          <div className="space-y-3">
            {testResult.success ? (
              <Alert className="border-green-200 bg-green-50">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  连接测试成功！WebDAV服务器响应正常。
                </AlertDescription>
              </Alert>
            ) : (
              <Alert className="border-red-200 bg-red-50">
                <XCircle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-800">
                  连接测试失败：{testResult.error}
                </AlertDescription>
              </Alert>
            )}

            {/* 连接详情 */}
            {testResult.success && testResult.details && (
              <div className="grid grid-cols-2 gap-3 p-3 bg-gray-50 rounded-lg">
                {/* 响应时间 */}
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-gray-500" />
                  <span className="text-sm">
                    响应时间: {testResult.details.responseTime}ms
                  </span>
                </div>

                {/* 服务器信息 */}
                {testResult.details.serverInfo && (
                  <div className="flex items-center gap-2">
                    <Server className="h-4 w-4 text-gray-500" />
                    <span className="text-sm">
                      服务器: {testResult.details.serverInfo}
                    </span>
                  </div>
                )}

                {/* HTTPS状态 */}
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-gray-500" />
                  <span className="text-sm">
                    加密: {config.serverUrl.startsWith('https') ? '启用' : '未启用'}
                  </span>
                </div>

                {/* 存储路径 */}
                <div className="flex items-center gap-2">
                  <HardDrive className="h-4 w-4 text-gray-500" />
                  <span className="text-sm">
                    路径: {config.basePath || '/'}
                  </span>
                </div>
              </div>
            )}

            {/* 支持的功能 */}
            {testResult.success && testResult.details?.features && (
              <div className="space-y-2">
                <p className="text-sm font-medium">支持的功能:</p>
                <div className="flex flex-wrap gap-2">
                  {testResult.details.features.map((feature, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {feature}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
