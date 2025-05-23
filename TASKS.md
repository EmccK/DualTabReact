# DualTab Chrome插件重构任务清单

## 项目概述
将传统JavaScript实现的DualTab Chrome插件迁移到React + Shadcn/UI技术栈。

源项目分析：
- 功能丰富的新标签页插件，支持内外网双模式
- 包含书签管理、分类系统、背景图片管理、WebDAV同步等核心功能
- 使用模块化架构，HTML片段动态加载
- 支持多种图标类型（官方、文字、上传）和自定义背景色

---

## 功能模块 1：基础架构与配置（优先级：高）
- [x] 子功能 1.1：配置Chrome插件基础结构
  - 完成日期：2025-05-22
  - 实现方式：修复TypeScript配置和构建脚本
  - 修改/新增文件：
    - tsconfig.scripts.json（新增）
    - tsconfig.json（更新）
    - tsconfig.app.json（更新）
    - tsconfig.node.json（更新）
    - package.json（更新构建脚本）
    - src/content/content-script.ts（修复未使用参数警告）
  - 测试方法：运行 `npm run build` 命令成功构建，生成dist目录
  - 备注：
    - 解决了TypeScript JSX配置问题
    - 解决了Chrome扩展脚本的DOM类型问题
    - 分离了React应用和扩展脚本的TypeScript配置
    - 构建脚本分为build（快速构建）和build:check（包含类型检查）
  
- [x] 子功能 1.2：建立核心存储与工具模块
  - 完成日期：2025-05-22
  - 实现方式：完全现代化重构，使用TypeScript和React Hooks
  - 修改/新增文件：
    - src/types/index.ts（新增）- 完整的TypeScript类型定义
    - src/utils/storage.ts（新增）- 现代化存储API封装，支持缓存和错误处理
    - src/utils/bookmark-utils.ts（新增）- 完整的书签操作工具函数
    - src/models/BookmarkCategory.ts（新增）- 分类数据模型和工具函数
    - src/hooks/useStorage.ts（新增）- 存储相关React Hooks
    - src/hooks/useSplashApi.ts（新增）- Unsplash API管理Hook
    - src/hooks/useDataBackup.ts（新增）- 数据备份恢复Hook
    - src/hooks/useBookmarks.ts（新增）- 书签管理Hook
    - src/utils/index.ts（新增）- 工具函数统一导出
    - src/hooks/index.ts（新增）- Hooks统一导出
  - 测试方法：可通过import测试各模块功能，Chrome存储API调用正常
  - 备注：
    - **代码结构优化**：拆分为更小的模块，提高代码可维护性
    - **类型安全**：完整的TypeScript类型定义，避免运行时错误
    - **性能优化**：实现内存缓存机制，减少Chrome API调用次数
    - **错误处理**：统一的错误处理机制，提供详细错误信息
    - **React Hook模式**：现代化的状态管理，支持加载状态和错误状态
    - **数据验证**：严格的数据格式验证，确保数据一致性
    - **批量操作**：支持批量添加/删除书签，提高操作效率
    - **搜索和排序**：内置搜索和排序功能，提升用户体验
    - **备份恢复**：完整的数据备份和恢复机制
    - **API管理**：Unsplash API限制监控和管理
  
