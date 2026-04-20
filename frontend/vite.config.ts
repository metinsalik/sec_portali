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
      "@": path.resolve(__dirname, "./src"),
      "turkey-map-react": path.resolve(__dirname, "./node_modules/turkey-map-react/lib/index.js"),
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
      '/api': 'http://backend:3005'
    }
  },
  optimizeDeps: {
    include: ['turkey-map-react']
  }
})
