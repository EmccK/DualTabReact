/**
 * 自动切换设置组件
 * 处理背景图片自动切换的配置和状态管理
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Timer, 
  Play, 
  Pause, 
  RotateCcw,
  Calendar,
  TrendingUp,
  Loader2,
  CheckCircle,
  AlertTriangle,
  Clock,
  Shuffle
} from 'lucide-react';

import { SettingItem } from '../../components/SettingItem';
import { SliderControl } from '../../components/SliderControl';
import { ToggleSwitch } from '../../components/ToggleSwitch';
import { SelectOption } from '../../components/SelectOption';
import { useAutoSwitch } from '@/hooks/background';

// 切换模式选项
const SWITCH_MODE_OPTIONS = [
  { value: 'random', label: '随机切换' },
  { value: 'sequential', label: '顺序切换' },
  { value: 'favorite', label: '收藏优先' }
];

// 分类选项
const CATEGORY_OPTIONS = [
  { value: 'nature', label: '自然风光' },
  { value: 'landscape', label: '风景' },
  { value: 'architecture', label: '建筑' },
  { value: 'business', label: '商务' },
  { value: 'technology', label: '科技' },
  { value: 'travel', label: '旅行' },
  { value: 'minimalist', label: '极简' }
];

// 工作日选项
const WEEKDAY_LABELS = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];

export function AutoSwitchSettings() {
  const {
    settings,
    loading,
    switching,
    error,
    updateSettings,
    toggleAutoSwitch,
    triggerSwitch,
    isEnabled,
    isRunning,
    intervalMinutes,
    todaySwitches,
    totalSwitches,
    nextSwitchTime,
    lastSwitchTime,
    timeUntilNext,
    todayHistory,
    inScheduledTime,
    validateSchedule
  } = useAutoSwitch();

  const handleIntervalChange = async (minutes: number) => {
    try {
      await updateSettings({ intervalMinutes: minutes });
    } catch {
      alert('保存切换间隔失败，请重试');
    }
  };

  const handleModeChange = async (mode: 'random' | 'sequential' | 'favorite') => {
    try {
      await updateSettings({ mode });
    } catch {
      alert('保存切换模式失败，请重试');
    }
  };

  const handleCategoryChange = async (categories: string[]) => {
    try {
      await updateSettings({ 
        source: { ...settings?.source, categories } 
      });
    } catch {
      alert('保存分类设置失败，请重试');
    }
  };

  const handleScheduleChange = async (scheduleUpdate: Partial<typeof settings.schedule>) => {
    if (!settings) return;

    try {
      const newSchedule = { ...settings.schedule, ...scheduleUpdate };
      const validation = validateSchedule(newSchedule);
      
      if (!validation.valid) {
        alert(validation.error);
        return;
      }

      await updateSettings({ schedule: newSchedule });
    } catch {
      alert('保存时间段设置失败，请重试');
    }
  };

  const handleWeekdayToggle = async (dayIndex: number, enabled: boolean) => {
    if (!settings?.schedule) return;

    const newWeekdays = [...settings.schedule.weekdays];
    newWeekdays[dayIndex] = enabled;

    await handleScheduleChange({ weekdays: newWeekdays });
  };

  const handleManualSwitch = async () => {
    try {
      const result = await triggerSwitch();
      if (result.success) {
        alert('背景切换成功！');
      } else {
        alert(`切换失败: ${result.error}`);
      }
    } catch {
      alert('手动切换失败，请重试');
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

  return (
    <div className="space-y-4">
      {/* 自动切换状态 */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Timer className="w-4 h-4 text-indigo-600" />
            自动切换状态
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* 启用切换 */}
          <SettingItem
            label="启用自动切换"
            description="定时自动更换背景图片"
          >
            <ToggleSwitch
              checked={isEnabled}
              onCheckedChange={toggleAutoSwitch}
            />
          </SettingItem>

          {/* 运行状态 */}
          {isEnabled && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">运行状态</span>
                <Badge 
                  variant={isRunning ? 'default' : 'secondary'}
                  className="flex items-center gap-1"
                >
                  {isRunning ? <Play className="w-3 h-3" /> : <Pause className="w-3 h-3" />}
                  {isRunning ? '运行中' : '已暂停'}
                </Badge>
              </div>

              {/* 时间信息 */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="text-xs text-gray-500 mb-1">下次切换</div>
                  <div className="font-medium">
                    {nextSwitchTime ? (
                      <>
                        <div>{nextSwitchTime.toLocaleTimeString()}</div>
                        {timeUntilNext && (
                          <div className="text-xs text-gray-500">还有 {timeUntilNext}</div>
                        )}
                      </>
                    ) : (
                      <span className="text-gray-400">暂未计划</span>
                    )}
                  </div>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="text-xs text-gray-500 mb-1">上次切换</div>
                  <div className="font-medium">
                    {lastSwitchTime ? (
                      lastSwitchTime.toLocaleString()
                    ) : (
                      <span className="text-gray-400">从未切换</span>
                    )}
                  </div>
                </div>
              </div>

              {/* 统计信息 */}
              <div className="grid grid-cols-2 gap-4 text-center">
                <div className="bg-blue-50 rounded-lg p-3">
                  <div className="text-lg font-semibold text-blue-600">{todaySwitches}</div>
                  <div className="text-xs text-blue-500">今日切换</div>
                </div>
                <div className="bg-blue-50 rounded-lg p-3">
                  <div className="text-lg font-semibold text-blue-600">{totalSwitches}</div>
                  <div className="text-xs text-blue-500">总切换次数</div>
                </div>
              </div>

              {/* 手动切换按钮 */}
              <Button
                onClick={handleManualSwitch}
                disabled={switching}
                variant="outline"
                className="w-full"
              >
                {switching ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    切换中...
                  </>
                ) : (
                  <>
                    <Shuffle className="w-4 h-4 mr-2" />
                    立即切换背景
                  </>
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 切换设置 */}
      {isEnabled && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <RotateCcw className="w-4 h-4 text-indigo-600" />
              切换设置
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* 切换间隔 */}
            <SettingItem
              label="切换间隔"
              description="自动切换背景的时间间隔"
            >
              <SliderControl
                value={intervalMinutes}
                onChange={handleIntervalChange}
                min={15}
                max={360}
                step={15}
                suffix="分钟"
                className="w-32"
              />
            </SettingItem>

            {/* 切换模式 */}
            <SettingItem
              label="切换模式"
              description="选择背景图片的切换方式"
            >
              <SelectOption
                value={settings?.mode || 'random'}
                onValueChange={handleModeChange}
                options={SWITCH_MODE_OPTIONS}
                className="w-40"
              />
            </SettingItem>

            {/* 间隔范围 */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">随机间隔范围</Label>
              <div className="grid grid-cols-2 gap-4">
                <SettingItem
                  label="最小间隔"
                  description="最短切换间隔"
                  className="mb-0"
                >
                  <SliderControl
                    value={settings?.conditions.minInterval || 15}
                    onChange={(value) => updateSettings({ 
                      conditions: { ...settings?.conditions, minInterval: value } 
                    })}
                    min={5}
                    max={180}
                    step={5}
                    suffix="分钟"
                    className="w-24"
                  />
                </SettingItem>
                <SettingItem
                  label="最大间隔"
                  description="最长切换间隔"
                  className="mb-0"
                >
                  <SliderControl
                    value={settings?.conditions.maxInterval || 360}
                    onChange={(value) => updateSettings({ 
                      conditions: { ...settings?.conditions, maxInterval: value } 
                    })}
                    min={60}
                    max={720}
                    step={30}
                    suffix="分钟"
                    className="w-24"
                  />
                </SettingItem>
              </div>
            </div>

            {/* 切换条件 */}
            <SettingItem
              label="仅在活跃时切换"
              description="只有在用户活跃使用时才进行背景切换"
            >
              <ToggleSwitch
                checked={settings?.conditions.onlyWhenActive || false}
                onCheckedChange={(value) => updateSettings({ 
                  conditions: { ...settings?.conditions, onlyWhenActive: value } 
                })}
              />
            </SettingItem>
          </CardContent>
        </Card>
      )}

      {/* 图片来源设置 */}
      {isEnabled && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-indigo-600" />
              图片来源设置
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* 包含的分类 */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">包含的分类</Label>
              <div className="grid grid-cols-2 gap-2">
                {CATEGORY_OPTIONS.map(({ value, label }) => (
                  <div key={value} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id={`category-${value}`}
                      checked={settings?.source.categories.includes(value) || false}
                      onChange={(e) => {
                        const currentCategories = settings?.source.categories || [];
                        const newCategories = e.target.checked
                          ? [...currentCategories, value]
                          : currentCategories.filter(c => c !== value);
                        handleCategoryChange(newCategories);
                      }}
                      className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <Label htmlFor={`category-${value}`} className="text-sm">
                      {label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            {/* 其他来源 */}
            <SettingItem
              label="包含收藏图片"
              description="在自动切换中包含您收藏的图片"
            >
              <ToggleSwitch
                checked={settings?.source.includeFavorites || false}
                onCheckedChange={(value) => updateSettings({ 
                  source: { ...settings?.source, includeFavorites: value } 
                })}
              />
            </SettingItem>

            <SettingItem
              label="包含本地图片"
              description="在自动切换中包含您上传的本地图片"
            >
              <ToggleSwitch
                checked={settings?.source.includeLocal || false}
                onCheckedChange={(value) => updateSettings({ 
                  source: { ...settings?.source, includeLocal: value } 
                })}
              />
            </SettingItem>
          </CardContent>
        </Card>
      )}

      {/* 时间段设置 */}
      {isEnabled && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Calendar className="w-4 h-4 text-indigo-600" />
              时间段设置
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* 启用时间段限制 */}
            <SettingItem
              label="启用时间段限制"
              description="仅在指定时间段内进行自动切换"
            >
              <ToggleSwitch
                checked={settings?.schedule.enabled || false}
                onCheckedChange={(enabled) => handleScheduleChange({ enabled })}
              />
            </SettingItem>

            {/* 时间段设置 */}
            {settings?.schedule.enabled && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">开始时间</Label>
                    <Input
                      type="time"
                      value={settings.schedule.startTime}
                      onChange={(e) => handleScheduleChange({ startTime: e.target.value })}
                      className="w-full"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">结束时间</Label>
                    <Input
                      type="time"
                      value={settings.schedule.endTime}
                      onChange={(e) => handleScheduleChange({ endTime: e.target.value })}
                      className="w-full"
                    />
                  </div>
                </div>

                {/* 工作日选择 */}
                <div className="space-y-3">
                  <Label className="text-sm font-medium">工作日</Label>
                  <div className="grid grid-cols-7 gap-2">
                    {WEEKDAY_LABELS.map((day, index) => (
                      <div key={index} className="flex flex-col items-center gap-1">
                        <input
                          type="checkbox"
                          id={`weekday-${index}`}
                          checked={settings.schedule.weekdays[index] || false}
                          onChange={(e) => handleWeekdayToggle(index, e.target.checked)}
                          className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                        />
                        <Label htmlFor={`weekday-${index}`} className="text-xs">
                          {day}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 当前状态 */}
                <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                  {inScheduledTime ? (
                    <>
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span className="text-sm text-green-700">当前在允许的时间段内</span>
                    </>
                  ) : (
                    <>
                      <Clock className="w-4 h-4 text-orange-500" />
                      <span className="text-sm text-orange-700">当前不在允许的时间段内</span>
                    </>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* 今日切换历史 */}
      {isEnabled && todayHistory.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="w-4 h-4 text-indigo-600" />
              今日切换历史
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {todayHistory.slice(0, 5).map((item, index) => (
                <div key={index} className="flex items-center justify-between text-sm p-2 bg-gray-50 rounded">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">{item.category}</Badge>
                    <span className="text-gray-600 text-xs">
                      {new Date(item.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  <Badge variant="secondary" className="text-xs">{item.source}</Badge>
                </div>
              ))}
              {todayHistory.length > 5 && (
                <p className="text-xs text-gray-500 text-center pt-2">
                  还有 {todayHistory.length - 5} 条记录...
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 错误信息 */}
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* 使用提示 */}
      <Card className="bg-orange-50 border-orange-200">
        <CardContent className="p-4">
          <div className="flex items-start gap-2">
            <div className="text-orange-600 mt-0.5">💡</div>
            <div className="text-sm text-orange-800">
              <p className="font-medium mb-2">自动切换小贴士：</p>
              <ul className="text-xs space-y-1 text-orange-700">
                <li>• <strong>随机模式</strong>：每次随机选择图片，保持新鲜感</li>
                <li>• <strong>顺序模式</strong>：按分类顺序切换，有规律可循</li>
                <li>• <strong>收藏优先</strong>：优先选择您收藏的图片</li>
                <li>• <strong>时间段限制</strong>：避免在休息时间打扰您</li>
                <li>• <strong>活跃检测</strong>：仅在您使用电脑时切换背景</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
