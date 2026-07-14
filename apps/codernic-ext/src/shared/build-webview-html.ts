import * as crypto from 'crypto';
import * as vscode from 'vscode';

export type WebviewHtmlOpts = {
  title: string;
  panel: string;
  /** Extra body styles applied to #root — defaults to '100vh' full-height */
  rootStyle?: string;
  /** Initial window state variables to inject into the webview (e.g. { __DAG_RESULT__: data }) */
  initialState?: Record<string, unknown>;
};

export const buildWebviewHtml = function (
  webview: vscode.Webview,
  extensionUri: vscode.Uri,
  opts: WebviewHtmlOpts,
): string {
  const bust = Date.now();
  const scriptUri =
    webview
      .asWebviewUri(vscode.Uri.joinPath(extensionUri, 'dist', 'webview', 'main.js'))
      .toString() + `?v=${bust}`;
  const nonce = buildNonce();
  const rootStyle = opts.rootStyle ?? 'width: 100%; height: 100vh; overflow-y: auto;';

  let stateScripts = '';
  if (opts.initialState) {
    for (const [key, value] of Object.entries(opts.initialState)) {
      stateScripts += `\n  <script nonce="${nonce}">window.${key} = ${JSON.stringify(value)};</script>`;
    }
  }

  const telemetryPort = process.env.TELEMETRY_PORT || '3001';

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="Cache-Control" content="no-store, no-cache, must-revalidate" />
  <meta http-equiv="Pragma" content="no-cache" />
  <meta http-equiv="Content-Security-Policy"
    content="default-src 'none'; connect-src http://localhost:${telemetryPort} ws://localhost:${telemetryPort}; script-src 'nonce-${nonce}' ${webview.cspSource}; style-src ${webview.cspSource} 'unsafe-inline';">
  <title>${opts.title}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { background: var(--vscode-editor-background); color: var(--vscode-editor-foreground); font-family: var(--vscode-font-family); font-size: var(--vscode-font-size); }
    #root { ${rootStyle} }
  </style>
</head>
<body>
  <div id="root"></div>
  <script nonce="${nonce}">window.__PANEL__ = '${opts.panel}';</script>${stateScripts}
  <script nonce="${nonce}" src="${scriptUri}"></script>
</body>
</html>`;
};

export const buildNonce = (): string => crypto.randomBytes(16).toString('hex');
