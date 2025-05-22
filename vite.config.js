import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
  base: './', // 使用相对路径
  build: {
    rollupOptions: {
      input: {
        newtab: resolve(process.cwd(), 'newtab.html'),
        popup: resolve(process.cwd(), 'popup.html'),
        background: resolve(process.cwd(), 'src/background/background.ts'),
        contentScript: resolve(process.cwd(), 'src/content/content-script.ts')
      },
      output: {
        entryFileNames: (chunkInfo) => {
          if (chunkInfo.name === 'background') {
            return 'js/background.js'
          }
          if (chunkInfo.name === 'contentScript') {
            return 'js/content-script.js'
          }
          return 'assets/[name]-[hash].js'
        },
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]'
      }
    },
    outDir: 'dist',
    emptyOutDir: true,
    // Chrome扩展优化
    minify: false, // 可选：关闭压缩便于调试
    sourcemap: false
  },
  publicDir: 'public'
})
