// acquireVsCodeApi shim for webview
declare function acquireVsCodeApi(): {
  postMessage(msg: unknown): void;
  getState(): unknown;
  setState(state: unknown): void;
};

export const vscode = (function () {
  if (typeof acquireVsCodeApi !== 'undefined') {
    return acquireVsCodeApi();
  }
  // fallback for tests and PWA
  return {
    postMessage: (msg: unknown) => {
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('codernic:ws-send', { detail: msg }));
      }
    },
    getState: () => undefined,
    setState: (_s: unknown) => {},
  };
})();
