import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig(({ command, mode }) => ({
  base: command === 'serve' || mode === 'test' ? '/' : '/vue-org-tree/',
  plugins: [vue()],
  build: {
    outDir: 'demo-dist',
    emptyOutDir: true
  },
  server: {
    host: 'localhost',
    port: 8080
  },
  preview: {
    host: '127.0.0.1',
    port: 4173
  }
}))
