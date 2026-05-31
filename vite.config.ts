import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5175,
    proxy: {
      // /api/chatbot 必须在 /api/integration 之前（Vite 从上到下匹配）
      '/api/chatbot': {
        target: 'http://localhost:8002',  // LLM + WebSocket 仍在 Node
        changeOrigin: true,
        ws: true,
      },
      '/api/integration': {
        target: 'http://localhost:8000',  // 所有 CRUD 数据走 Python（唯一数据源）
        changeOrigin: true,
      },
    },
  },
})
