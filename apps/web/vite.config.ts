import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from "path"

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src")
    },
  },
  server: {
    port: 5173,
    host: '0.0.0.0',
    hmr: {
      protocol: 'ws',
      host: 'localhost',
      clientPort: 80
    },
    proxy: {
      '/api': 'http://localhost:3005',
      '/uploads': 'http://localhost:3005',
      '/socket.io': {
        target: 'http://localhost:3005',
        ws: true
      }
    }
  },
  optimizeDeps: {
    include: ['turkey-map-react']
  }
})
