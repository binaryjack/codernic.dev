import * as vscode from 'vscode';
import { buildWebviewHtml } from '../../../shared/build-webview-html';
import type { McpClientInstance } from '../../../shared/mcp/create-mcp-client';
import { buildSchemasMessageHandler } from '../model/schemas-message-handler';

type SchemasWebviewProviderInstance = vscode.WebviewViewProvider & {
  readonly ctx: vscode.ExtensionContext;
  readonly getMcpClient: () => McpClientInstance | undefined;
  readonly workspaceRoot: string;
  resolveWebviewView(
    view: vscode.WebviewView,
    context: vscode.WebviewViewResolveContext,
    token: vscode.CancellationToken,
  ): void | Thenable<void>;
};

export const SchemasWebviewProvider = function (
  this: SchemasWebviewProviderInstance,
  context: vscode.ExtensionContext,
  getMcpClient: () => McpClientInstance | undefined,
  workspaceRoot: string,
) {
  Object.defineProperty(this, 'ctx', { value: context, enumerable: false, writable: false });
  Object.defineProperty(this, 'getMcpClient', {
    value: getMcpClient,
    enumerable: false,
    writable: false,
  });
  Object.defineProperty(this, 'workspaceRoot', {
    value: workspaceRoot,
    enumerable: false,
    writable: false,
  });
};

SchemasWebviewProvider.prototype.resolveWebviewView = function (
  this: SchemasWebviewProviderInstance,
  webviewView: vscode.WebviewView,
  _context: vscode.WebviewViewResolveContext,
  _token: vscode.CancellationToken,
): void | Thenable<void> {
  const context = this.ctx;
  const getMcpClient = this.getMcpClient;
  const workspaceRoot = this.workspaceRoot;

  webviewView.webview.options = {
    enableScripts: true,
    localResourceRoots: [context.extensionUri],
  };

  webviewView.webview.html = buildWebviewHtml(webviewView.webview, context.extensionUri, {
    title: 'Erathos',
    panel: 'schemas-list',
  });

  const postMessage = (msg: unknown) => {
    webviewView.webview.postMessage(msg);
  };
  const handler = buildSchemasMessageHandler(context, getMcpClient, workspaceRoot, postMessage);

  webviewView.webview.onDidReceiveMessage(handler, undefined, context.subscriptions);
  // Auto-fetch on resolve
  handler({ type: 'list' });
};
