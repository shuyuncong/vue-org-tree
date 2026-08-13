import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  test: {
    coverage: {
      provider: 'v8',
      include: ['src/lib/**'],
      reporter: ['text']
    },
    environment: 'jsdom',
    setupFiles: ['test/setup.ts'],
    include: ['test/unit/**/*.spec.ts'],
    clearMocks: true
  }
})
