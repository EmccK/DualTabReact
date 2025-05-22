# DualTab Chrome 扩展

一个可自定义内外网地址的新标签页Chrome扩展。

## 🚀 安装步骤

### 1. 构建项目
```bash
npm install
npm run build
```

### 2. 在Chrome中安装扩展

1. 打开Chrome浏览器
2. 在地址栏输入：`chrome://extensions/`
3. 打开右上角的"开发者模式"
4. 点击"加载已解压的扩展程序"
5. 选择项目中的 `dist` 文件夹
6. 扩展将会被安装并激活

### 3. 验证安装

- 打开新标签页，应该会看到自定义的新标签页界面
- 点击扩展图标，会弹出快速添加界面

## 🔧 开发

### 开发模式
```bash
npm run dev
```

### 重新构建
```bash
npm run build
```

### 更新扩展
每次修改代码后：
1. 运行 `npm run build`
2. 在Chrome扩展管理页面点击扩展的"刷新"按钮

## 📁 项目结构

```
├── dist/                   # 构建输出目录（用于Chrome扩展安装）
├── public/                 # 静态资源
│   ├── manifest.json      # Chrome扩展配置文件
│   └── images/            # 图标等资源
├── src/
│   ├── pages/
│   │   ├── newtab/        # 新标签页
│   │   └── popup/         # 弹窗页面
│   ├── background/        # 后台脚本
│   └── content/           # 内容脚本
├── newtab.html            # 新标签页HTML
├── popup.html             # 弹窗HTML
└── package.json
```

## ⚠️ 常见问题

### 样式不显示？
确保：
1. 已经运行了 `npm run build`
2. 在Chrome扩展页面刷新了扩展
3. 检查控制台是否有CSP（内容安全策略）错误

### 扩展不工作？
1. 检查Chrome开发者工具的控制台
2. 确认 `dist/manifest.json` 文件存在且格式正确
3. 重新加载扩展

## 🛠️ 技术栈

- **React 19** - UI框架
- **TypeScript** - 类型安全
- **Tailwind CSS** - 样式框架
- **Vite** - 构建工具
- **Chrome Extension API** - 浏览器扩展API

## 📝 开发注意事项

1. **相对路径**：Chrome扩展要求使用相对路径，已在vite配置中设置 `base: './`
2. **CSP策略**：已在manifest.json中配置了内容安全策略
3. **热重载**：开发时需要手动刷新扩展来看到更改

## 🎯 功能特性

- ✅ 自定义新标签页
- ✅ 快速添加功能（通过扩展弹窗）
- ✅ 内外网地址管理
- ✅ 响应式设计
- ✅ 现代化UI组件

## 📄 许可证

MIT License
