import { defineConfig } fromjs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      // forward /api requests to attendance-system backend on port 4001
      '/api': {
        target: 'http://localhost:4001',
        changeOrigin: true,
        secure: false,
        ws: false
      }
    }
  }
})