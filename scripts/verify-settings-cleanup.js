#!/usr/bin/env node

/**
 * 设置清理验证脚本
 * 用于验证所有被移除的设置项是否已经完全清理
 */

import fs from 'fs';
import path from 'path';

// 被移除的设置项列表
const REMOVED_SETTINGS = [
  'autoFocusSearch',
  'dateFormat', 
  'showSeconds',
  'enableDrag',
  'enableHover', 
  'clickAnimation',
  'categories.layout',
  'categories.style',
  'categories.showEmpty',
  'categories.enableSort',
  'categories.tabPosition'
];

// 需要检查的文件扩展名
const EXTENSIONS = ['.ts', '.tsx'];

// 排除的目录
const EXCLUDED_DIRS = ['node_modules', '.git', 'dist', '.next'];

/**
 * 递归遍历目录
 */
function walkDir(dir, callback) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stats = fs.statSync(filePath);
    
    if (stats.isDirectory()) {
      if (!EXCLUDED_DIRS.includes(file)) {
        walkDir(filePath, callback);
      }
    } else if (EXTENSIONS.some(ext => file.endsWith(ext))) {
      callback(filePath);
    }
  });
}

/**
 * 检查文件中是否包含被移除的设置项
 */
function checkFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const issues = [];
  
  REMOVED_SETTINGS.forEach(setting => {
    // 创建匹配模式
    const patterns = [
      new RegExp(`\\b${setting}\\b`, 'g'),
      new RegExp(`['"]${setting}['"]`, 'g')
    ];
    
    patterns.forEach(pattern => {
      const matches = content.match(pattern);
      if (matches) {
        matches.forEach(match => {
          // 检查是否在注释中（简单检查）
          const lines = content.split('\n');
          let lineNum = 0;
          let charCount = 0;
          
          for (let i = 0; i < lines.length; i++) {
            charCount += lines[i].length + 1; // +1 for \n
            if (charCount > content.indexOf(match)) {
              lineNum = i + 1;
              break;
            }
          }
          
          const line = lines[lineNum - 1];
          const isComment = line.trim().startsWith('//') || 
                           line.trim().startsWith('*') ||
                           line.trim().startsWith('/*');
          
          if (!isComment) {
            issues.push({
              setting,
              line: lineNum,
              lineContent: line.trim(),
              match
            });
          }
        });
      }
    });
  });
  
  return issues;
}

/**
 * 主函数
 */
function main() {
  console.log('🔍 开始检查设置清理情况...\n');
  
  const srcDir = path.join(process.cwd(), 'src');
  let totalIssues = 0;
  const fileIssues = {};
  
  walkDir(srcDir, (filePath) => {
    const issues = checkFile(filePath);
    if (issues.length > 0) {
      fileIssues[filePath] = issues;
      totalIssues += issues.length;
    }
  });
  
  if (totalIssues === 0) {
    console.log('✅ 太棒了！所有被移除的设置项都已完全清理');
    console.log('📝 以下设置已成功移除：');
    REMOVED_SETTINGS.forEach(setting => {
      console.log(`   - ${setting}`);
    });
  } else {
    console.log(`❌ 发现 ${totalIssues} 个问题需要处理：\n`);
    
    Object.entries(fileIssues).forEach(([file, issues]) => {
      console.log(`📄 ${path.relative(process.cwd(), file)}:`);
      issues.forEach(issue => {
        console.log(`   Line ${issue.line}: ${issue.setting}`);
        console.log(`   Code: ${issue.lineContent}`);
        console.log('');
      });
    });
    
    console.log('请检查上述文件并清理相关引用。');
  }
  
  console.log('\n🎯 检查完成！');
}

// 运行主函数
main();

export { main, checkFile, REMOVED_SETTINGS };
