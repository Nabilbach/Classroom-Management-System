const { defineConfig } = require('vite');

// Disable HMR to avoid full-page reloads triggered by the Vite dev client
// (useful while debugging resume-from-sleep white-screen issues).
// Note: disabling HMR will turn off hot module updates; use only for testing.
module.exports = defineConfig({
  server: {
    hmr: false,
  },
});
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
});
