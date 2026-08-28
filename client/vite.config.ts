import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      // Forward all /api requests to the Express backend
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
      // Forward all /uploads (static image) requests to the Express backend
      '/uploads': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
})

