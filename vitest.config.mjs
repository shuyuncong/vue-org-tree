import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue2'

export default defineConfig({
  plugins: [vue()],
  test: {
    environment: 'jsdom',
    setupFiles: ['test/setup.js'],
    include: ['test/unit/**/*.spec.js'],
    clearMocks: true
  }
})
