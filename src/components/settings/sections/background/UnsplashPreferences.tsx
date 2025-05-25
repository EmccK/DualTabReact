/**
 * Unsplash偏好设置组件
 * 处理默认分类、图片质量、语言等偏好配置
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  Heart, 
  Image as ImageIcon, 
  Globe, 
  Palette,
  Loader2
} from 'lucide-react';

import { SettingItem } from '../../components/SettingItem';
import { SelectOption } from '../../components/SelectOption';
import { ToggleSwitch } from '../../components/ToggleSwitch';
import { useUnsplashSettings } from '@/hooks/background';

// Unsplash分类选项
const CATEGORY_OPTIONS = [
  { value: 'nature', label: '自然风光' },
  { value: 'landscape', label: '风景' },
  { value: 'architecture', label: '建筑' },
  { value: 'business', label: '商务' },
  { value: 'food', label: '美食' },
  { value: 'people', label: '人物' },
  { value: 'technology', label: '科技' },
  { value: 'travel', label: '旅行' },
  { value: 'fashion', label: '时尚' },
  { value: 'art', label: '艺术' },
  { value: 'animals', label: '动物' },
  { value: 'minimalist', label: '极简' }
];

// 图片质量选项
const QUALITY_OPTIONS = [
  { value: 'regular', label: '标准 (1080p)' },
  { value: 'full', label: '高清 (原图)' }
];

// 语言选项
const LANGUAGE_OPTIONS = [
  { value: 'auto', label: '自动检测' },
  { value: 'en', label: 'English' },
  { value: 'zh', label: '中文' }
];

export function UnsplashPreferences() {
  const {
    settings,
    loading,
    error,
    updatePreferences,
    preferences
  } = useUnsplashSettings();

  const handleCategoryChange = async (category: string) => {
    try {
      await updatePreferences({ defaultCategory: category });
    } catch (err) {
      alert('保存分类偏好失败，请重试');
    }
  };

  const handleQualityChange = async (quality: 'regular' | 'full') => {
    try {
      await updatePreferences({ imageQuality: quality });
    } catch (err) {
      alert('保存图片质量设置失败，请重试');
    }
  };

  const handleLanguageChange = async (language: 'en' | 'zh' | 'auto') => {
    try {
      await updatePreferences({ searchLanguage: language });
    } catch (err) {
      alert('保存语言设置失败，请重试');
    }
  };

  const handleShowAuthorToggle = async (showAuthor: boolean) => {
    try {
      await updatePreferences({ showAuthorInfo: showAuthor });
    } catch (err) {
      alert('保存作者信息设置失败，请重试');
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
      {/* 默认分类偏好 */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Palette className="w-4 h-4 text-indigo-600" />
            默认分类偏好
          </CardTitle>
        </CardHeader>
        <CardContent>
          <SettingItem
            label="首选分类"
            description="打开Unsplash图库时优先显示的分类"
          >
            <SelectOption
              value={preferences?.defaultCategory || 'nature'}
              onValueChange={handleCategoryChange}
              options={CATEGORY_OPTIONS}
              className="w-40"
            />
          </SettingItem>
        </CardContent>
      </Card>

      {/* 图片质量设置 */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <ImageIcon className="w-4 h-4 text-indigo-600" />
            图片质量设置
          </CardTitle>
        </CardHeader>
        <CardContent>
          <SettingItem
            label="下载质量"
            description="选择下载图片的质量，高清图片文件更大但效果更好"
          >
            <div className="flex items-center gap-2">
              <SelectOption
                value={preferences?.imageQuality || 'regular'}
                onValueChange={handleQualityChange}
                options={QUALITY_OPTIONS}
                className="w-40"
              />
              {preferences?.imageQuality === 'full' && (
                <Badge variant="secondary" className="text-xs">
                  消耗API配额更多
                </Badge>
              )}
            </div>
          </SettingItem>
        </CardContent>
      </Card>

      {/* 显示设置 */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Heart className="w-4 h-4 text-indigo-600" />
            显示设置
          </CardTitle>
        </CardHeader>
        <CardContent>
          <SettingItem
            label="显示作者信息"
            description="在背景图片上显示摄影师姓名和链接"
          >
            <ToggleSwitch
              checked={preferences?.showAuthorInfo ?? true}
              onCheckedChange={handleShowAuthorToggle}
            />
          </SettingItem>
        </CardContent>
      </Card>

      {/* 搜索语言设置 */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Globe className="w-4 h-4 text-indigo-600" />
            搜索语言
          </CardTitle>
        </CardHeader>
        <CardContent>
          <SettingItem
            label="搜索语言偏好"
            description="设置搜索关键词的语言偏好"
          >
            <SelectOption
              value={preferences?.searchLanguage || 'auto'}
              onValueChange={handleLanguageChange}
              options={LANGUAGE_OPTIONS}
              className="w-32"
            />
          </SettingItem>
        </CardContent>
      </Card>

      {/* 当前设置摘要 */}
      <Card className="bg-gray-50 border-gray-200">
        <CardContent className="p-4">
          <div className="flex items-start gap-2">
            <div className="text-gray-600 mt-0.5">⚙️</div>
            <div className="text-sm text-gray-700">
              <p className="font-medium mb-2">当前偏好设置：</p>
              <div className="space-y-1 text-xs">
                <div className="flex items-center gap-2">
                  <span className="text-gray-500">默认分类:</span>
                  <Badge variant="outline" className="text-xs">
                    {CATEGORY_OPTIONS.find(opt => opt.value === preferences?.defaultCategory)?.label || '自然风光'}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-gray-500">图片质量:</span>
                  <Badge variant="outline" className="text-xs">
                    {QUALITY_OPTIONS.find(opt => opt.value === preferences?.imageQuality)?.label || '标准 (1080p)'}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-gray-500">搜索语言:</span>
                  <Badge variant="outline" className="text-xs">
                    {LANGUAGE_OPTIONS.find(opt => opt.value === preferences?.searchLanguage)?.label || '自动检测'}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-gray-500">作者信息:</span>
                  <Badge variant={preferences?.showAuthorInfo ? "default" : "secondary"} className="text-xs">
                    {preferences?.showAuthorInfo ? '显示' : '隐藏'}
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 使用提示 */}
      <Card className="bg-green-50 border-green-200">
        <CardContent className="p-4">
          <div className="flex items-start gap-2">
            <div className="text-green-600 mt-0.5">💡</div>
            <div className="text-sm text-green-800">
              <p className="font-medium mb-2">偏好设置说明：</p>
              <ul className="text-xs space-y-1 text-green-700">
                <li>• <strong>默认分类</strong>：影响首次打开时显示的图片类型</li>
                <li>• <strong>标准质量</strong>：1080p分辨率，加载快，适合大多数用户</li>
                <li>• <strong>高清质量</strong>：原图分辨率，文件大，适合高分辨率显示器</li>
                <li>• <strong>作者信息</strong>：支持摄影师创作，符合Unsplash使用条款</li>
                <li>• <strong>搜索语言</strong>：影响搜索建议和关键词处理</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
