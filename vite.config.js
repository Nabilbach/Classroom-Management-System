import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path' // استيراد الوحدة 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'), // إضافة Alias للمسار @/
      // يمكنك إضافة المزيد من الـ aliases هنا إذا لزم الأمر
      // '@my_components': path.resolve(__dirname, './src/my_components'), // مثال
    },
  },
})