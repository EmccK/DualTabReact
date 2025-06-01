/**
 * 图片缩放组件测试页面
 */

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ImageScaler } from '@/components/ui/ImageScaler';
import BookmarkModalNew from '@/components/bookmarks/BookmarkModalNew';
import { ArrowLeft } from 'lucide-react';
import type { ImageScaleConfig, BookmarkItem } from '@/types/bookmark-style.types';

interface ImageScalerTestProps {
  onBack?: () => void;
}

export function ImageScalerTest({ onBack }: ImageScalerTestProps) {
  const [showModal, setShowModal] = useState(false);
  const [testImageUrl, setTestImageUrl] = useState('');
  const [scaleConfig, setScaleConfig] = useState<ImageScaleConfig>({
    scale: 1,
    offsetX: 0,
    offsetY: 0,
    rotation: 0,
    backgroundColor: '#ffffff',
    backgroundOpacity: 100
  });
  const [scaledImageData, setScaledImageData] = useState('');

  // 测试图片URL
  const testImages = [
    'https://picsum.photos/200/200?random=1',
    'https://picsum.photos/300/200?random=2',
    'https://picsum.photos/200/300?random=3',
    'https://picsum.photos/400/400?random=4'
  ];

  const handleTestImage = (url: string) => {
    setTestImageUrl(url);
    setScaleConfig({
      scale: 1,
      offsetX: 0,
      offsetY: 0,
      rotation: 0,
      backgroundColor: '#ffffff',
      backgroundOpacity: 100
    });
    setScaledImageData('');
  };

  const handleScaleChange = (config: ImageScaleConfig) => {
    setScaleConfig(config);
  };

  const handleImageGenerated = (dataUrl: string) => {
    setScaledImageData(dataUrl);
  };

  const handleSaveBookmark = (bookmark: BookmarkItem) => {
    console.log('保存书签:', bookmark);
    alert('书签保存成功！查看控制台了解详情。');
    setShowModal(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* 头部导航 */}
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            onClick={onBack}
            className="flex items-center space-x-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>返回主页</span>
          </Button>
          <div className="text-center flex-1">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              图片缩放功能测试
            </h1>
            <p className="text-gray-600">
              测试书签图标的图片缩放、位置调整和旋转功能
            </p>
          </div>
          <div className="w-24"></div> {/* 占位符保持居中 */}
        </div>

        {/* 测试图片选择 */}
        <Card>
          <CardHeader>
            <CardTitle>选择测试图片</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {testImages.map((url, index) => (
                <div key={index} className="text-center">
                  <img
                    src={url}
                    alt={`测试图片 ${index + 1}`}
                    className="w-full h-32 object-cover rounded-lg border cursor-pointer hover:border-blue-500 transition-colors"
                    onClick={() => handleTestImage(url)}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-2 w-full"
                    onClick={() => handleTestImage(url)}
                  >
                    使用图片 {index + 1}
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* 图片缩放器测试 */}
        {testImageUrl && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Card>
              <CardHeader>
                <CardTitle>图片缩放控制</CardTitle>
              </CardHeader>
              <CardContent>
                <ImageScaler
                  imageUrl={testImageUrl}
                  config={scaleConfig}
                  onConfigChange={handleScaleChange}
                  onImageGenerated={handleImageGenerated}
                  size={64}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>效果预览</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">原始图片</h4>
                  <img
                    src={testImageUrl}
                    alt="原始图片"
                    className="w-32 h-32 object-cover rounded-lg border"
                  />
                </div>
                
                {scaledImageData && (
                  <div>
                    <h4 className="font-medium mb-2">缩放后图片</h4>
                    <img
                      src={scaledImageData}
                      alt="缩放后图片"
                      className="w-32 h-32 object-cover rounded-lg border"
                    />
                  </div>
                )}

                <div>
                  <h4 className="font-medium mb-2">配置信息</h4>
                  <div className="text-sm text-gray-600 space-y-1">
                    <div>缩放比例: {(scaleConfig.scale * 100).toFixed(0)}%</div>
                    <div>水平偏移: {scaleConfig.offsetX}%</div>
                    <div>垂直偏移: {scaleConfig.offsetY}%</div>
                    <div>旋转角度: {scaleConfig.rotation || 0}°</div>
                    <div>背景颜色: {scaleConfig.backgroundColor || '透明'}</div>
                    <div>背景透明度: {scaleConfig.backgroundOpacity || 0}%</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* 书签弹窗测试 */}
        <Card>
          <CardHeader>
            <CardTitle>书签弹窗测试</CardTitle>
          </CardHeader>
          <CardContent>
            <Button onClick={() => setShowModal(true)}>
              打开书签编辑弹窗
            </Button>
            <p className="text-sm text-gray-600 mt-2">
              测试在书签编辑弹窗中使用图片缩放功能
            </p>
          </CardContent>
        </Card>

        {/* 书签弹窗 */}
        <BookmarkModalNew
          open={showModal}
          onClose={() => setShowModal(false)}
          onSave={handleSaveBookmark}
          title="测试书签编辑"
        />
      </div>
    </div>
  );
}
