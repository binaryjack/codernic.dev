import path from 'path'
import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    outDir: path.resolve(__dirname, 'dist/webview'),
    emptyOutDir: false,
    rollupOptions: {
      input: path.resolve(__dirname, 'src/webview/canvas.ts'),
      output: {
        format: 'iife',
        name: 'StructuraCanvas',
        entryFileNames: 'canvas.js',
        assetFileNames: '[name][extname]',
        inlineDynamicImports: true,
      },
    },
  },
})
