/**
 * @file extension-status.ts
 * @description Status bar item showing extension version and MCP server status
 */

import * as vscode from 'vscode';

export interface ExtensionStatusBar {
  updateMcpStatus(connected: boolean): void;
  updateDaemonStatus(state: 'running' | 'stopped' | 'loading'): void;
  updateIndexStatus(state: 'fresh' | 'stale' | 'indexing'): void;
  dispose(): void;
}

export function createExtensionStatusBar(extensionVersion: string): ExtensionStatusBar {
  const daemonStatusBar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
  daemonStatusBar.command = 'ai-agencee.showLogs';

  const indexStatusBar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 99);
  // Ideally this would trigger an index update
  indexStatusBar.command = 'ai-agencee.openCodernic';

  let daemonState: 'running' | 'stopped' | 'loading' = 'stopped';
  let indexState: 'fresh' | 'stale' | 'indexing' | 'unknown' = 'unknown';

  function updateDaemonDisplay(): void {
    if (daemonState === 'running') {
      daemonStatusBar.text = `$(server-environment) Daemon: ON`;
      daemonStatusBar.tooltip = `Codernic v${extensionVersion}\nDaemon is running natively.`;
      daemonStatusBar.backgroundColor = undefined; // Standard color represents "Green/OK" in VS Code
    } else if (daemonState === 'stopped') {
      daemonStatusBar.text = `$(server-environment) Daemon: OFF`;
      daemonStatusBar.tooltip = `Codernic v${extensionVersion}\nDaemon is stopped. Click to view logs.`;
      daemonStatusBar.backgroundColor = new vscode.ThemeColor('statusBarItem.errorBackground'); // Red
    } else {
      daemonStatusBar.text = `$(sync~spin) Daemon: Booting`;
      daemonStatusBar.tooltip = `Codernic v${extensionVersion}\nDaemon is starting/loading.`;
      daemonStatusBar.backgroundColor = new vscode.ThemeColor('statusBarItem.warningBackground'); // Orange
    }
    daemonStatusBar.show();
  }

  function updateIndexDisplay(): void {
    if (indexState === 'fresh') {
      indexStatusBar.text = `$(database) Index: Fresh`;
      indexStatusBar.tooltip = `Semantic Codebase Index is up to date.`;
      indexStatusBar.backgroundColor = undefined;
      indexStatusBar.show();
    } else if (indexState === 'stale') {
      indexStatusBar.text = `$(database) Index: Stale`;
      indexStatusBar.tooltip = `Codebase has been modified since last indexing.`;
      indexStatusBar.backgroundColor = new vscode.ThemeColor('statusBarItem.warningBackground');
      indexStatusBar.show();
    } else if (indexState === 'indexing') {
      indexStatusBar.text = `$(sync~spin) Indexing...`;
      indexStatusBar.tooltip = `Currently indexing codebase.`;
      indexStatusBar.backgroundColor = new vscode.ThemeColor('statusBarItem.warningBackground');
      indexStatusBar.show();
    } else {
      indexStatusBar.hide();
    }
  }

  updateDaemonDisplay();
  updateIndexDisplay();

  return {
    updateMcpStatus(connected: boolean): void {
      // Backward compatibility: map MCP status to daemon status if not managed elsewhere
      this.updateDaemonStatus(connected ? 'running' : 'stopped');
    },
    updateDaemonStatus(state: 'running' | 'stopped' | 'loading'): void {
      daemonState = state;
      updateDaemonDisplay();
    },
    updateIndexStatus(state: 'fresh' | 'stale' | 'indexing'): void {
      indexState = state;
      updateIndexDisplay();
    },
    dispose(): void {
      daemonStatusBar.dispose();
      indexStatusBar.dispose();
    },
  };
}
