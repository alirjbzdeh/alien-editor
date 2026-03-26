import { defineConfig } from 'vite'
import path from 'path'

export default defineConfig({
  build: {
    lib: {
      entry: path.resolve(__dirname, 'src/nuxt.ts'),
      name: 'AlienEditorNuxt',
      fileName: 'nuxt',
    },
    rollupOptions: {
      external: ['vue', '@nuxt/kit', 'nuxt'],
      output: [
        { format: 'es', entryFileNames: 'nuxt.js' },
        { format: 'cjs', entryFileNames: 'nuxt.cjs', exports: 'named' },
      ],
    },
    emptyOutDir: false,
    outDir: 'dist',
  },
  resolve: {
    alias: { '@': path.resolve(__dirname, 'src') },
  },
})
