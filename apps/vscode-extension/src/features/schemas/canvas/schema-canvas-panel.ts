import * as fs from 'fs';
import * as vscode from 'vscode';
import type { McpClientInstance } from '../../../shared/mcp/create-mcp-client';
import { callMcpTool } from '../../../shared/mcp/create-mcp-client';

// Utility logging function
const log = (level: 'info' | 'warn' | 'error', message: string, ...args: any[]) => {
  console[level](`[SchemaCanvas] ${message}`, ...args);
};

export interface SchemaCanvasPanel {
  dispose(): void;
}

const openPanels: Record<string, SchemaCanvasPanel> = {};

export const SchemaCanvasPanelImpl = function (
  this: SchemaCanvasPanel,
  panel: vscode.WebviewPanel,
  context: vscode.ExtensionContext,
  mcpClient: McpClientInstance,
  schemaId: string,
  port: number,
) {
  let disposed = false;

  const init = () => {
    panel.webview.options = { enableScripts: true };
    panel.webview.html = getHtml(panel.webview);

    panel.onDidDispose(
      () => {
        this.dispose();
      },
      null,
      context.subscriptions,
    );
  };

  this.dispose = async () => {
    if (disposed) return;
    disposed = true;
    delete openPanels[schemaId];

    // Clean up Structura UI if loaded
    try {
      await panel.webview.postMessage({ type: 'cleanup' });
      // Give webview time to cleanup
      await new Promise((resolve) => setTimeout(resolve, 100));
    } catch (error) {
      log('warn', 'Webview cleanup warning:', error);
    }

    // Attempt graceful stop of MCP structura
    try {
      await callMcpTool(mcpClient, { name: 'schema-bridge-close', arguments: { port } });
    } catch {
      // Best effort cleanup
    }

    panel.dispose();
  };

  const getHtml = (webview: vscode.Webview) => {
    const nonce = getNonce();

    // Check if Structura dist exists
    const structuraDistPath = vscode.Uri.joinPath(
      context.extensionUri,
      'dist',
      'structura',
      'webview',
      'index.js',
    );

    try {
      if (fs.existsSync(structuraDistPath.fsPath)) {
        const scriptUri = webview.asWebviewUri(structuraDistPath);
        const stylesPath = vscode.Uri.joinPath(
          context.extensionUri,
          'dist',
          'structura',
          'webview',
          'styles.css',
        );
        const stylesUri = webview.asWebviewUri(stylesPath);
        log('info', '🎉 Using integrated Structura UI');

        const csp = [
          `default-src 'none'`,
          `style-src 'unsafe-inline' ${webview.cspSource}`,
          `script-src 'nonce-${nonce}' ${webview.cspSource}`,
          `connect-src http://localhost:* ws://localhost:*`,
          `img-src ${webview.cspSource} data:`,
        ].join('; ');

        return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="Content-Security-Policy" content="${csp}">
  <title>Structura Canvas</title>
  <link rel="stylesheet" href="${stylesUri}">
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    html, body, #app { height: 100%; width: 100%; overflow: hidden; background: #0f0f0f; color: white; display: flex; justify-content: center; align-items: center; }
  </style>
</head>
<body>
  <div id="app">Initializing Structura Canvas...</div>
  <script type="module" nonce="${nonce}">
    console.log('[Webview] Starting initialization sequence...');
    console.log('[Webview] Loading Structura from URI: ', '${scriptUri.toString()}');
    console.log('[Webview] Localhost MCP port configuration: ', ${port});

    try {
      const module = await import('${scriptUri.toString()}');
      console.log('[Webview] Structura module loaded successfully:', module);
      
      const { initializeStructuraWebview } = module;
      if (typeof initializeStructuraWebview !== 'function') {
        throw new Error('initializeStructuraWebview export not found or is not a function');
      }

      console.log('[Webview] Calling initializeStructuraWebview...');
      await initializeStructuraWebview({
        containerId: 'app',
        mcpServerUrl: 'http://localhost:${port}',
        instanceId: '${schemaId}'
      });
      console.log('[Webview] initializeStructuraWebview completed without throwing');
    } catch (err) {
      console.error('[Webview] FATAL ERROR during initialization:', err);
      document.getElementById('app').innerHTML = '<div style="color: #ef4444; padding: 20px; font-family: monospace;"><h3>Initialization Error</h3><pre>' + (err instanceof Error ? err.stack || err.message : String(err)) + '</pre><p>Check Developer Tools (Ctrl+Shift+I) for more details.</p></div>';
    }
  </script>
</body>
</html>`;
      }
    } catch (error) {
      log('warn', 'Failed to load integrated Structura UI:', error);
    }

    // Fallback to our custom canvas implementation
    log('info', 'Using fallback canvas implementation');
    const canvasUri = webview.asWebviewUri(
      vscode.Uri.joinPath(context.extensionUri, 'dist', 'webview', 'canvas.js'),
    );
    const csp = [
      `default-src 'none'`,
      `style-src 'unsafe-inline' ${webview.cspSource}`,
      `script-src 'nonce-${nonce}' ${webview.cspSource}`,
      `img-src ${webview.cspSource} data:`,
      `connect-src http://localhost:* http://127.0.0.1:* ws://localhost:* wss://localhost:*`,
      `frame-src http://localhost:* http://127.0.0.1:*`,
    ].join('; ');

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="Content-Security-Policy" content="${csp}">
  <title>Schema: ${schemaId}</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    html, body { width: 100%; height: 100%; overflow: hidden; }
    #canvas { width: 100%; height: 100%; }
  </style>
</head>
<body>
  <script id="__cfg__" type="application/json" nonce="${nonce}">{"port":${port},"schemaId":${JSON.stringify(schemaId)}}</script>
  <div id="canvas"></div>
  <script nonce="${nonce}" src="${canvasUri}"></script>
</body>
</html>`;
  };

  function getNonce() {
    let text = '';
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < 32; i++)
      text += possible.charAt(Math.floor(Math.random() * possible.length));
    return text;
  }

  init();
  return Object.freeze(this);
} as unknown as new (
  panel: vscode.WebviewPanel,
  context: vscode.ExtensionContext,
  mcpClient: McpClientInstance,
  schemaId: string,
  port: number,
) => SchemaCanvasPanel;

export const createOrShowCanvas = async function (
  context: vscode.ExtensionContext,
  mcpClient: McpClientInstance,
  schemaId: string,
): Promise<SchemaCanvasPanel> {
  const column = vscode.window.activeTextEditor
    ? vscode.window.activeTextEditor.viewColumn
    : vscode.ViewColumn.One;

  if (openPanels[schemaId]) {
    return openPanels[schemaId];
  }

  try {
    const bridgeResp = await callMcpTool(mcpClient, {
      name: 'schema-bridge-open',
      arguments: { id: schemaId },
    });
    const data = JSON.parse((bridgeResp.content?.[0] as any)?.text ?? '{}');
    if (!data.success) throw new Error(data.message);

    const port = data.port as number;

    // Initialize multi-root paths on the sub-server via direct HTTP call
    const roots = vscode.workspace.workspaceFolders?.map((f) => f.uri.fsPath) || [];
    if (roots.length > 0) {
      try {
        // Note: Using a dynamic import for fetch if not globally available, or assume VS Code node env
        const response = await fetch(`http://localhost:${port}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            method: 'atomos-structura/initialize-workspace',
            params: { rootPaths: roots },
            id: 'init-multi-root',
          }),
        });
        if (!response.ok)
          log('warn', `Multi-root initialization on sub-server returned ${response.status}`);
      } catch (err) {
        log('warn', 'Failed to initialize workspace roots on sub-server', err);
      }
    }

    const panel = vscode.window.createWebviewPanel(
      'schemaCanvas',
      `Schema: ${schemaId}`,
      column || vscode.ViewColumn.One,
      {
        enableScripts: true,
        retainContextWhenHidden: true,
        localResourceRoots: [
          vscode.Uri.joinPath(context.extensionUri, 'dist', 'webview'),
          vscode.Uri.joinPath(context.extensionUri, 'dist', 'structura'),
        ],
        portMapping: [
          {
            webviewPort: port,
            extensionHostPort: port,
          },
        ],
      },
    );

    const canvas = new SchemaCanvasPanelImpl(panel, context, mcpClient, schemaId, port);
    openPanels[schemaId] = canvas;
    return canvas;
  } catch (err: unknown) {
    vscode.window.showErrorMessage(`Failed to open schema canvas: ${(err as Error).message}`);
    throw err;
  }
};

export const SchemaCanvasPanelAPI = {
  createOrShow: createOrShowCanvas,
  getPanel: (schemaId: string) => openPanels[schemaId],
};
