import { defineConfig, mergeConfig } from 'vite';
import baseConfig from './vite.config.js';
import path from 'path';

export default mergeConfig(baseConfig, defineConfig({
  build: {
    outDir: path.resolve(__dirname, '../codernic-ext/dist/webview'),
    emptyOutDir: true,
    minify: 'terser',
    sourcemap: false,
    rollupOptions: {
      input: path.resolve(__dirname, 'src/app/main.tsx'),
      output: {
        format: 'iife',
        name: 'Codernic',
        entryFileNames: 'main.js',
        assetFileNames: '[name][extname]',
      },
    },
  },
}));
