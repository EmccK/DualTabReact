/**
 * 书签添加/编辑弹窗组件
 * 支持文字图标不限字符数
 */

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { Upload, Link, Type, Palette } from 'lucide-react';
import { COLOR_PALETTE } from '@/constants/bookmark-style.constants';
import type { BookmarkItem } from '@/types/bookmark-style.types';

interface BookmarkModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (bookmark: BookmarkItem) => void;
  bookmark?: BookmarkItem | null;
  title?: string;
}

const BookmarkModal: React.FC<BookmarkModalProps> = ({
  open,
  onClose,
  onSave,
  bookmark = null,
  title = '添加书签',
}) => {
  const [formData, setFormData] = useState<Partial<BookmarkItem>>({
    title: '',
    url: '',
    description: '',
    iconType: 'text',
    iconText: '',
    iconImage: '',
    iconColor: COLOR_PALETTE[0],
  });

  const [urlError, setUrlError] = useState('');

  // 编辑模式下填充数据
  useEffect(() => {
    if (bookmark) {
      setFormData({
        title: bookmark.title,
        url: bookmark.url,
        description: bookmark.description || '',
        iconType: bookmark.iconType,
        iconText: bookmark.iconText || '',
        iconImage: bookmark.iconImage || '',
        iconColor: bookmark.iconColor || COLOR_PALETTE[0],
      });
    } else {
      setFormData({
        title: '',
        url: '',
        description: '',
        iconType: 'text',
        iconText: '',
        iconImage: '',
        iconColor: COLOR_PALETTE[0],
      });
    }
    setUrlError('');
  }, [bookmark, open]);

  // 验证URL格式
  const validateUrl = (url: string): boolean => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  // 处理表单提交
  const handleSubmit = () => {
    if (!formData.title?.trim()) {
      return;
    }

    if (!formData.url?.trim()) {
      return;
    }

    if (!validateUrl(formData.url)) {
      setUrlError('请输入有效的URL地址');
      return;
    }

    const newBookmark: BookmarkItem = {
      id: bookmark?.id || `bookmark_${Date.now()}`,
      title: formData.title.trim(),
      url: formData.url.trim(),
      description: formData.description?.trim(),
      iconType: formData.iconType || 'text',
      iconText: formData.iconText?.trim() || formData.title.trim(),
      iconImage: formData.iconImage?.trim(),
      iconColor: formData.iconColor || COLOR_PALETTE[0],
    };

    onSave(newBookmark);
    onClose();
  };

  // 处理输入变化
  const handleInputChange = (field: keyof BookmarkItem, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    if (field === 'url') {
      setUrlError('');
    }
  };

  // 自动生成图标文字
  const handleTitleChange = (title: string) => {
    handleInputChange('title', title);
    if (formData.iconType === 'text' && !formData.iconText) {
      handleInputChange('iconText', title.slice(0, 4)); // 默认取前4个字符
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* 基本信息 */}
          <div className="space-y-3">
            <div>
              <Label htmlFor="title">书签标题 *</Label>
              <Input
                id="title"
                value={formData.title || ''}
                onChange={(e) => handleTitleChange(e.target.value)}
                placeholder="输入书签标题"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="url">网址 *</Label>
              <Input
                id="url"
                value={formData.url || ''}
                onChange={(e) => handleInputChange('url', e.target.value)}
                placeholder="https://example.com"
                className={`mt-1 ${urlError ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
              />
              {urlError && (
                <p className="text-sm text-red-500 mt-1">{urlError}</p>
              )}
            </div>

            <div>
              <Label htmlFor="description">描述（可选）</Label>
              <Textarea
                id="description"
                value={formData.description || ''}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="输入书签描述"
                className="mt-1"
                rows={2}
              />
            </div>
          </div>

          {/* 图标设置 */}
          <div className="space-y-3">
            <Label>图标设置</Label>
            
            <Tabs
              value={formData.iconType || 'text'}
              onValueChange={(value) => handleInputChange('iconType', value)}
              className="w-full"
            >
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="text" className="flex items-center space-x-1">
                  <Type size={14} />
                  <span>文字</span>
                </TabsTrigger>
                <TabsTrigger value="image" className="flex items-center space-x-1">
                  <Upload size={14} />
                  <span>图片</span>
                </TabsTrigger>
                <TabsTrigger value="favicon" className="flex items-center space-x-1">
                  <Link size={14} />
                  <span>网站图标</span>
                </TabsTrigger>
              </TabsList>

              {/* 文字图标 */}
              <TabsContent value="text" className="space-y-3">
                <div>
                  <Label htmlFor="iconText">图标文字</Label>
                  <Input
                    id="iconText"
                    value={formData.iconText || ''}
                    onChange={(e) => handleInputChange('iconText', e.target.value)}
                    placeholder="不限字符数，一行显示"
                    className="mt-1"
                    maxLength={10} // 建议最大长度，但不强制限制
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    建议2-4个字符效果最佳，支持中英文和emoji
                  </p>
                </div>

                {/* 颜色选择 */}
                <div>
                  <Label>背景颜色</Label>
                  <div className="grid grid-cols-5 gap-2 mt-2">
                    {COLOR_PALETTE.map((color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => handleInputChange('iconColor', color)}
                        className={`
                          w-8 h-8 rounded transition-all duration-200
                          ${formData.iconColor === color 
                            ? 'ring-2 ring-blue-500 ring-offset-2' 
                            : 'hover:scale-110'
                          }
                        `}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>
              </TabsContent>

              {/* 图片图标 */}
              <TabsContent value="image" className="space-y-3">
                <div>
                  <Label htmlFor="iconImage">图片URL</Label>
                  <Input
                    id="iconImage"
                    value={formData.iconImage || ''}
                    onChange={(e) => handleInputChange('iconImage', e.target.value)}
                    placeholder="https://example.com/icon.png"
                    className="mt-1"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    支持 PNG、JPG、GIF、WebP 格式
                  </p>
                </div>
              </TabsContent>

              {/* 网站图标 */}
              <TabsContent value="favicon" className="space-y-3">
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  将自动获取网站的 favicon 图标
                </div>
              </TabsContent>
            </Tabs>
          </div>

          {/* 预览 */}
          <Card className="p-4">
            <Label className="text-sm font-medium mb-2 block">预览效果</Label>
            <div className="flex justify-center">
              <div className="flex items-center space-x-3 p-3 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-lg">
                {/* 图标预览 */}
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center text-white text-sm font-bold"
                  style={{
                    backgroundColor: formData.iconType === 'text' ? formData.iconColor : '#f8fafc',
                  }}
                >
                  {formData.iconType === 'text' && (formData.iconText || formData.title?.slice(0, 2))}
                  {formData.iconType === 'image' && formData.iconImage && (
                    <img 
                      src={formData.iconImage} 
                      alt="icon" 
                      className="w-full h-full object-cover rounded-lg"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                      }}
                    />
                  )}
                  {formData.iconType === 'favicon' && '🌐'}
                </div>
                
                {/* 文字预览 */}
                <div className="text-white text-sm font-medium">
                  {formData.title || '书签标题'}
                </div>
              </div>
            </div>
          </Card>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            取消
          </Button>
          <Button 
            onClick={handleSubmit}
            disabled={!formData.title?.trim() || !formData.url?.trim()}
          >
            {bookmark ? '保存' : '添加'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default BookmarkModal;
