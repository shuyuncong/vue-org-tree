import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue2'

export default defineConfig({
  plugins: [vue()],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    lib: {
      entry: 'src/components/org-tree/index.js',
      name: 'Vue2OrgTree',
      cssFileName: 'style',
      formats: ['es', 'umd'],
      fileName: format => format === 'es'
        ? 'vue-org-tree.es.mjs'
        : 'vue-org-tree.umd.js'
    },
    rollupOptions: {
      external: ['vue'],
      output: {
        exports: 'named',
        globals: {
          vue: 'Vue'
        }
      }
    }
  }
})
