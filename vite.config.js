import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  base: './',
  plugins: [react()],
  build: {
    target: 'es2020',
    minify: false,
    cssMinify: false,
    modulePreload: false,
  },
})
