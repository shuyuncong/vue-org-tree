import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import dts from 'vite-plugin-dts'

export default defineConfig({
  plugins: [vue(), dts({
    entryRoot: 'src/lib',
    include: ['src/lib'],
    exclude: ['src/App.vue', 'src/main.ts', 'test'],
    insertTypesEntry: true
  })],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    lib: {
      entry: 'src/lib/index.ts',
      name: 'VueHierarchy',
      cssFileName: 'style',
      formats: ['es', 'cjs'],
      fileName: format => format === 'es' ? 'vue-hierarchy.js' : 'vue-hierarchy.cjs'
    },
    rollupOptions: {
      external: ['vue'],
      output: {
        exports: 'named',
        globals: { vue: 'Vue' }
      }
    }
  }
})
