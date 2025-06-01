/**
 * ImageScaler重置功能测试组件
 */

import React, { useState } from 'react';
import { ImageScaler } from '@/components/ui/ImageScaler';
import { Button } from '@/components/ui/button';
import type { ImageScaleConfig } from '@/types/bookmark-style.types';

const ImageScalerTest: React.FC = () => {
  const [config, setConfig] = useState<ImageScaleConfig>({
    scale: 1,
    offsetX: 0,
    offsetY: 0,
    rotation: 0,
    backgroundColor: '#ffffff',
    backgroundOpacity: 100
  });

  const [generatedImage, setGeneratedImage] = useState<string>('');

  // 测试图片 - 使用一个在线图片
  const testImageUrl = 'https://via.placeholder.com/200x200/4ade80/ffffff?text=TEST';

  const handleConfigChange = (newConfig: ImageScaleConfig) => {
    console.log('配置变更:', newConfig);
    setConfig(newConfig);
  };

  const handleImageGenerated = (dataUrl: string) => {
    console.log('生成新图片:', dataUrl.substring(0, 50) + '...');
    setGeneratedImage(dataUrl);
  };

  const testRandomConfig = () => {
    setConfig({
      scale: Math.random() * 2 + 0.5, // 0.5-2.5
      offsetX: (Math.random() - 0.5) * 200, // -100 to 100
      offsetY: (Math.random() - 0.5) * 200, // -100 to 100
      rotation: Math.random() * 360,
      backgroundColor: `#${Math.floor(Math.random()*16777215).toString(16)}`,
      backgroundOpacity: Math.floor(Math.random() * 100)
    });
  };

  return (
    <div className="p-6 space-y-6 max-w-2xl mx-auto">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">ImageScaler 重置功能测试</h1>
        <p className="text-gray-600">测试图片缩放组件的重置按钮是否正常工作</p>
      </div>

      {/* 测试按钮 */}
      <div className="flex justify-center space-x-4">
        <Button onClick={testRandomConfig}>
          随机配置
        </Button>
        <Button variant="outline" onClick={() => console.log('当前配置:', config)}>
          打印配置
        </Button>
      </div>

      {/* 当前配置显示 */}
      <div className="bg-gray-100 p-4 rounded-lg">
        <h3 className="font-medium mb-2">当前配置:</h3>
        <pre className="text-sm text-gray-700">
          {JSON.stringify(config, null, 2)}
        </pre>
      </div>

      {/* ImageScaler组件 */}
      <div className="border-2 border-gray-200 rounded-lg p-4">
        <h3 className="font-medium mb-4">图片缩放器 (重置按钮测试)</h3>
        <ImageScaler
          imageUrl={testImageUrl}
          config={config}
          onConfigChange={handleConfigChange}
          onImageGenerated={handleImageGenerated}
          size={64}
          className="w-full"
        />
      </div>

      {/* 生成的图片预览 */}
      {generatedImage && (
        <div className="text-center">
          <h3 className="font-medium mb-2">生成的图片:</h3>
          <img 
            src={generatedImage} 
            alt="Generated" 
            className="mx-auto border border-gray-300 rounded"
            style={{ width: '128px', height: '128px', imageRendering: 'pixelated' }}
          />
        </div>
      )}

      {/* 测试说明 */}
      <div className="bg-blue-50 p-4 rounded-lg">
        <h3 className="font-medium text-blue-800 mb-2">测试步骤:</h3>
        <ol className="list-decimal list-inside text-sm text-blue-700 space-y-1">
          <li>点击"随机配置"按钮设置一些随机值</li>
          <li>观察图片预览和滑块数值的变化</li>
          <li>点击"重置"按钮</li>
          <li>确认所有值都回到默认状态 (缩放100%, 位置0, 旋转0°等)</li>
          <li>预览图片应该立即更新为默认状态</li>
        </ol>
      </div>

      {/* 预期结果 */}
      <div className="bg-green-50 p-4 rounded-lg">
        <h3 className="font-medium text-green-800 mb-2">预期结果:</h3>
        <ul className="list-disc list-inside text-sm text-green-700 space-y-1">
          <li>重置按钮始终可点击，不会被禁用</li>
          <li>点击重置后，所有配置立即回到默认值</li>
          <li>预览图片立即更新，不需要等待</li>
          <li>控制台应该显示配置变更日志</li>
        </ul>
      </div>
    </div>
  );
};

export default ImageScalerTest;
