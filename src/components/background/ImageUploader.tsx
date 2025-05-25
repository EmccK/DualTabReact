/**
 * 图片上传组件
 * 支持图片文件上传、预览和管理
 */

import React, { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Upload, X, Image as ImageIcon, FileImage } from 'lucide-react';
import type { BackgroundSettings } from '@/types/settings';

interface ImageUploaderProps {
  value: BackgroundSettings['image'];
  onChange: (imageFile: File | null) => void;
  className?: string;
}

export function ImageUploader({ value, onChange, className }: ImageUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(value?.url || null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (file: File) => {
    // 验证文件类型
    if (!file.type.startsWith('image/')) {
      alert('请选择图片文件');
      return;
    }

    // 验证文件大小 (限制2MB)
    if (file.size > 2 * 1024 * 1024) {
      alert('图片文件大小不能超过2MB');
      return;
    }

    // 创建预览URL
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    
    onChange(file);
  };

  const handleFileRemove = () => {
    if (previewUrl && previewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(null);
    onChange(null);
    
    // 清空文件输入
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    const imageFile = files.find(file => file.type.startsWith('image/'));
    
    if (imageFile) {
      handleFileSelect(imageFile);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* 当前图片预览 */}
      {previewUrl ? (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-gray-700">当前背景图片</label>
            <Button
              variant="outline"
              size="sm"
              onClick={handleFileRemove}
              className="h-8"
            >
              <X className="w-4 h-4 mr-1" />
              移除
            </Button>
          </div>
          
          <Card className="overflow-hidden">
            <CardContent className="p-0">
              <div className="relative">
                <img
                  src={previewUrl}
                  alt="背景预览"
                  className="w-full h-40 object-cover"
                />
                <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                  <Badge variant="secondary" className="bg-white/90 text-gray-800">
                    点击预览大图
                  </Badge>
                </div>
              </div>
              
              {value && (
                <div className="p-3 bg-gray-50 border-t">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2 text-gray-600">
                      <FileImage className="w-4 h-4" />
                      <span className="truncate max-w-32">{value.name}</span>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {formatFileSize(value.size)}
                    </Badge>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      ) : (
        // 上传区域
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">上传背景图片</label>
          
          <div
            className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              isDragging 
                ? 'border-blue-400 bg-blue-50' 
                : 'border-gray-300 hover:border-gray-400'
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleInputChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            
            <div className="space-y-4">
              <div className="flex justify-center">
                <div className={`p-3 rounded-full ${
                  isDragging ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-400'
                }`}>
                  <Upload className="w-8 h-8" />
                </div>
              </div>
              
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-700">
                  {isDragging ? '松开以上传图片' : '拖拽图片到此处或点击选择'}
                </p>
                <p className="text-xs text-gray-500">
                  支持 JPG、PNG、WebP 格式，最大 2MB
                </p>
              </div>
              
              <Button variant="outline" size="sm" className="mt-2">
                <ImageIcon className="w-4 h-4 mr-2" />
                选择图片文件
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 使用提示 */}
      <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-start gap-2">
          <div className="text-blue-600 mt-0.5">💡</div>
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-1">图片选择建议：</p>
            <ul className="text-xs space-y-1 text-blue-700">
              <li>• 推荐使用高分辨率图片以获得最佳显示效果</li>
              <li>• 横向图片更适合作为新标签页背景</li>
              <li>• 选择颜色不太鲜艳的图片以确保文字可读性</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
