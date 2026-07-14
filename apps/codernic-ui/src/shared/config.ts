// Codernic UI Environment Configuration
// This centralized configuration reads values injected by the VS Code extension
// into the `window.__CODERNIC_ENV__` object, or falls back to import.meta.env
// if running in a standalone Vite dev server.

declare global {
  interface Window {
    __CODERNIC_ENV__?: {
      VITE_CODERNIC_WS_URL?: string;
      VITE_DAEMON_HTTP_URL?: string;
      VITE_ERATHOS_MCP_URL?: string;
      VITE_OLLAMA_URL?: string;
    };
  }
}

export const getCodernicWsUrl = (): string => {
  const url = window.__CODERNIC_ENV__?.VITE_CODERNIC_WS_URL || (import.meta as any).env?.VITE_CODERNIC_WS_URL;
  if (!url) {
    throw new Error('CRITICAL ERROR: VITE_CODERNIC_WS_URL is not defined in environment. Check your engine.json network config.');
  }
  return url;
};

export const getCodernicHttpUrl = (): string => {
  const url = window.__CODERNIC_ENV__?.VITE_DAEMON_HTTP_URL || (import.meta as any).env?.VITE_DAEMON_HTTP_URL;
  if (!url) {
    throw new Error('CRITICAL ERROR: VITE_DAEMON_HTTP_URL is not defined in environment. Check your engine.json network config.');
  }
  return url;
};

export const getErathosMcpUrl = (): string => {
  const url = window.__CODERNIC_ENV__?.VITE_ERATHOS_MCP_URL || (import.meta as any).env?.VITE_ERATHOS_MCP_URL;
  if (!url) {
    throw new Error('CRITICAL ERROR: VITE_ERATHOS_MCP_URL is not defined in environment. Check your engine.json network config.');
  }
  return url;
};

export const getOllamaUrl = (): string => {
  const url = window.__CODERNIC_ENV__?.VITE_OLLAMA_URL || (import.meta as any).env?.VITE_OLLAMA_URL;
  if (!url) {
    // We provide a fallback for Ollama to avoid breaking existing users who didn't set it
    return 'http://127.0.0.1:11434';
  }
  return url;
};
