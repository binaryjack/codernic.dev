import react from '@vitejs/plugin-react'
import path from 'path'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react()],
  root: path.resolve(__dirname, 'src/webview'),
  build: {
    outDir: path.resolve(__dirname, 'dist/webview'),
    emptyOutDir: true,
    rollupOptions: {
      input: path.resolve(__dirname, 'src/webview/main.tsx'),
      output: {
        format: 'iife',
        name: 'AiAgencee',
        entryFileNames: 'main.js',
        assetFileNames: '[name][extname]',
      },
    },
  },
})
