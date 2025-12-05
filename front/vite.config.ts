import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { defineConfig } from 'vite'

// 簡単な proxy 設定例
export default defineConfig({
  //   base: '/front/',
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    allowedHosts: ['todo-app-front-server-1'],
    proxy: {
      //   '/oauth2': {
      //     target: 'http://bff-server:7070',
      //     changeOrigin: true,
      //     secure: false,
      //   },
      //   '/api': {
      //     target: 'http://bff-server:8080',
      //     changeOrigin: true,
      //     secure: false,
      //     headers: {
      //       'X-Forwarded-Host': 'front-server:5173',
      //       'X-Forwarded-Proto': 'http',
      //     },
      //   },
      //   '/logout': {
      //     target: 'http://bff-server:8080',
      //     changeOrigin: true,
      //     secure: false,
      //   }
    }
  }
})