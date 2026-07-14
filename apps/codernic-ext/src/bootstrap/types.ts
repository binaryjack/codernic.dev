import * as vscode from 'vscode';
import type { McpConnectionManager } from '../shared/mcp';

export interface BootstrapContext {
  vscodeContext: vscode.ExtensionContext;
  channel: vscode.OutputChannel;
  workspaceRoot: string;
  mcpManager: McpConnectionManager;
  broadcastToUI: (payload: unknown) => void;
  extStatusBar: any; // Using any for status bar to avoid deep imports if not exported nicely
  networkConfig: any;
}

export interface PhaseActivator {
  name: string;
  activate(ctx: BootstrapContext): Promise<void> | void;
}
