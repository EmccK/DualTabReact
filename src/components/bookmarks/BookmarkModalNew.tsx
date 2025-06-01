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
import { ImageScaler } from '@/components/ui/ImageScaler';
import { Upload, Link, Type, Palette, Settings } from 'lucide-react';
import { COLOR_PALETTE } from '@/constants/bookmark-style.constants';
import { compressAndScaleImage } from '@/utils/icon-processing.utils';
import { colorWithOpacity } from '@/utils/gradient/customGradientUtils';
import type { BookmarkItem, ImageScaleConfig } from '@/types/bookmark-style.types';

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
    iconType: 'favicon', // 默认使用网站图标
    iconText: '',
    iconImage: '',
    iconColor: COLOR_PALETTE[0],
    imageScale: {
      scale: 1,
      offsetX: 0,
      offsetY: 0,
      rotation: 0,
      backgroundColor: '#ffffff',
      backgroundOpacity: 100
    }
  });

  const [urlError, setUrlError] = useState('');
  const [showImageScaler, setShowImageScaler] = useState(false);
  const [originalImageData, setOriginalImageData] = useState('');
  const [originalImageUrl, setOriginalImageUrl] = useState(''); // 保存原始URL

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
        imageScale: bookmark.imageScale || {
          scale: 1,
          offsetX: 0,
          offsetY: 0,
          rotation: 0,
          backgroundColor: '#ffffff',
          backgroundOpacity: 100
        }
      });
    } else {
      setFormData({
        title: '',
        url: '',
        description: '',
        iconType: 'favicon', // 默认使用网站图标
        iconText: '',
        iconImage: '',
        iconColor: COLOR_PALETTE[0],
        imageScale: {
          scale: 1,
          offsetX: 0,
          offsetY: 0,
          rotation: 0,
          backgroundColor: '#ffffff',
          backgroundOpacity: 100
        }
      });
    }
    setUrlError('');
    setShowImageScaler(false);
    setOriginalImageData('');
    setOriginalImageUrl('');
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
      iconImage: formData.iconType === 'favicon' ? '' : formData.iconImage?.trim(),
      iconColor: formData.iconColor || COLOR_PALETTE[0],
      imageScale: formData.imageScale,
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

  // 处理图片上传
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('请选择图片文件');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      alert('图片文件大小不能超过2MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (result) {
        setOriginalImageData(result);
        setOriginalImageUrl(''); // 清除URL状态，标记为本地上传
        setShowImageScaler(true);
        // 初始化默认缩放配置
        const defaultConfig: ImageScaleConfig = {
          scale: 1,
          offsetX: 0,
          offsetY: 0,
          rotation: 0,
          backgroundColor: '#ffffff',
          backgroundOpacity: 100
        };
        
        // 立即生成缩放后的图片以更新预览
        compressAndScaleImage(result, defaultConfig, 64, 64, 0.9)
          .then(scaledData => {
            setFormData(prev => ({ 
              ...prev, 
              iconImage: scaledData,
              imageScale: defaultConfig 
            }));
          })
          .catch(error => {
            console.error('图片处理失败:', error);
            // 如果处理失败，直接使用原图
            setFormData(prev => ({ 
              ...prev, 
              iconImage: result,
              imageScale: defaultConfig 
            }));
          });
      }
    };
    reader.readAsDataURL(file);
  };

  // 处理图片缩放配置变化
  const handleImageScaleChange = (config: ImageScaleConfig) => {
    setFormData(prev => ({ ...prev, imageScale: config }));

    // 只有本地上传的图片才需要生成新的base64
    // URL图片保持原始URL，只保存缩放配置
    if (originalImageData && !originalImageUrl) {
      // 这是本地上传的图片，生成缩放后的base64
      compressAndScaleImage(originalImageData, config, 64, 64, 0.9)
        .then(scaledData => {
          setFormData(prev => ({ ...prev, iconImage: scaledData }));
        })
        .catch(error => {
          console.error('图片缩放失败:', error);
          alert('图片缩放失败，请重试');
        });
    }
    // URL图片不修改iconImage，只保存缩放配置
  };

  // 处理URL图片的缩放
  const handleUrlImageScale = (url: string) => {
    if (!url) return;

    // 判断是否是URL（而不是base64）
    const isUrl = url.startsWith('http://') || url.startsWith('https://');

    if (isUrl) {
      // 这是URL图片，保存原始URL
      setOriginalImageUrl(url);
      setOriginalImageData(url);
    } else {
      // 这是base64图片（本地上传的）
      setOriginalImageUrl('');
      setOriginalImageData(url);
    }

    setShowImageScaler(true);

    // 使用现有的缩放配置或默认配置
    if (!formData.imageScale) {
      const defaultConfig: ImageScaleConfig = {
        scale: 1,
        offsetX: 0,
        offsetY: 0,
        rotation: 0,
        backgroundColor: '#ffffff',
        backgroundOpacity: 100
      };
      setFormData(prev => ({ ...prev, imageScale: defaultConfig }));
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
              value={formData.iconType || 'favicon'}
              onValueChange={(value) => handleInputChange('iconType', value)}
              className="w-full"
            >
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="favicon" className="flex items-center space-x-1">
                  <Link size={14} />
                  <span>网站图标</span>
                </TabsTrigger>
                <TabsTrigger value="text" className="flex items-center space-x-1">
                  <Type size={14} />
                  <span>文字</span>
                </TabsTrigger>
                <TabsTrigger value="image" className="flex items-center space-x-1">
                  <Upload size={14} />
                  <span>图片</span>
                </TabsTrigger>
              </TabsList>

              {/* 网站图标 */}
              <TabsContent value="favicon" className="space-y-3">
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  将自动获取网站的 favicon 图标
                </div>
              </TabsContent>

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
                  
                  {/* 自定义颜色输入 */}
                  <div className="flex items-center space-x-3 mt-2 mb-3">
                    <input
                      type="color"
                      value={formData.iconColor || COLOR_PALETTE[0]}
                      onChange={(e) => handleInputChange('iconColor', e.target.value)}
                      className="w-12 h-8 rounded border border-gray-300 cursor-pointer"
                      title="选择自定义颜色"
                    />
                    <Input
                      value={formData.iconColor || COLOR_PALETTE[0]}
                      onChange={(e) => handleInputChange('iconColor', e.target.value)}
                      placeholder="#3b82f6"
                      className="flex-1 font-mono text-sm"
                      maxLength={7}
                    />
                  </div>
                  
                  {/* 预设颜色快速选择 */}
                  <div>
                    <Label className="text-xs text-gray-500">快速选择</Label>
                    <div className="grid grid-cols-5 gap-2 mt-1">
                      {COLOR_PALETTE.map((color) => (
                        <button
                          key={color}
                          type="button"
                          onClick={() => handleInputChange('iconColor', color)}
                          className={`
                            w-8 h-8 rounded transition-all duration-200 border-2
                            ${formData.iconColor === color 
                              ? 'ring-2 ring-blue-500 ring-offset-2 border-blue-500' 
                              : 'border-gray-300 hover:scale-110'
                            }
                          `}
                          style={{ backgroundColor: color }}
                          title={color}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* 图片图标 */}
              <TabsContent value="image" className="space-y-3">
                <div className="space-y-3">
                  {/* 图片来源选择 - 紧凑版 */}
                  <div className="space-y-3">
                    {/* 选择方式标签 */}
                    <div className="flex border rounded-lg overflow-hidden">
                      <button
                        type="button"
                        onClick={() => document.getElementById('image-upload')?.click()}
                        className="flex-1 p-3 bg-gray-50 hover:bg-gray-100 transition-colors border-r flex items-center justify-center gap-2"
                      >
                        <Upload className="w-4 h-4 text-gray-600" />
                        <span className="text-sm font-medium text-gray-700">上传文件</span>
                      </button>
                      <div className="flex-1 p-3 bg-white">
                        <Input
                          value={formData.iconImage || ''}
                          onChange={(e) => handleInputChange('iconImage', e.target.value)}
                          placeholder="或输入图片链接"
                          className="border-0 p-0 h-auto text-sm focus-visible:ring-0 focus-visible:ring-offset-0"
                        />
                      </div>
                    </div>
                    
                    {/* 隐藏的文件输入 */}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                      id="image-upload"
                    />
                  </div>

                  {/* 图片调整功能 */}
                  {formData.iconImage && (
                    <div className="border rounded-lg overflow-hidden">
                      {/* 调整切换按钮 */}
                      <div className="bg-gray-50 p-3 flex items-center justify-between">
                        <Label className="text-sm font-medium">图片调整</Label>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            if (showImageScaler) {
                              setShowImageScaler(false);
                            } else {
                              const imageUrl = originalImageData || formData.iconImage!;
                              handleUrlImageScale(imageUrl);
                            }
                          }}
                          className="text-xs h-7 px-3"
                        >
                          <Settings className="w-3 h-3 mr-1" />
                          {showImageScaler ? '完成' : '调整图片'}
                        </Button>
                      </div>

                      {/* 图片缩放器 */}
                      {showImageScaler && originalImageData && formData.imageScale && (
                        <div className="border-t bg-white">
                          <div className="p-3">
                            <ImageScaler
                              imageUrl={originalImageData}
                              config={formData.imageScale}
                              onConfigChange={handleImageScaleChange}
                              size={48}
                              className="w-full"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  )}
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
                    backgroundColor: (() => {
                      if (formData.iconType === 'text') {
                        return formData.iconColor;
                      } else if (formData.iconType === 'image') {
                        const backgroundColor = formData.imageScale?.backgroundColor;
                        const backgroundOpacity = formData.imageScale?.backgroundOpacity ?? 100;
                        
                        // 如果有背景颜色且透明度大于0，则应用背景
                        if (backgroundColor && backgroundOpacity > 0) {
                          return colorWithOpacity(backgroundColor, backgroundOpacity);
                        }
                        // 否则使用透明背景
                        return 'transparent';
                      }
                      return '#f8fafc';
                    })(),
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
                  {formData.iconType === 'favicon' && formData.url && (() => {
                    try {
                      const hostname = new URL(formData.url).hostname;
                      const faviconUrl = `https://www.google.com/s2/favicons?domain=${hostname}&sz=32`;
                      return (
                        <img
                          src={faviconUrl}
                          alt="favicon"
                          className="w-full h-full object-cover rounded-lg"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                            if (target.parentElement) {
                              target.parentElement.innerHTML = '🌐';
                            }
                          }}
                        />
                      );
                    } catch {
                      return '🌐';
                    }
                  })()}
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
