# DualTab - 可自定义内外网地址的新标签页

一个基于 React + TypeScript 的 Chrome 浏览器扩展，提供高度可自定义的新标签页体验，支持内外网地址快速切换和多样化背景主题。

## ✨ 主要功能

### 🔗 智能书签管理
- **网络模式切换**：支持内网/外网地址双模式，一键切换不同环境
- **分类管理**：支持书签分类，可自定义分类名称和图标
- **快速添加**：通过弹窗快速添加当前页面为书签
- **多样式布局**：支持网格、卡片等多种书签显示样式
- **图标自定义**：支持上传自定义图标、文字图标、官方图标等

### 🎨 背景主题系统
- **多种背景类型**：
  - 纯色背景
  - 渐变背景（预设 + 自定义渐变编辑器）
  - 图片背景（本地上传 + 随机图片）
  - 图片库管理
- **自动切换**：支持按时间间隔自动切换背景
- **缓存管理**：智能图片缓存，提升加载速度

### 🔍 搜索功能
- **多搜索引擎**：支持 Google、百度、必应等主流搜索引擎
- **搜索引擎切换**：一键切换不同搜索引擎
- **智能搜索框**：支持关键词搜索和直接 URL 访问

### ⚙️ 个性化设置
- **时钟显示**：可选择显示/隐藏时钟
- **界面布局**：可调整各组件位置和大小
- **主题配色**：支持自定义主题色彩
- **数据备份**：支持设置和书签数据的导入/导出

## 🛠️ 技术栈

- **前端框架**：React 19 + TypeScript
- **构建工具**：Vite 6
- **UI 组件**：Radix UI + Tailwind CSS
- **图标库**：Lucide React
- **浏览器 API**：Chrome Extension API v3

## 📁 项目结构

```
src/
├── components/          # 组件库
│   ├── background/     # 背景相关组件
│   ├── bookmarks/      # 书签相关组件
│   ├── categories/     # 分类管理组件
│   ├── search/         # 搜索组件
│   ├── settings/       # 设置页面组件
│   └── ui/            # 基础 UI 组件
├── hooks/              # 自定义 Hook
├── services/           # 业务逻辑服务
├── types/              # TypeScript 类型定义
├── utils/              # 工具函数
└── pages/              # 页面组件
    ├── newtab/        # 新标签页
    └── popup/         # 扩展弹窗
```

## 🚀 开发指南

### 环境要求
- Node.js 16+
- Chrome 浏览器

### 安装依赖
```bash
npm install
```

### 开发模式
```bash
npm run dev
```

### 构建扩展
```bash
npm run build
```

构建完成后会在 `dist` 目录生成扩展文件。

### 加载扩展
1. 打开 Chrome 浏览器
2. 访问 `chrome://extensions/`
3. 开启"开发者模式"
4. 点击"加载已解压的扩展程序"
5. 选择项目的 `dist` 目录

### 代码检查
```bash
npm run lint
```

## 📦 构建说明

项目使用 Vite 构建，配置了以下特性：
- TypeScript 支持
- Hot Module Replacement (HMR)
- Chrome Extension API 类型支持
- 自动化构建后处理脚本

## 🔧 扩展权限

- `storage`：存储用户设置和书签数据
- `unlimitedStorage`：支持大量图片缓存
- `tabs`：获取当前标签页信息
- `activeTab`：访问当前活动标签页

## 📝 更新日志

### v1.0.0
- 基础书签管理功能
- 多种背景主题支持
- 内外网地址切换
- 搜索引擎集成
- 个性化设置系统

## 🤝 贡献指南

1. Fork 本仓库
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 🐛 问题反馈

如果您发现了 bug 或有功能建议，请在 [Issues](../../issues) 页面提交。