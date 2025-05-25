/**
 * Unsplash API设置组件
 * 处理API密钥验证、使用统计显示和配置管理
 */

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Key, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Loader2,
  BarChart3,
  Clock,
  Shield
} from 'lucide-react';

import { SettingItem } from '../../components/SettingItem';
import { ToggleSwitch } from '../../components/ToggleSwitch';
import { useUnsplashSettings } from '@/hooks/background';

export function UnsplashAPISettings() {
  const {
    settings,
    loading,
    validating,
    error,
    validateApiKey,
    toggleCustomKey,
    updateApiSettings,
    getUsagePercentages,
    getResetTimes,
    isCustomKeyEnabled,
    isApiKeyValid,
    usageStats
  } = useUnsplashSettings();

  const [customKey, setCustomKey] = useState('');
  const [showKey, setShowKey] = useState(false);

  const handleValidateKey = async () => {
    if (!customKey.trim()) {
      alert('请输入API密钥');
      return;
    }

    const result = await validateApiKey(customKey.trim());
    if (result.success) {
      alert('API密钥验证成功！');
      setCustomKey('');
    }
  };

  const handleToggleCustomKey = async (enabled: boolean) => {
    try {
      await toggleCustomKey(enabled);
    } catch (err) {
      alert('切换失败，请重试');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
        <span className="ml-2 text-gray-600">加载设置中...</span>
      </div>
    );
  }

  const usagePercentages = getUsagePercentages();
  const resetTimes = getResetTimes();

  return (
    <div className="space-y-4">
      {/* API密钥设置 */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Key className="w-4 h-4 text-indigo-600" />
            API密钥设置
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* 使用自定义密钥切换 */}
          <SettingItem
            label="使用自定义API密钥"
            description="使用您自己的Unsplash API密钥，获得更高的请求限制"
          >
            <ToggleSwitch
              checked={isCustomKeyEnabled}
              onCheckedChange={handleToggleCustomKey}
            />
          </SettingItem>

          {/* 当前密钥状态 */}
          {isCustomKeyEnabled && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Label className="text-sm font-medium">当前密钥状态</Label>
                {isApiKeyValid ? (
                  <Badge variant="default" className="flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" />
                    已验证
                  </Badge>
                ) : (
                  <Badge variant="destructive" className="flex items-center gap-1">
                    <XCircle className="w-3 h-3" />
                    未验证
                  </Badge>
                )}
              </div>

              {settings?.api.keyValidation.lastVerified && (
                <p className="text-xs text-gray-500">
                  上次验证: {new Date(settings.api.keyValidation.lastVerified).toLocaleString()}
                </p>
              )}
            </div>
          )}

          {/* 密钥输入和验证 */}
          {isCustomKeyEnabled && (
            <div className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="api-key" className="text-sm font-medium">
                  输入新的API密钥
                </Label>
                <div className="flex gap-2">
                  <Input
                    id="api-key"
                    type={showKey ? 'text' : 'password'}
                    value={customKey}
                    onChange={(e) => setCustomKey(e.target.value)}
                    placeholder="输入您的Unsplash API密钥"
                    className="flex-1"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowKey(!showKey)}
                  >
                    {showKey ? '隐藏' : '显示'}
                  </Button>
                </div>
              </div>

              <Button
                onClick={handleValidateKey}
                disabled={validating || !customKey.trim()}
                className="w-full"
              >
                {validating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    验证中...
                  </>
                ) : (
                  <>
                    <Shield className="w-4 h-4 mr-2" />
                    验证API密钥
                  </>
                )}
              </Button>

              <p className="text-xs text-gray-500">
                获取API密钥：访问 
                <a 
                  href="https://unsplash.com/developers" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-indigo-600 hover:underline ml-1"
                >
                  Unsplash开发者页面
                </a>
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* API使用统计 */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-indigo-600" />
            API使用统计
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {usageStats && (
            <>
              {/* 小时统计 */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label className="text-sm">当前小时</Label>
                  <span className="text-sm text-gray-600">
                    {usageStats.currentHourRequests} / {usageStats.limits.hourly}
                  </span>
                </div>
                <Progress 
                  value={usagePercentages.hourly} 
                  className="h-2"
                />
                <p className="text-xs text-gray-500 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  重置时间: {resetTimes.hourly.toLocaleTimeString()}
                </p>
              </div>

              {/* 日统计 */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label className="text-sm">今日使用</Label>
                  <span className="text-sm text-gray-600">
                    {usageStats.dailyRequests} / {usageStats.limits.daily}
                  </span>
                </div>
                <Progress 
                  value={usagePercentages.daily} 
                  className="h-2"
                />
                <p className="text-xs text-gray-500 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  重置时间: {resetTimes.daily.toLocaleDateString()}
                </p>
              </div>

              {/* 月统计 */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label className="text-sm">本月使用</Label>
                  <span className="text-sm text-gray-600">
                    {usageStats.monthlyRequests} / {usageStats.limits.monthly}
                  </span>
                </div>
                <Progress 
                  value={usagePercentages.monthly} 
                  className="h-2"
                />
                <p className="text-xs text-gray-500 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  重置时间: {resetTimes.monthly.toLocaleDateString()}
                </p>
              </div>
            </>
          )}

          {/* 使用量警告 */}
          {(usagePercentages.hourly > 80 || usagePercentages.daily > 80 || usagePercentages.monthly > 80) && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                API使用量较高，建议:
                {!isCustomKeyEnabled && ' 使用自定义API密钥获得更高限制，或'}
                稍后再试以避免超出限制。
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* 错误信息 */}
      {error && (
        <Alert variant="destructive">
          <XCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* 使用提示 */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-4">
          <div className="flex items-start gap-2">
            <div className="text-blue-600 mt-0.5">💡</div>
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-2">API密钥使用说明：</p>
              <ul className="text-xs space-y-1 text-blue-700">
                <li>• <strong>默认密钥</strong>：共享限制，适合轻度使用</li>
                <li>• <strong>自定义密钥</strong>：独享限制，5000次/小时，推荐重度用户</li>
                <li>• <strong>获取方式</strong>：免费注册Unsplash开发者账号即可</li>
                <li>• <strong>安全存储</strong>：密钥本地加密存储，不会上传到服务器</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