- [x] 子功能 1.3：配置路由与页面结构
  - 完成日期：2025-05-22
  - 实现方式：建立完整的现代化布局系统和UI组件库
  - 修改/新增文件：
    - src/lib/utils.ts（新增）- Shadcn/UI核心工具函数
    - src/components/ui/button.tsx（新增）- 按钮组件
    - src/components/ui/card.tsx（新增）- 卡片组件  
    - src/components/ui/input.tsx（新增）- 输入框组件
    - src/components/ui/dialog.tsx（新增）- 对话框组件
    - src/components/layout/Header.tsx（新增）- 头部布局组件
    - src/components/layout/SearchBar.tsx（新增）- 搜索栏组件
    - src/components/layout/BackgroundContainer.tsx（新增）- 背景容器组件
    - src/components/layout/MainLayout.tsx（新增）- 主布局组件
    - src/components/layout/index.ts（新增）- 布局组件导出
    - src/components/index.ts（新增）- 组件统一导出
    - src/hooks/useClock.ts（新增）- 实时时钟Hook
    - src/hooks/index.ts（更新）- 添加时钟Hook导出
    - src/pages/newtab/NewTabApp.tsx（重构）- 使用新布局系统的主页面
    - tsconfig.app.json（更新）- 添加路径别名支持
    - tailwind.config.js（新增）- Tailwind CSS配置
    - postcss.config.js（新增）- PostCSS配置
    - src/index.css（重构）- 添加Shadcn/UI样式变量
    - src/pages/newtab/index.css（重构）- 添加样式变量
    - package.json（通过npm安装）- 添加UI库依赖
  - 测试方法：运行 `npm run build` 成功构建，页面显示现代化布局和组件
  - 备注：
    - **样式系统修复**：正确配置Tailwind CSS v4和PostCSS，解决样式不显示问题
    - **代码结构优化**：按功能模块拆分组件，每个组件职责单一
    - **现代化UI系统**：集成Shadcn/UI组件库，提供一致的设计语言
    - **布局系统架构**：
      - MainLayout：主布局容器，整合所有布局元素
      - Header：头部组件，包含时钟和操作按钮
      - SearchBar：搜索栏组件，支持Google搜索和URL跳转
      - BackgroundContainer：背景容器，支持图片背景和归属信息显示
    - **性能优化**：
      - 使用React.memo和useCallback优化渲染性能
      - 实时时钟使用自定义Hook，避免不必要的重渲染
      - 背景图片懒加载和错误处理机制
    - **用户体验优化**：
      - 毛玻璃效果的半透明卡片设计
      - 平滑的hover动画和过渡效果
      - 响应式布局适配不同屏幕尺寸
      - 实时时钟显示和网络模式切换
    - **TypeScript类型安全**：所有组件都有完整的类型定义
    - **可扩展性**：组件化架构便于后续功能添加和维护
    - **文件拆分原则**：
      - UI组件按功能分类，每个组件独立文件
      - 布局组件按职责分离，便于复用和维护
      - 工具函数和Hooks独立组织，提高代码复用性

- [x] 子功能 1.4：UI界面重构 - 贴近原始设计
  - 完成日期：2025-05-22
  - 实现方式：完全重构NewTabApp组件，还原原始新标签页的设计和布局
  - 修改/新增文件：
    - src/pages/newtab/NewTabApp.tsx（重构）- 重新设计符合原始项目的UI布局
  - 测试方法：运行 `npm run build` 成功构建，页面显示接近原始设计的新标签页
  - 备注：
    - **UI/UX优化**：
      - 完全重构页面布局，移除了功能状态卡片，改为真正的新标签页设计
      - 实现了左上角时间日期显示，显示格式与原版一致
      - 右上角控制按钮组：毛玻璃效果切换、WebDAV同步、网络模式切换
      - 居中的Google搜索框，使用实际的Google logo图片
      - 右下角固定的添加书签和刷新背景按钮（圆形浮动按钮）
      - 背景图片归属信息显示在右下角
    - **视觉设计改进**：
      - 深色渐变背景（slate-900到blue-900），营造深邃的夜间效果
      - 毛玻璃效果（backdrop-blur）的半透明容器，提供现代化的视觉层次
      - 所有交互元素都支持毛玻璃效果的开关切换
      - 平滑的hover动画和过渡效果
      - 响应式设计，适配不同屏幕尺寸
    - **交互体验优化**：
      - 实时时钟显示，自动更新时间和日期
      - 网络模式切换带有状态颜色指示（绿色外网，黄色内网）
      - Google搜索支持回车键提交，在新标签页打开搜索结果
      - 所有按钮都有hover效果和工具提示
      - 书签网格预留区域，为后续功能实现做准备
    - **代码结构优化**：
      - 使用React Hooks进行状态管理
      - 组件化的事件处理函数，便于后续功能扩展
      - TypeScript类型安全，减少运行时错误
      - 现代化的CSS类名组织，使用Tailwind CSS实用类
    - **Chrome扩展适配**：
      - 使用相对路径引用Google logo图片
      - 所有样式都通过Tailwind CSS生成，无需外部资源
      - 布局完全自包含，不依赖外部字体或图标库
    - **性能优化**：
      - 使用useCallback缓存事件处理函数
      - 条件渲染减少不必要的DOM节点
      - CSS过渡动画使用GPU加速属性
    - **用户体验细节**：
      - 空状态友好提示，引导用户添加书签
      - 加载状态和错误处理准备就绪
      - 可访问性考虑，所有按钮都有适当的aria-label
      
