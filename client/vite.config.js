import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { Env } from './src/utils/env';
// https://vite.dev/config/
// client/vite.config.js
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/llm': { // O que já tínhamos
  target: Env.getEnvVar('VITE_BACKEND_URL', 'http://localhost:10000'),
        changeOrigin: true,
      },
      '/calendar': { // Adicione esta parte
  target: Env.getEnvVar('VITE_BACKEND_URL', 'http://localhost:10000'),
        changeOrigin: true,
      },
    },
  },
})