import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
      // Preview generated mp4/html from the engine workspaces folder
      '/workspaces': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
})
