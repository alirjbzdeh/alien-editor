import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'

export default defineConfig({
  plugins: [vue()],
  build: {
    lib: {
      entry: path.resolve(__dirname, 'index.ts'),
      name: 'AlienEditor',
      fileName: 'alien-editor',
    },
    rollupOptions: {
      external: ['vue'],
      output: {
        globals: { vue: 'Vue' },
        exports: 'named',
      },
    },
    cssCodeSplit: false,
  },
  resolve: {
    alias: { '@': path.resolve(__dirname, 'src') },
  },
})
