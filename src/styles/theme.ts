/**
 * DualTab 主题色系统
 * 基于现代清新配色方案
 * 主题色: #4F46E5 (深蓝紫), #E5E7EB (浅灰), #FAFBFC (极浅灰白), #10B981 (翠绿), #F59E0B (橙黄)
 */

// 主题色定义
export const theme = {
  // 主色调 - 深蓝紫 (#4F46E5)
  primary: {
    50: '#eef2ff',
    100: '#e0e7ff',
    200: '#c7d2fe',
    300: '#a5b4fc',
    400: '#818cf8',
    500: '#4F46E5', // 主色
    600: '#4338ca',
    700: '#3730a3',
    800: '#312e81',
    900: '#1e1b4b',
  },

  // 辅助色 - 浅灰 (#E5E7EB)
  gray: {
    50: '#f9fafb',
    100: '#f3f4f6',
    200: '#e5e7eb',
    300: '#E5E7EB', // 主灰色
    400: '#9ca3af',
    500: '#6b7280',
    600: '#4b5563',
    700: '#374151',
    800: '#1f2937',
    900: '#111827',
  },

  // 翠绿色 - 强调色 (#10B981)
  emerald: {
    50: '#ecfdf5',
    100: '#d1fae5',
    200: '#a7f3d0',
    300: '#6ee7b7',
    400: '#34d399',
    500: '#10B981', // 主翠绿色
    600: '#059669',
    700: '#047857',
    800: '#065f46',
    900: '#064e3b',
  },

  // 橙黄色 - 警告色 (#F59E0B)
  amber: {
    50: '#fffbeb',
    100: '#fef3c7',
    200: '#fde68a',
    300: '#fcd34d',
    400: '#fbbf24',
    500: '#F59E0B', // 主橙黄色
    600: '#d97706',
    700: '#b45309',
    800: '#92400e',
    900: '#78350f',
  },

  // 背景色 - 极浅灰白 (#FAFBFC)
  background: {
    50: '#FAFBFC', // 主背景色
    100: '#f8fafc',
    200: '#f1f5f9',
    300: '#e2e8f0',
    400: '#cbd5e1',
    500: '#94a3b8',
    600: '#64748b',
    700: '#475569',
    800: '#334155',
    900: '#1e293b',
  },

  // 功能色 - 基于主题色
  success: {
    50: '#ecfdf5',
    100: '#d1fae5',
    200: '#a7f3d0',
    300: '#6ee7b7',
    400: '#34d399',
    500: '#10B981', // 使用翠绿色作为成功色
    600: '#059669',
    700: '#047857',
    800: '#065f46',
    900: '#064e3b',
  },

  warning: {
    50: '#fffbeb',
    100: '#fef3c7',
    200: '#fde68a',
    300: '#fcd34d',
    400: '#fbbf24',
    500: '#F59E0B', // 使用橙黄色作为警告色
    600: '#d97706',
    700: '#b45309',
    800: '#92400e',
    900: '#78350f',
  },

  error: {
    50: '#fef2f2',
    100: '#fee2e2',
    200: '#fecaca',
    300: '#fca5a5',
    400: '#f87171',
    500: '#ef4444', // 使用红色作为错误色
    600: '#dc2626',
    700: '#b91c1c',
    800: '#991b1b',
    900: '#7f1d1d',
  },  // 预设书签背景色 - 基于新的主题色
  bookmarkColors: [
    { name: '透明', value: 'transparent', class: 'bg-transparent' },
    { name: '深蓝紫', value: '#4F46E5', class: 'bg-[#4F46E5]' },
    { name: '翠绿色', value: '#10B981', class: 'bg-[#10B981]' },
    { name: '橙黄色', value: '#F59E0B', class: 'bg-[#F59E0B]' },
    { name: '极浅灰白', value: '#FAFBFC', class: 'bg-[#FAFBFC]' },
    { name: '浅灰色', value: '#E5E7EB', class: 'bg-[#E5E7EB]' },
    { name: '深蓝色', value: '#3730a3', class: 'bg-indigo-700' },
    { name: '棋盘格', value: 'pattern', class: 'bg-gray-100' },
  ],

  // 分类预设色 - 基于新的主题色
  categoryColors: [
    { name: '默认', value: '#4F46E5', icon: '📌', class: 'bg-[#4F46E5]' },
    { name: '工作', value: '#10B981', icon: '💼', class: 'bg-[#10B981]' },
    { name: '个人', value: '#F59E0B', icon: '👤', class: 'bg-[#F59E0B]' },
    { name: '开发', value: '#6b7280', icon: '</>', class: 'bg-[#6b7280]' },
    { name: '社交', value: '#ef4444', icon: '🔗', class: 'bg-[#ef4444]' },
    { name: 'AI', value: '#8b5cf6', icon: '🤖', class: 'bg-[#8b5cf6]' },
  ],
}

