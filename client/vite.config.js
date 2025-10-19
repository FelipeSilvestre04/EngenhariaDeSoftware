import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: { // Adicione esta parte
    proxy: {
      '/llm': {
        target: 'http://localhost:10000',
        changeOrigin: true,
      },
    },
  },
})