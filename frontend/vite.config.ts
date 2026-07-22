import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  // In development, proxy /api and /health to the local backend.
  // In production (Vercel), VITE_API_BASE_URL is set and API calls go directly to backend URL.
  const backendUrl = env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';

  return {
    plugins: [react()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: {
      port: 5173,
      proxy: {
        // Forward all /api/* calls to backend
        '/api': {
          target: backendUrl,
          changeOrigin: true,
        },
        // Forward /health to backend
        '/health': {
          target: backendUrl,
          changeOrigin: true,
        },
      },
    },
  };
});
