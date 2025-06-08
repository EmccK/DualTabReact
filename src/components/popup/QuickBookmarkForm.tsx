/**
 * 快速书签表单组件
 */

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import type { QuickBookmarkFormData } from '@/types/popup/tab.types';
import type { BookmarkCategory } from '@/types';
import { validateQuickBookmarkForm } from '@/utils/popup/urlHelpers';
import { Plus, AlertCircle } from 'lucide-react';

interface QuickBookmarkFormProps {
  // 初始数据
  initialName?: string;
  initialUrl?: string;
  categories: BookmarkCategory[];
  defaultCategoryName?: string;
  
  // 状态
  isSubmitting: boolean;
  submitError: string | null;
  
  // 事件
  onSubmit: (formData: QuickBookmarkFormData) => Promise<void>;
  onCancel?: () => void;
  onClearError: () => void;
}

export function QuickBookmarkForm({
  initialName = '',
  initialUrl = '',
  categories,
  defaultCategoryName,
  isSubmitting,
  submitError,
  onSubmit,
  onCancel,
  onClearError
}: QuickBookmarkFormProps) {
  // 自动聚焦引用
  const nameInputRef = useRef<HTMLInputElement>(null);

  // 表单状态
  const [formData, setFormData] = useState<QuickBookmarkFormData>({
    name: initialName,
    url: initialUrl,
    description: '',
    categoryName: defaultCategoryName || (categories[0]?.name || ''),
    useCurrentTabInfo: true
  });

  // 表单验证错误
  const [validationErrors, setValidationErrors] = useState<{
    name?: string;
    url?: string;
    categoryName?: string;
  }>({});

  // 表单验证函数
  const validateForm = useCallback((): boolean => {
    const validation = validateQuickBookmarkForm(formData);
    setValidationErrors(validation.errors);
    return validation.isValid;
  }, [formData]);

  // 提交处理
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    await onSubmit(formData);
  }, [formData, validateForm, onSubmit]);

  // 当初始数据变化时更新表单
  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      name: initialName,
      url: initialUrl,
      categoryName: defaultCategoryName || prev.categoryName || (categories[0]?.name || '')
    }));
  }, [initialName, initialUrl, defaultCategoryName, categories]);

  // 自动聚焦到名称输入框
  useEffect(() => {
    if (nameInputRef.current && !isSubmitting) {
      setTimeout(() => {
        nameInputRef.current?.focus();
      }, 100);
    }
  }, [isSubmitting]);

  // 键盘快捷键支持
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+Enter 或 Cmd+Enter 快速提交
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        if (!isSubmitting && validateForm()) {
          // 创建一个模拟的表单提交事件
          const mockEvent = {
            preventDefault: () => {},
            target: null,
            currentTarget: null
          } as React.FormEvent;
          handleSubmit(mockEvent);
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isSubmitting, validateForm, handleSubmit]);

  // 清除错误当值改变时
  useEffect(() => {
    if (submitError) {
      onClearError();
    }
    setValidationErrors({});
  }, [formData.name, formData.url, formData.categoryName, submitError, onClearError]);

  // 处理输入变化
  const handleInputChange = useCallback((field: keyof QuickBookmarkFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  // 没有分类时的提示
  if (categories.length === 0) {
    return (
      <div className="text-center py-8">
        <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">没有书签分类</h3>
        <p className="text-sm text-gray-600 mb-4">
          请先在新标签页中创建书签分类
        </p>
        {onCancel && (
          <Button variant="outline" onClick={onCancel}>
            返回
          </Button>
        )}
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {/* 提交错误提示 */}
      {submitError && (
        <Alert className="border-red-200 bg-red-50 rounded-xl">
          <AlertCircle className="w-4 h-4 text-red-600" />
          <AlertDescription className="text-red-700">
            {submitError}
          </AlertDescription>
        </Alert>
      )}

      {/* 书签名称 */}
      <div className="space-y-1">
        <Label htmlFor="bookmark-name" className="text-sm font-medium text-gray-700">
          书签名称 <span className="text-red-500">*</span>
        </Label>
        <Input
          id="bookmark-name"
          ref={nameInputRef}
          value={formData.name}
          onChange={(e) => handleInputChange('name', e.target.value)}
          placeholder="网站名称"
          className={validationErrors.name ? 'border-red-300 focus:border-red-500' : ''}
          disabled={isSubmitting}
        />
        {validationErrors.name && (
          <p className="text-xs text-red-600">{validationErrors.name}</p>
        )}
      </div>

      {/* 网站地址 */}
      <div className="space-y-1">
        <Label htmlFor="bookmark-url" className="text-sm font-medium text-gray-700">
          网站地址 <span className="text-red-500">*</span>
        </Label>
        <Input
          id="bookmark-url"
          type="url"
          value={formData.url}
          onChange={(e) => handleInputChange('url', e.target.value)}
          placeholder="https://example.com"
          className={validationErrors.url ? 'border-red-300 focus:border-red-500' : ''}
          disabled={isSubmitting}
        />
        {validationErrors.url && (
          <p className="text-xs text-red-600">{validationErrors.url}</p>
        )}
      </div>

      {/* 描述（可选） */}
      <div className="space-y-1">
        <Label htmlFor="bookmark-description" className="text-sm font-medium text-gray-700">
          描述（可选）
        </Label>
        <Input
          id="bookmark-description"
          value={formData.description}
          onChange={(e) => handleInputChange('description', e.target.value)}
          placeholder="简短描述"
          disabled={isSubmitting}
        />
      </div>

      {/* 分类选择 */}
      <div className="space-y-1">
        <Label htmlFor="bookmark-category" className="text-sm font-medium text-gray-700">
          分类 <span className="text-red-500">*</span>
        </Label>
        <select
          id="bookmark-category"
          value={formData.categoryName}
          onChange={(e) => handleInputChange('categoryName', e.target.value)}
          className={`w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors text-sm ${
            validationErrors.categoryName 
              ? 'border-red-300 focus:ring-red-500' 
              : 'border-gray-300'
          }`}
          disabled={isSubmitting}
        >
          {categories.map((category) => (
            <option key={category.name} value={category.name}>
              {category.icon} {category.name}
            </option>
          ))}
        </select>
        {validationErrors.categoryName && (
          <p className="text-xs text-red-600">{validationErrors.categoryName}</p>
        )}
      </div>

      {/* 提交按钮 */}
      <div className="flex space-x-3 pt-3">
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isSubmitting}
            className="flex-1 rounded-xl"
          >
            取消
          </Button>
        )}
        <Button
          type="submit"
          disabled={isSubmitting}
          className="flex-1 bg-indigo-600 hover:bg-indigo-700 rounded-xl"
        >
          {isSubmitting ? (
            <div className="flex items-center justify-center">
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div>
              添加中...
            </div>
          ) : (
            <div className="flex items-center justify-center">
              <Plus className="w-4 h-4 mr-2" />
              添加书签
            </div>
          )}
        </Button>
      </div>
    </form>
  );
}
