import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Carrega as variáveis de ambiente
  const env = loadEnv(mode, process.cwd(), '')
  
  // Define o backend URL a partir das variáveis de ambiente
  const backendUrl = env.VITE_BACKEND_URL || env.SERVER_URL || 'http://localhost:10000'
  
  return {
    plugins: [react()],
    server: {
      proxy: {
        '/llm': {
          target: backendUrl,
          changeOrigin: true,
        },
        '/calendar': {
          target: backendUrl,
          changeOrigin: true,
        },
      },
    },
  }
})