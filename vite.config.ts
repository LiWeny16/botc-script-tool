import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath } from 'node:url'
import { createHash } from 'node:crypto'
import { readdirSync, readFileSync } from 'node:fs'
import { join, relative, sep } from 'node:path'

// Content hashes let the browser keep unchanged artwork across deployments
// while replacing only files whose pixels have actually changed.
const artRoot = fileURLToPath(new URL('./public/imgs', import.meta.url))
const artAssets: Record<string, string> = {}
function collectArt(directory: string) {
  for (const entry of readdirSync(directory, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
    const path = join(directory, entry.name)
    if (entry.isDirectory()) collectArt(path)
    else if (/\.(png|jpe?g|webp|avif|gif|svg)$/i.test(entry.name)) {
      const url = '/imgs/' + relative(artRoot, path).split(sep).map(encodeURIComponent).join('/')
      artAssets[url] = createHash('sha256').update(readFileSync(path)).digest('hex').slice(0, 16)
    }
  }
}
collectArt(artRoot)
const artVersion = createHash('sha256').update(JSON.stringify(artAssets)).digest('hex').slice(0, 16)
const artManifest = JSON.stringify({ version: artVersion, assets: artAssets })

// https://vite.dev/config/
export default defineConfig({
  base: '/',
  plugins: [
    react(),
    {
      name: 'botc-art-cache-manifest',
      configureServer(server) {
        server.middlewares.use('/art-cache-manifest.json', (_req, res) => {
          res.setHeader('Content-Type', 'application/json')
          res.setHeader('Cache-Control', 'no-store')
          res.end(artManifest)
        })
      },
      generateBundle() {
        this.emitFile({ type: 'asset', fileName: 'art-cache-manifest.json', source: artManifest })
      },
    },
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
      input: {
        main: fileURLToPath(new URL('./index.html', import.meta.url)),
        exportRender: fileURLToPath(new URL('./export-render.html', import.meta.url)),
      },
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
    __ART_CACHE_VERSION__: JSON.stringify(artVersion),
    VITE_GA_MEASUREMENT_ID: JSON.stringify(process.env.VITE_GA_MEASUREMENT_ID || 'G-VB8HT63ZX6'),
  },
})
