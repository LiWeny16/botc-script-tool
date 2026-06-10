import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  base: '/',
  plugins: [
    react(),
  ],
  server: {
    host: '0.0.0.0',
    port: 5173,
  },
  resolve: {
    dedupe: ['react', 'react-dom'],
  },
  optimizeDeps: {
    include: ['@xyflow/react'],
  },
  build: {
    outDir: 'docs', // 打包输出目录改为 docs（适合 GitHub Pages）
    // 其他优化选项
    rollupOptions: {
      output: {
        // 分包策略 - 使用函数形式
        manualChunks(id) {
          if (id.includes('node_modules')) {
            // 状态管理 + 路由 + 滚动条（极少更新，必须在 react 前匹配）
            if (id.includes('mobx') || id.includes('react-router') || id.includes('overlayscrollbars')) {
              return 'state-vendor'
            }
            // React 核心（极少更新）
            if (id.includes('react-dom') || id.endsWith('/react/') || id.includes('/react/esm') || id.includes('react/index')) {
              return 'react-vendor'
            }
            // UI 库（偶尔更新）
            if (id.includes('@mui') || id.includes('@emotion')) {
              return 'mui-vendor'
            }
            // 拖拽库（极少更新）
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
