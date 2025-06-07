import fs from 'fs';
import path from 'path';

// 确保相对路径正确
function fixPaths() {
  const distDir = path.join(process.cwd(), 'dist');
  
  // 检查并修复 HTML 文件中的路径
  const htmlFiles = ['newtab.html', 'popup.html'];
  
  htmlFiles.forEach(file => {
    const filePath = path.join(distDir, file);
    if (fs.existsSync(filePath)) {
      let content = fs.readFileSync(filePath, 'utf8');
      
      // 确保所有资源路径都是相对路径
      content = content.replace(/src="\/assets\//g, 'src="./assets/');
      content = content.replace(/href="\/assets\//g, 'href="./assets/');
      
      fs.writeFileSync(filePath, content);
    }
  });
  
}

fixPaths();