## 功能模块 2：核心书签系统（优先级：高）
- [x] 子功能 2.1：书签数据管理
  - 完成日期：2025-05-23
  - 实现方式：完整的书签展示和拖拽功能，现代化React组件设计
  - 修改/新增文件：
    - src/types/index.ts（更新）- 扩展Bookmark类型，添加position字段支持书签排序
    - src/components/bookmarks/BookmarkCard.tsx（新增）- 可拖拽的书签卡片组件
    - src/components/bookmarks/BookmarkGrid.tsx（新增）- 支持拖拽排序的书签网格组件
    - src/components/bookmarks/index.ts（新增）- 书签组件导出
    - src/components/index.ts（更新）- 添加书签组件导出
    - src/hooks/useBookmarks.ts（更新）- 添加批量更新和重排序功能
    - src/utils/bookmark-utils.ts（更新）- createBookmark函数支持position字段
    - src/pages/newtab/NewTabApp.tsx（重构）- 集成BookmarkGrid，连接书签管理功能
    - src/pages/newtab/newtab.css（新增）- 拖拽动画和响应式设计样式
  - 测试方法：运行 `npm run build` 成功构建，在Chrome扩展中测试书签展示和拖拽功能
  - 备注：
    - **功能实现**：
      - 完整的书签卡片展示系统，支持三种图标类型（官方favicon、文字图标、上传图片）
      - HTML5 Drag & Drop API实现的拖拽重排序功能，支持桌面和触摸设备
      - 书签按position字段排序，支持拖拽后自动保存新顺序
      - 根据网络模式（内网/外网）智能选择显示URL和跳转链接
      - 完整的加载状态、错误处理和空状态显示
      - 书签右键菜单预留接口，为后续编辑功能做准备
    - **拖拽功能特性**：
      - 拖拽时的视觉反馈：半透明效果、旋转动画、目标位置指示线
      - 平滑的插入动画和位置调整动画效果
      - 拖拽过程中的碰撞检测和位置计算
      - 拖拽完成后的批量位置更新和持久化存储
      - 支持拖拽操作的撤销和错误恢复机制
    - **UI/UX优化**：
      - 现代化的毛玻璃效果卡片设计，与整体页面风格一致
      - 响应式网格布局，适配2-8列显示（根据屏幕尺寸自动调整）
      - 书签卡片的hover动画和交互反馈效果
      - 网络模式指示器，显示当前使用的URL类型
      - 书签URL提示框，hover时显示完整链接地址
      - 加载状态的shimmer动画效果
      - 错误状态的shake动画和友好提示
    - **性能优化**：
      - 使用React.memo和useCallback优化组件渲染性能
      - 拖拽过程中的防抖处理，减少频繁的状态更新
      - 批量更新书签位置，避免单个书签的频繁存储操作
      - 图标加载失败时的graceful fallback机制
      - CSS动画使用GPU加速属性，提升动画流畅度
    - **代码质量优化**：
      - 完整的TypeScript类型定义，确保类型安全
      - 组件化设计，BookmarkCard和BookmarkGrid职责分离
      - 统一的错误处理和状态管理模式
      - 详细的代码注释和函数文档
      - 遵循React Hooks最佳实践
    - **Chrome扩展适配**：
      - 确保拖拽功能在Chrome扩展环境中正常工作
      - 正确处理相对路径的图片资源引用
      - CSP策略兼容的事件处理机制
      - 扩展环境下的存储API优化使用
    - **用户体验细节**：
      - 空状态时的友好引导界面，鼓励用户添加第一个书签
      - 拖拽操作的直观视觉指导和反馈
      - 网络模式切换时的平滑过渡效果
      - 书签数量统计和当前模式显示
      - 可访问性考虑，支持键盘导航和屏幕阅读器
    - **扩展性设计**：
      - 为后续的书签编辑、删除功能预留接口
      - 支持未来的分类筛选和搜索功能
      - 为右键菜单功能预留事件处理机制
      - 为批量操作功能预留选择状态管理
      
- [ ] 子功能 2.2：书签弹窗系统
  - 实现BookmarkManager React组件
  - 实现书签CRUD操作（增删改查）
  - 实现书签渲染网格组件
  
