import React from 'react';
import { cn } from '@/lib/utils';
import { useBackground } from '@/hooks/useBackground';
import { useSettings } from '@/hooks/useSettings';

interface BackgroundWrapperProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * 背景包装器组件
 * 将背景设置应用到页面元素
 */
export function BackgroundWrapper({ children, className }: BackgroundWrapperProps) {
  const { isLoading } = useSettings();
  const { backgroundStyles, settings } = useBackground();
  
  // 如果设置正在加载，使用默认渐变背景避免闪烁
  const defaultBackgroundStyle = {
    backgroundImage: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat',
  };
  
  // 调试日志
  console.log('BackgroundWrapper - isLoading:', isLoading);
  console.log('BackgroundWrapper - settings:', settings);
  console.log('BackgroundWrapper - backgroundStyles:', backgroundStyles);
  
  // 确保始终有背景
  const currentBackgroundStyle = isLoading 
    ? defaultBackgroundStyle 
    : {
        ...backgroundStyles.main,
        // 如果没有背景图像，使用默认渐变作为后备
        backgroundImage: backgroundStyles.main.backgroundImage === 'none' 
          ? defaultBackgroundStyle.backgroundImage 
          : backgroundStyles.main.backgroundImage,
      };

  return (
    <div className={cn('relative min-h-screen w-full overflow-hidden', className)}>
      {/* 主背景层 - 添加 !important 确保样式优先级 */}
      <div
        className="fixed inset-0 z-0"
        style={{
          ...currentBackgroundStyle,
          // 确保背景完全覆盖
          width: '100vw',
          height: '100vh',
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
        }}
      />
      
      {/* 叠加层 */}
      {!isLoading && backgroundStyles.hasOverlay && (
        <div
          className="fixed inset-0 z-0"
          style={{
            ...backgroundStyles.overlay,
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
          }}
        />
      )}
      
      {/* 内容层 - 确保在背景之上 */}
      <div className="relative z-10 min-h-screen">
        {children}
      </div>
    </div>
  );
}