// 主题应用类名 - 基于新的现代清新主题色
export const themeClasses = {
  // 弹窗容器
  modal: {
    overlay: 'bg-black/50 backdrop-blur-sm',
    container: 'bg-[#FAFBFC] border border-[#E5E7EB] shadow-xl rounded-2xl',
    header: 'border-b border-[#E5E7EB]/50',
    footer: 'border-t border-[#E5E7EB]/50',
  },

  // 按钮样式 - 使用新主题色
  button: {
    primary: 'bg-[#4F46E5] hover:bg-indigo-700 text-white shadow-md hover:shadow-lg transition-all duration-200',
    secondary: 'bg-[#E5E7EB] hover:bg-gray-400 text-gray-800 border border-[#E5E7EB] transition-all duration-200',
    success: 'bg-[#10B981] hover:bg-emerald-600 text-white transition-all duration-200',
    warning: 'bg-[#F59E0B] hover:bg-amber-600 text-gray-800 transition-all duration-200',
    error: 'bg-[#ef4444] hover:bg-red-600 text-white transition-all duration-200',
  },

  // 输入框样式
  input: {
    base: 'border border-[#E5E7EB] rounded-lg bg-[#FAFBFC] focus:border-[#4F46E5] focus:ring-2 focus:ring-[#4F46E5]/20 transition-all duration-200',
    error: 'border-[#ef4444] focus:border-[#ef4444] focus:ring-[#ef4444]/20',
    success: 'border-[#10B981] focus:border-[#10B981] focus:ring-[#10B981]/20',
  },

  // 标签页样式
  tabs: {
    container: 'bg-[#E5E7EB]/30 rounded-lg p-1',
    trigger: 'data-[state=active]:bg-[#FAFBFC] data-[state=active]:text-[#4F46E5] data-[state=active]:shadow-sm transition-all duration-200',
    content: 'mt-4',
  },

  // 图标选择器样式
  iconSelector: {
    button: {
      base: 'border-2 rounded-lg transition-all duration-200',
      active: 'border-[#4F46E5] bg-[#4F46E5] text-white shadow-md',
      inactive: 'border-[#E5E7EB] hover:border-[#4F46E5] hover:bg-[#FAFBFC]',
    },
    preview: 'rounded-lg border border-[#E5E7EB] shadow-sm bg-[#FAFBFC]',
  },  // 颜色选择器样式
  colorPicker: {
    button: {
      base: 'rounded-lg border-2 transition-all duration-200 hover:scale-105',
      active: 'border-[#4F46E5] ring-2 ring-[#4F46E5]/20 shadow-md',
      inactive: 'border-[#E5E7EB] hover:border-[#4F46E5]/50 shadow-sm',
    },
    custom: 'bg-[#FAFBFC] border border-[#E5E7EB] rounded-lg',
  },

  // 分类选择器样式
  categorySelector: {
    button: {
      base: 'rounded-lg border transition-all duration-200',
      active: 'border-[#4F46E5] bg-[#FAFBFC] text-[#4F46E5]',
      inactive: 'border-[#E5E7EB] hover:border-[#4F46E5]/50 hover:bg-[#FAFBFC]/50',
    },
  },
}

// 主题工具函数
export const getThemeColor = (color: keyof typeof theme, shade: number = 500) => {
  return theme[color]?.[shade as keyof typeof theme[typeof color]] || theme.primary[500]
}

export const getBookmarkColorClass = (colorValue: string) => {
  const color = theme.bookmarkColors.find(c => c.value === colorValue)
  return color?.class || 'bg-[#FF5E5B]'
}

export const getCategoryColorClass = (colorValue: string) => {
  const color = theme.categoryColors.find(c => c.value === colorValue)
  return color?.class || 'bg-[#FF5E5B]'
}

// 主题色常量 - 便于直接使用
export const THEME_COLORS = {
  INDIGO_BLUE: '#4F46E5',      // 深蓝紫 - 主色
  LIGHT_GRAY: '#E5E7EB',       // 浅灰 - 辅助色
  BACKGROUND_WHITE: '#FAFBFC', // 极浅灰白 - 背景色
  EMERALD_GREEN: '#10B981',    // 翠绿 - 强调色
  AMBER_ORANGE: '#F59E0B',     // 橙黄 - 警告色
} as const

// 导出默认主题
export default theme