import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
// client/vite.config.js
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/llm': { // O que já tínhamos
        target: 'http://localhost:10000',
        changeOrigin: true,
      },
      '/calendar': { // Adicione esta parte
        target: 'http://localhost:10000',
        changeOrigin: true,
      },
    },
  },
})