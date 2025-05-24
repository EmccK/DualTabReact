/**
 * URL工具函数测试
 * 这个文件用于开发时测试URL工具函数
 */

import { isValidUrl, getUrlDomain, formatUrl } from './url-utils'

// 测试用例
const testCases = [
  // 有效URL
  'https://www.google.com',
  'http://localhost:3000',
  'https://github.com/user/repo',
  
  // 需要格式化的URL
  'google.com',
  'localhost:3000',
  '127.0.0.1:8080',
  
  // 无效URL
  '',
  '   ',
  'invalid-url',
  'just text',
  null as any,
  undefined as any
]

export function testUrlUtils() {
  console.log('=== URL工具函数测试 ===')
  
  testCases.forEach((testCase, index) => {
    console.log(`\n测试用例 ${index + 1}: "${testCase}"`)
    console.log(`  isValidUrl: ${isValidUrl(testCase)}`)
    console.log(`  getUrlDomain: ${getUrlDomain(testCase)}`)
    console.log(`  formatUrl: ${formatUrl(testCase)}`)
  })
  
  console.log('\n=== 测试完成 ===')
}

// 在开发环境中自动运行测试
if (process.env.NODE_ENV === 'development') {
  // testUrlUtils()
}