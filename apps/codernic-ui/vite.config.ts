import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'path';
import { FrontendConfigManager } from './src/shared/config/config-paths';

const engineConfig = FrontendConfigManager.getEngineConfig();
const wsPort = engineConfig.network.daemon_ws_port || 47321;
const uiPort = engineConfig.network.ui_dev_port || 5173;
const mcpPort = 9743;
const ollamaUrl = 'http://127.0.0.1:11434';

// Ensure Vite exposes these to the client via import.meta.env
const gatewayPort = wsPort + 1000;
process.env.VITE_CODERNIC_WS_URL = process.env.VITE_CODERNIC_WS_URL || `ws://127.0.0.1:${gatewayPort}`;
process.env.VITE_DAEMON_HTTP_URL = process.env.VITE_DAEMON_HTTP_URL || `http://127.0.0.1:${wsPort}`;
process.env.VITE_ERATHOS_MCP_URL = process.env.VITE_ERATHOS_MCP_URL || `http://127.0.0.1:${mcpPort}`;
process.env.VITE_OLLAMA_URL = process.env.VITE_OLLAMA_URL || ollamaUrl;

export default defineConfig({
  define: {
    __CODERNIC_WS_PORT__: gatewayPort,
  },
  server: {
    port: uiPort,
    strictPort: true,
  },
  resolve: {
    alias: {
      '@atomos-web/structura/webview': path.resolve('../../../atomos-monorepo/packages/atomos-structura/dist/webview/index.js'),
      '@atomos-web/structura': path.resolve('../../../atomos-monorepo/packages/atomos-structura/dist/index.js'),
      '@atomos-web/structura-core': path.resolve('../../../atomos-monorepo/packages/atomos-structura-core/dist/index.js'),
      '@atomos-web/prime': path.resolve('../../../atomos-monorepo/packages/atomos-prime/dist/index.js'),
      '@atomos-web/prime-style': path.resolve('../../../atomos-monorepo/packages/atomos-prime-style'),
      '@atomos-web/structura-mcp': path.resolve('../../../atomos-monorepo/packages/atomos-structura-mcp/dist/index.js'),
      '@binaryjack/formular.dev': path.resolve('../../../atomos-monorepo/packages/formular-dev/dist/formular-dev.mjs'),
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
