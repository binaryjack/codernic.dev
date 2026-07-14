import * as path from 'path';
import * as vscode from 'vscode';
import { ExtensionStatusBar } from '../status/extension-status.js';
import {
  callMcpTool,
  createMcpClient,
  findMcpBinary,
  type McpClientInstance,
  type McpConnectionManager,
} from './index.js';

export function initMcpLifecycle(
  context: vscode.ExtensionContext,
  mcpManager: McpConnectionManager,
  workspaceRoot: string,
  extStatusBar: ExtensionStatusBar,
  channel: vscode.OutputChannel,
): void {
  let reconnectAttempts = 0;
  const maxReconnectAttempts = 5;
  let mcpClient: McpClientInstance | undefined;

  // Create diagnostic collection for MCP errors
  const mcpDiagnostics = vscode.languages.createDiagnosticCollection('ai-agencee-mcp');
  context.subscriptions.push(mcpDiagnostics);

  async function tryConnectMcp() {
    if (!workspaceRoot) return;

    mcpDiagnostics.clear();

    const mcpPath = await findMcpBinary(workspaceRoot, channel, context.extensionPath);
    if (!mcpPath) {
      channel.appendLine('[MCP] ❌ findMcpBinary returned null');
      const errorMessage =
        'AI Agencee: Rust Engine (ai_agencee_codernic) not found. Please build the engine to continue.';
      channel.appendLine(`[MCP] ❌ ${errorMessage}`);

      if (reconnectAttempts === 0) {
        vscode.window.showErrorMessage(errorMessage, 'Build Engine').then((selection) => {
          if (selection === 'Build Engine') {
            vscode.commands.executeCommand('ai-agencee.buildEngine');
          }
        });
      }

      // Add a diagnostic for the missing binary
      const diagnostic = new vscode.Diagnostic(
        new vscode.Range(0, 0, 0, Number.MAX_SAFE_INTEGER), // Workspace-level error
        'Rust Engine not found. Run "Build Engine" to fix.',
        vscode.DiagnosticSeverity.Error,
      );
      diagnostic.source = 'AI Agencee MCP';
      mcpDiagnostics.set(vscode.Uri.file(workspaceRoot), [diagnostic]);
      extStatusBar.updateMcpStatus(false);
      return;
    }

    // Detect engine type and prepare arguments
    const isRagtime = mcpPath.endsWith('ragtime_cli') || mcpPath.endsWith('ragtime_cli.exe');
    const isCodernic =
      mcpPath.endsWith('ai_agencee_codernic') || mcpPath.endsWith('ai_agencee_codernic.exe');
    let mcpArgs: string[] = [];

    if (isRagtime) {
      const workspaceFolders = vscode.workspace.workspaceFolders || [];
      const ragtimeFolder = workspaceFolders.find((f) =>
        f.uri.fsPath.toLowerCase().includes('ragtime'),
      );
      const ragtimeRoot = ragtimeFolder ? ragtimeFolder.uri.fsPath : workspaceRoot;

      // Construct paths for models and database
      const modelPath = path.join(ragtimeRoot, 'models', 'bert-tiny');
      const dbPath = path.join(ragtimeRoot, '.codernic', 'ragtime.db');

      mcpArgs = ['serve', '--mcp', '--model-path', modelPath, '--db-path', dbPath];
      channel.appendLine(`[MCP] Detected Ragtime. Using model: ${modelPath}`);
    } else if (isCodernic) {
      channel.appendLine(`[MCP] Detected AI Agencee Codernic Engine`);
      // Codernic starts MCP on main() directly, no extra args needed for basic operation
    }

    try {
      channel.appendLine(`[MCP] Discovery: using ${mcpPath}`);
      channel.appendLine(`[MCP] Connecting to server...`);
      const mcpInstance = await mcpManager.connect(
        () =>
          createMcpClient({
            serverPath: mcpPath,
            projectRoot: workspaceRoot,
            args: mcpArgs,
            logger: channel,
          }),
        30_000, // Increased timeout for Rust engine startup (30s)
      );
      if (mcpInstance) {
        channel.appendLine('[MCP] ✓ Connected');
        extStatusBar.updateMcpStatus(true);
        reconnectAttempts = 0;

        // Set up auto-reconnect on close
        mcpInstance.onClose = () => {
          channel.appendLine('[MCP] ⚠️ Connection lost. Attempting to reconnect...');
          extStatusBar.updateMcpStatus(false);
          mcpClient = undefined;
          if (reconnectAttempts < maxReconnectAttempts) {
            reconnectAttempts++;
            const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), 30000);
            channel.appendLine(
              `[MCP] Reconnecting in ${delay}ms (attempt ${reconnectAttempts}/${maxReconnectAttempts})...`,
            );
            setTimeout(() => tryConnectMcp(), delay);
          } else {
            channel.appendLine('[MCP] ❌ Max reconnection attempts reached.');
            vscode.window
              .showErrorMessage(
                'AI Agencee: MCP Server connection lost. Please restart it manually.',
                'Restart',
              )
              .then((selection) => {
                if (selection === 'Restart') {
                  vscode.commands.executeCommand('ai-agencee.restartMcp');
                }
              });
          }
        };

        // Re-connect storeClient with the MCP client for richer stats
        mcpClient = mcpInstance;

        // Initialize Multi-root support
        const roots = vscode.workspace.workspaceFolders?.map((f) => f.uri.fsPath) || [];
        if (roots.length > 0) {
          try {
            await callMcpTool(mcpInstance, {
              name: 'atomos-structura/initialize-workspace',
              arguments: { rootPaths: roots },
            });
            channel.appendLine(`[MCP] Multi-root initialized with ${roots.length} roots`);
          } catch (err) {
            channel.appendLine(`[MCP] ⚠️ Multi-root initialization failed: ${err}`);
          }
        }
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      channel.appendLine(`[MCP] ❌ Connection failed: ${errorMsg}`);

      if (reconnectAttempts === 0) {
        vscode.window.showErrorMessage(
          `AI Agencee: MCP Server connection failed. Details: ${errorMsg}`,
        );
      }

      // Add a diagnostic for the connection failure
      const diagnostic = new vscode.Diagnostic(
        new vscode.Range(0, 0, 0, Number.MAX_SAFE_INTEGER), // Workspace-level error
        `MCP Server connection failed: ${errorMsg}`,
        vscode.DiagnosticSeverity.Error,
      );
      diagnostic.source = 'AI Agencee MCP';
      mcpDiagnostics.set(vscode.Uri.file(workspaceRoot), [diagnostic]);
      extStatusBar.updateMcpStatus(false);

      // Retry connection if it failed
      if (reconnectAttempts < maxReconnectAttempts) {
        reconnectAttempts++;
        const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), 30000);
        channel.appendLine(
          `[MCP] Reconnecting in ${delay}ms (attempt ${reconnectAttempts}/${maxReconnectAttempts})...`,
        );
        setTimeout(() => tryConnectMcp(), delay);
      }
    }
  }

  // Non-blocking — don't delay extension activation
  void tryConnectMcp();

  // Reconnect MCP if it drops (e.g. server rebuilt)
  context.subscriptions.push({
    dispose: async () => {
      await mcpManager.disconnect();
    },
  } as vscode.Disposable);

  // Workspace change listener to handle multi-root changes
  context.subscriptions.push(
    vscode.workspace.onDidChangeWorkspaceFolders(async () => {
      const newRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath ?? '';
      if (newRoot !== workspaceRoot) {
        channel.appendLine(
          `[INIT] Workspace folders changed, new root: ${newRoot}. Restarting clients...`,
        );
        await mcpManager.disconnect();
        // Update local variables if possible, or advise user to reload
        channel.appendLine(`[INIT] Please reload window to fully apply the new workspace root.`);
      }
    }),
  );

  // Register commands that were missing handlers safely
  try {
    context.subscriptions.push(
      vscode.commands.registerCommand('ai-agencee.restartMcp', async () => {
        channel.appendLine('[MCP] Manual restart triggered');
        await mcpManager.disconnect();
        await tryConnectMcp();
        vscode.window.showInformationMessage('AI Agencee: MCP Server restarted');
      }),
      vscode.commands.registerCommand('ai-agencee.buildEngine', async () => {
        channel.appendLine('[BUILD] Manual engine build triggered');
        const terminal = vscode.window.createTerminal('AI Agencee Engine Build');
        terminal.show();
        // Since ragtime is a sibling, we need to find it
        const workspaceFolders = vscode.workspace.workspaceFolders || [];
        const ragtimeFolder = workspaceFolders.find((f) => f.name.toLowerCase().includes('ragtime'));

        if (ragtimeFolder) {
          terminal.sendText(`cd "${ragtimeFolder.uri.fsPath}" && cargo build`);
        } else {
          channel.appendLine(
            '[BUILD] ✗ Ragtime folder not found in workspace. Trying cargo build in root...',
          );
          terminal.sendText('cargo build'); // Fallback to current folder
        }

        vscode.window.showInformationMessage(
          'AI Agencee: Building Ragtime engine... check terminal for progress.',
        );
      }),
    );
  } catch (err) {
    channel.appendLine(`[WARN] Failed to register MCP commands: ${err}`);
  }
}
