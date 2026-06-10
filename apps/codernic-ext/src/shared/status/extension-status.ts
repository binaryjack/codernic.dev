/**
 * @file extension-status.ts
 * @description Status bar item showing extension version and MCP server status
 */

import * as vscode from 'vscode';

export interface ExtensionStatusBar {
  updateMcpStatus(connected: boolean): void;
  dispose(): void;
}

/**
 * Creates a status bar item showing extension version and MCP connection status
 * @param extensionVersion - Version from package.json
 * @returns Status bar controller
 */
export function createExtensionStatusBar(extensionVersion: string): ExtensionStatusBar {
  const statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);

  statusBarItem.command = 'ai-agencee.showLogs';

  let mcpConnected = false;

  function updateDisplay(): void {
    if (mcpConnected) {
      statusBarItem.text = `$(robot) AI Agencee: Connected`;
      statusBarItem.tooltip = `AI Agencee v${extensionVersion}\nMCP server connected.\nClick to view logs.`;
      statusBarItem.backgroundColor = undefined;
    } else {
      statusBarItem.text = `$(robot) AI Agencee: Disconnected`;
      statusBarItem.tooltip = `AI Agencee v${extensionVersion}\nMCP server not connected.\nClick to view logs.`;
      statusBarItem.backgroundColor = new vscode.ThemeColor('statusBarItem.warningBackground');
    }
  }

  // Initial state: disconnected until caller updates
  updateDisplay();
  statusBarItem.show();

  return {
    updateMcpStatus(connected: boolean): void {
      mcpConnected = connected;
      updateDisplay();
    },
    dispose(): void {
      statusBarItem.dispose();
    },
  };
}
