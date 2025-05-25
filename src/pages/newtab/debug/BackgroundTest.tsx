import React from 'react';
import { useBackground } from '@/hooks/useBackground';
import { useSettings } from '@/hooks/useSettings';

export function BackgroundTest() {
  const { settings, isLoading } = useSettings();
  const { backgroundStyles } = useBackground();

  return (
    <div className="min-h-screen">
      {/* 调试信息面板 */}
      <div className="fixed top-4 right-4 z-50 bg-black/80 text-white p-4 rounded-lg max-w-md">
        <h3 className="font-bold mb-2">背景调试信息</h3>
        <div className="space-y-1 text-sm">
          <p>设置加载中: {isLoading ? '是' : '否'}</p>
          <p>背景类型: {settings.background.type}</p>
          <p>背景样式: </p>
          <pre className="text-xs overflow-auto max-h-40">
            {JSON.stringify(backgroundStyles.main, null, 2)}
          </pre>
        </div>
      </div>

      {/* 测试背景层 */}
      <div 
        className="fixed inset-0 z-0"
        style={{
          ...backgroundStyles.main,
          // 强制设置背景
          backgroundColor: backgroundStyles.main.backgroundColor || 'red',
          backgroundImage: backgroundStyles.main.backgroundImage || 'linear-gradient(45deg, blue, purple)',
        }}
      />

      {/* 内容 */}
      <div className="relative z-10 p-8">
        <h1 className="text-4xl font-bold text-white">背景测试页面</h1>
        <p className="text-white mt-4">如果你能看到这个文字，说明内容层正常。</p>
        <p className="text-white mt-2">背景应该显示为渐变色（蓝紫色）。</p>
      </div>
    </div>
  );
}
