# Z-Index 层级修复说明

## 问题诊断

遮罩层的z-index(z-20)遮住了CategorySidebar内容(z-10)，导致分类项无法点击。

## 修复后的Z-Index层级

```
z-50: 右键菜单 (NewTabApp)
z-40: 显示指示器按钮 + 固定状态指示器
z-30: 边栏容器 + CategorySidebar内容
z-20: 遮罩层（但不覆盖边栏区域）
z-10: 主内容区域 (NewTabApp)
z-0:  背景点击区域
```

## 关键修复

1. **CategorySidebar内容**: z-10 → z-30
2. **固定状态指示器**: z-20 → z-40  
3. **遮罩层位置**: 添加 `right: 160px` 避免遮住边栏

## 遮罩层优化

```jsx
<div
  className="fixed inset-0 bg-black/10 z-20 transition-opacity duration-300"
  style={{ right: `${SIDEBAR_WIDTH}px` }} // 关键：不遮住边栏区域
  onClick={handleMaskClick}
/>
```

这确保了：
- 遮罩层覆盖主内容区域
- 边栏区域不被遮罩层覆盖
- 分类项可以正常点击
