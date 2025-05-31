import React from 'react';

interface SeparatorProps {
  className?: string;
  orientation?: 'horizontal' | 'vertical';
}

export const Separator: React.FC<SeparatorProps> = ({ 
  className = '', 
  orientation = 'horizontal' 
}) => {
  return (
    <div
      className={`
        ${orientation === 'horizontal' 
          ? 'h-px w-full border-t border-gray-200 dark:border-gray-700' 
          : 'w-px h-full border-l border-gray-200 dark:border-gray-700'
        } 
        ${className}
      `}
    />
  );
};

export default Separator;