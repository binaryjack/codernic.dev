import type * as vscode from 'vscode';
import type { McpConnectionManager } from '../../../../shared/mcp';
import type { CodernicMsg } from '../../api/codernic-webview-provider';

export interface MessageContext {
  workspaceRoot: string;
  channel: { appendLine: (msg: string) => void };
  workspaceState?: vscode.Memento;
  context?: vscode.ExtensionContext;
  extensionPath?: string;
  mcpManager?: McpConnectionManager;
  reply: (r: CodernicMsg) => void;
  token?: vscode.CancellationToken;
}
