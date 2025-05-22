# 默认背景图片

此目录用于存放扩展的默认背景图片，当Unsplash API调用受限或网络断开时会使用这些图片。

## 背景图片要求

- 文件格式：推荐使用 `.jpg` 或 `.webp` 格式以减小文件大小
- 分辨率：建议使用 1920x1080 分辨率或更高
- 文件大小：每张图片不超过 1MB
- 文件命名：请按照 `default1.jpg`, `default2.jpg` 等格式命名

## 如何添加背景图片

1. 将您选择的背景图片放入此目录
2. 确保文件名符合 `default[数字].jpg` 格式
3. 在 `/js/utils/background.js` 文件中的 `DEFAULT_BACKGROUNDS` 数组添加新图片的相对路径

例如：

```javascript
const DEFAULT_BACKGROUNDS = [
    'images/backgrounds/default1.jpg',
    'images/backgrounds/default2.jpg',
    'images/backgrounds/default3.jpg',
    'images/backgrounds/default4.jpg',
    'images/backgrounds/default5.jpg',
    'images/backgrounds/your-new-image.jpg' // 添加新图片
];
```

## 注意事项

- 建议添加 5-10 张默认背景图片，以提供足够的多样性
- 确保图片具有版权许可，可以使用免费的图片资源网站如 Unsplash, Pexels 等
- 图片风格应与扩展主题一致，推荐使用自然风景、城市景观等壁纸类型图片