- [ ] 子功能 2.2：书签弹窗系统
  - 实现添加/编辑书签Modal组件
  - 实现图标选择器（官方、文字、上传三种类型）
  - 实现颜色选择器组件
  
- [ ] 子功能 2.3：内外网双模式支持
  - 实现网络模式切换组件
  - 实现根据模式显示对应URL的逻辑
  - 实现模式切换时的书签更新

## 功能模块 3：分类管理系统（优先级：高）
- [ ] 子功能 3.1：分类基础功能
  - 实现分类选择器组件
  - 实现分类创建/编辑Modal
  - 实现分类图标与颜色自定义
  
- [ ] 子功能 3.2：分类与书签关联
  - 实现书签按分类过滤显示
  - 实现分类切换动画效果
  - 实现书签与分类的关联管理

## 功能模块 4：背景图片系统（优先级：中）
- [ ] 子功能 4.1：背景图片基础功能
  - 实现背景图片显示组件
  - 实现刷新背景按钮
  - 迁移本地默认背景图片
  
- [ ] 子功能 4.2：Unsplash API集成
  - 实现Unsplash API调用
  - 实现图片缓存系统
  - 实现API限额监控与回退机制
  
- [ ] 子功能 4.3：背景图片归属信息
  - 实现图片信息展示组件
  - 实现归属信息的获取与显示

## 功能模块 5：搜索与导航（优先级：中）
- [ ] 子功能 5.1：搜索功能
  - 实现搜索输入框组件
  - 实现Google搜索表单提交
  - 实现搜索框样式与交互
  
- [ ] 子功能 5.2：时钟组件
  - 实现数字时钟显示
  - 实现时间格式化
  - 实现时钟更新逻辑

## 功能模块 6：WebDAV同步系统（优先级：中）
- [ ] 子功能 6.1：WebDAV配置
  - 实现WebDAV配置Modal
  - 实现连接测试功能
  - 实现配置信息的存储与加载
  
- [ ] 子功能 6.2：同步功能
  - 实现数据上传/下载逻辑
  - 实现自动同步机制
  - 实现同步状态显示
  
- [ ] 子功能 6.3：冲突处理
  - 实现数据冲突检测
  - 实现冲突解决界面
  - 实现备份与恢复功能

## 功能模块 7：弹出窗口(Popup)（优先级：中）
- [ ] 子功能 7.1：快速添加书签
  - 实现Popup页面布局
  - 实现当前页面信息自动填充
  - 实现快速添加表单提交
  
- [ ] 子功能 7.2：Popup界面优化
  - 实现适合扩展窗口的样式
  - 实现表单验证与错误提示
  - 实现分类选择集成

## 功能模块 8：高级功能与优化（优先级：低）
- [ ] 子功能 8.1：性能优化
  - 实现毛玻璃效果切换
  - 实现性能检测与自适应
  - 实现操作锁定机制
  
- [ ] 子功能 8.2：用户体验优化
  - 实现分类切换动画
  - 实现加载状态指示
  - 实现错误处理与用户反馈
  
- [ ] 子功能 8.3：右键菜单与快捷操作
  - 实现右键菜单拦截
  - 实现书签快捷编辑/删除
  - 实现键盘快捷键支持

## 功能模块 9：后台脚本与内容脚本（优先级：低）
- [ ] 子功能 9.1：后台服务worker
  - 迁移background.js功能
  - 实现书签刷新消息处理
  - 实现扩展生命周期管理
  
- [ ] 子功能 9.2：内容脚本
  - 迁移content-script.js功能
  - 实现页面信息提取
  - 实现与background的通信

## 功能模块 10：最终整合与测试（优先级：低）
- [ ] 子功能 10.1：功能整合测试
  - 测试所有功能模块集成
  - 修复功能间的兼容性问题
  - 优化整体性能表现
  
- [ ] 子功能 10.2：打包与部署
  - 配置生产环境构建
  - 生成Chrome插件包
  - 验证插件安装与运行

---

## 工作说明
1. 每次只实现一个子功能，完成后等待验证
2. 优先完成高优先级功能模块
3. 每个子功能完成后会标记完成状态并记录实现详情
4. 严格按照React + Shadcn/UI技术栈要求实现
