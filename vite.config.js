import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
// Single ESM config: include react plugin, proxy, and option to disable HMR for testing.
export default defineConfig({
  plugins: [react()],
  server: {
    // Set to false while debugging resume-from-sleep white-screen issues.
    // Re-enable HMR for normal development.
    hmr: false,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
});
