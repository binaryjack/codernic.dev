import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'path';

export default defineConfig({
  server: {
    port: 5173,
    strictPort: true,
  },
  resolve: {
    alias: {
      '@atomos-web/structura/webview': path.resolve('/home/tadeop/dev/atomos-monorepo/packages/atomos-structura/dist/webview/index.js'),
      '@atomos-web/structura': path.resolve('/home/tadeop/dev/atomos-monorepo/packages/atomos-structura/dist/index.js'),
      '@atomos-web/structura-core': path.resolve('/home/tadeop/dev/atomos-monorepo/packages/atomos-structura-core/dist/index.js'),
      '@atomos-web/prime': path.resolve('/home/tadeop/dev/atomos-monorepo/packages/atomos-prime/dist/index.js'),
      '@atomos-web/prime-style': path.resolve('/home/tadeop/dev/atomos-monorepo/packages/atomos-prime-style'),
      '@atomos-web/structura-mcp': path.resolve('/home/tadeop/dev/atomos-monorepo/packages/atomos-structura-mcp/dist/index.js'),
      '@binaryjack/formular.dev': path.resolve('/home/tadeop/dev/atomos-monorepo/packages/formular-dev/dist/formular-dev.mjs'),
    }
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'Codernic Mission Control',
        short_name: 'Codernic',
        theme_color: '#1e1e1e',
        background_color: '#1e1e1e',
        display: 'standalone',
        icons: [
          {
            src: '/icon-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: '/icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
          },
        ],
      },
    }),
  ],
  test: {
    exclude: ['**/node_modules/**', '**/dist/**', '**/e2e/**', '**/cypress/**', '**/.{idea,git,cache,output,temp}/**'],
  },
});
