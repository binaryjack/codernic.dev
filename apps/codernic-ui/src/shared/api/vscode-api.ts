declare function acquireVsCodeApi(): {
  postMessage(msg: unknown): void;
  getState(): unknown;
  setState(state: unknown): void;
};

// ── WebSocket URL: configurable via Vite env, falls back to default port ──────
const WS_URL =
  typeof import.meta !== 'undefined'
    ? ((import.meta as { env?: Record<string, string> }).env?.['VITE_CODERNIC_WS_URL'] ??
       'ws://localhost:47321')
    : 'ws://localhost:47321';

/**
 * Creates an auto-reconnecting WebSocket bridge to the VS Code extension's
 * WebSocket server. Incoming messages are re-dispatched as window MessageEvents
 * so all existing `window.addEventListener('message', ...)` handlers in
 * features and widgets work without modification.
 */
function createWsBridge() {
  let ws: WebSocket | null = null;
  const queue: unknown[] = [];

  function connect() {
    try {
      ws = new WebSocket(WS_URL);
    } catch {
      // Retry if URL is invalid or browser blocks the connection
      setTimeout(connect, 3000);
      return;
    }

    ws.onopen = () => {
      // Flush any messages that were posted while connecting
      queue.forEach((m) => ws!.send(JSON.stringify(m)));
      queue.length = 0;
    };

    ws.onmessage = (e) => {
      try {
        const parsed = JSON.parse(e.data as string) as unknown;
        // Re-dispatch as a standard MessageEvent so existing handlers work
        window.dispatchEvent(new MessageEvent('message', { data: parsed }));
      } catch {
        // Ignore malformed messages
      }
    };

    ws.onclose = () => {
      ws = null;
      // Auto-reconnect after 2s on unexpected close
      setTimeout(connect, 2000);
    };

    ws.onerror = () => {
      ws?.close();
    };
  }

  connect();

  return {
    postMessage: (msg: unknown) => {
      if (ws?.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(msg));
      } else {
        // Queue until the socket is open
        queue.push(msg);
      }
    },
    getState: () => undefined as unknown,
    setState: (_s: unknown) => {},
  };
}

export const vscode = (() => {
  if (typeof acquireVsCodeApi !== 'undefined') {
    // Running inside a VS Code webview — use the native API
    return acquireVsCodeApi();
  }
  // Running as a standalone PWA (browser) — bridge via WebSocket
  return createWsBridge();
})();
