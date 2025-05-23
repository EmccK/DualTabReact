# 开发规范与最佳实践

## 1. 代码风格与结构规范

### 组件组织
- UI基础组件存放在 `src/components/ui/`
- 功能组件按模块存放，如 `src/components/bookmarks/`
- 每个组件文件夹包含 `index.ts` 进行统一导出
- 组件使用 PascalCase 命名，文件名与组件名保持一致

### TypeScript规范
- 所有组件必须有完整的TypeScript类型定义
- 使用 `interface` 定义组件props和数据结构
- 类型定义统一存放在 `src/types/index.ts`
- 严格模式下无 `any` 类型，必要时使用 `unknown`

### React Hooks规范
- 自定义Hooks存放在 `src/hooks/` 目录
- Hook命名必须以 `use` 开头
- 使用 `useCallback` 和 `useMemo` 优化性能
- 状态管理优先使用React内置Hooks，复杂状态考虑上下文

### CSS与样式规范
- 优先使用Tailwind CSS实用类
- 自定义样式使用CSS Modules或单独的.css文件
- 动画和过渡效果使用GPU加速属性
- 响应式设计遵循移动优先原则

## 2. 用户界面设计规范

### 主题系统
- 统一使用 `src/styles/theme.ts` 中定义的主题色
- 强制亮色模式，所有HTML文件添加 `class="light"`
- 移除所有暗色模式相关样式，确保一致的视觉体验
- 主题色：深蓝紫(#4F46E5)、浅灰(#E5E7EB)、极浅灰白(#FAFBFC)、翠绿(#10B981)、橙黄(#F59E0B)

### 布局设计原则
- 弹窗布局优先考虑减少滚动需求
- 使用响应式网格布局，充分利用水平空间
- 相关功能就近放置，减少用户视线移动
- 保持组件间距的一致性：主区域 `space-y-4`，子组件 `space-y-2`

### 交互设计规范
- 所有交互元素必须有hover状态和过渡动画
- 加载状态使用一致的动画效果（shimmer、spinner等）
- 错误状态提供清晰的用户反馈和操作建议
- 支持键盘导航和无障碍访问

## 3. 性能优化规范

### 渲染优化
- 使用 `React.memo` 包装纯组件，避免不必要的重渲染
- 事件处理函数使用 `useCallback` 进行缓存
- 计算密集型操作使用 `useMemo` 进行缓存
- 大列表使用虚拟滚动或分页加载

### 资源管理
- 图片资源使用懒加载和错误处理机制
- 组件按需导入，避免打包体积过大
- Chrome存储API使用批量操作，减少调用频次
- 实现内存缓存机制，减少重复的API调用

### Chrome扩展优化
- 确保所有功能在扩展环境中正常工作
- 遵循Chrome扩展的CSP（内容安全策略）
- 使用相对路径处理资源引用
- 优化manifest.json权限配置

## 4. 数据管理规范

### 存储结构
- 使用Chrome存储API进行数据持久化
- 数据结构设计考虑向后兼容性
- 实现数据迁移机制，支持版本升级
- 关键数据提供备份和恢复功能

### 状态管理
- 优先使用React内置状态管理
- 全局状态使用Context API
- 异步操作使用自定义Hooks封装
- 状态更新遵循不可变数据原则

### 数据验证
- 所有用户输入进行严格验证
- 使用TypeScript类型守卫进行数据类型检查
- 实现数据格式校验和错误处理
- 提供数据一致性检查机制

## 5. 测试与质量保证

### 构建验证
- 每次代码提交前运行 `npm run build` 确保构建成功
- 使用TypeScript严格模式进行类型检查
- 确保所有路径别名和导入路径正确
- 验证生成的Chrome扩展包可正常安装

### 功能测试
- 每个组件完成后进行基础功能测试
- 测试不同浏览器和屏幕尺寸的兼容性
- 验证Chrome扩展的权限和API调用
- 测试数据存储和恢复功能

### 用户体验测试
- 验证所有交互动画的流畅性
- 测试响应式布局在不同设备上的表现
- 检查加载状态和错误处理的用户友好性
- 验证无障碍访问功能

## 6. 组件开发标准

### 组件设计原则
- 单一职责原则：每个组件只负责一个功能
- 可复用性：组件设计考虑在不同场景下的复用
- 可配置性：通过props提供必要的配置选项
- 可扩展性：为未来功能扩展预留接口

### 组件结构模板
```typescript
import React, { useState, useCallback } from 'react'
import { cn } from '@/lib/utils'

interface ComponentProps {
  // 定义props类型
  className?: string
  onSomeEvent?: (data: SomeType) => void
}

export function Component({ className, onSomeEvent }: ComponentProps) {
  // 状态管理
  const [state, setState] = useState<SomeType>()
  
  // 事件处理
  const handleEvent = useCallback(() => {
    // 事件处理逻辑
  }, [])
  
  return (
    <div className={cn("base-classes", className)}>
      {/* 组件内容 */}
    </div>
  )
}
```

### 错误处理标准
- 所有异步操作必须包含错误处理
- 用户操作失败时提供清晰的错误信息
- 实现错误边界组件捕获渲染错误
- 记录错误日志便于调试和维护

## 7. 文件命名和组织规范

### 文件命名
- 组件文件使用PascalCase：`BookmarkCard.tsx`
- 工具函数文件使用kebab-case：`bookmark-utils.ts`
- 样式文件使用kebab-case：`newtab.css`
- 类型定义文件使用简洁名称：`index.ts`

### 目录结构
```
src/
├── components/          # 组件目录
│   ├── ui/             # 基础UI组件
│   ├── bookmarks/      # 书签相关组件
│   └── layout/         # 布局组件
├── hooks/              # 自定义Hooks
├── utils/              # 工具函数
├── types/              # 类型定义
├── styles/             # 样式文件
└── pages/              # 页面组件
```

### 导入导出规范
- 每个模块目录包含index.ts进行统一导出
- 使用路径别名简化导入路径：`@/components`
- 优先使用命名导出，避免默认导出的歧义
- 按功能分组导入，保持导入语句的整洁

## 8. Git提交和版本管理

### 提交信息规范
- 格式：`类型(范围): 描述`
- 类型：feat(新功能)、fix(修复)、refactor(重构)、style(样式)、docs(文档)
- 范围：组件名或功能模块名
- 描述：简洁明了的中文描述

### 分支管理
- main分支保持稳定可用状态
- 功能开发使用feature分支
- 修复使用hotfix分支
- 定期合并和清理分支
