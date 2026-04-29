import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import viteCompression from 'vite-plugin-compression'

// https://vite.dev/config/
export default defineConfig({
  base: '/', // Absolute paths so assets load from language subdirectories
  plugins: [
    react(),
    // gzip 压缩插件 - 压缩大于 128kb 的文件
    viteCompression({
      verbose: true, // 是否在控制台输出压缩结果
      disable: false, // 是否禁用
      threshold: 128 * 1024, // 文件大小大于 128kb 时才压缩
      algorithm: 'gzip', // 压缩算法，可选 'gzip' | 'brotliCompress' | 'deflate' | 'deflateRaw'
      ext: '.gz', // 生成的压缩文件扩展名
      deleteOriginFile: false, // 是否删除源文件
    }),
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
