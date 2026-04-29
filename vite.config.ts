import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  base: '/', // Absolute paths so assets load from language subdirectories
  plugins: [
    react(),
  ],
  build: {
    outDir: 'docs', // 打包输出目录改为 docs（适合 GitHub Pages）
    // 其他优化选项
    rollupOptions: {
      output: {
        // 分包策略 - 使用函数形式
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom')) {
              return 'react-vendor'
            }
            if (id.includes('@mui') || id.includes('@emotion')) {
              return 'mui-vendor'
            }
            if (id.includes('@dnd-kit')) {
              return 'dnd-vendor'
            }
            // 其他第三方库
            return 'vendor'
          }
        },
      },
    },
    // 设置警告大小限制
    chunkSizeWarningLimit: 1000,
  },
  define: {
    VITE_GA_MEASUREMENT_ID: JSON.stringify(process.env.VITE_GA_MEASUREMENT_ID || 'G-VB8HT63ZX6'),
  },
})
