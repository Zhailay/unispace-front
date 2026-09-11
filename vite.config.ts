import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'node:path'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
  server: {
    port: 5173,
    proxy: {
      // Проксируем на бэк, чтобы браузер видел один origin.
      // Так cookie сессии ходит без CORS-плясок и SameSite-сюрпризов.
      '/api': {
        target: process.env.VITE_API_TARGET || 'http://localhost:4015',
        changeOrigin: true,
      },
    },
  },
})
