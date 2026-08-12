import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue2'

export default defineConfig(({ command, mode }) => ({
  base: command === 'serve' || mode === 'test' ? '/' : '/vue-org-tree/docs/',
  publicDir: 'static',
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
