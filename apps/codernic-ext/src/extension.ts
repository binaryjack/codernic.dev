import * as vscode from 'vscode';
import { abortExecution } from './features/codernic/agent-mode/dag-runner';
import {
  resolveAgentsDir,
  resolvePromptsDir,
  resolveRulesDir,
  resolveTechsDir,
} from './features/tech-catalog';
import { TelemetryBridge } from './telemetry-bridge';
import { broadcastLlms, broadcastRouteProfiles } from './shared/api/llm-utils';
import { createChatParticipant, createCodernicParticipant } from './shared/chat-participant';
import { runActivate } from './shared/error-utils';
import {
  createMcpConnectionManager,
  type McpConnectionManager,
} from './shared/mcp';
import { initMcpLifecycle } from './shared/mcp/lifecycle';
import { createExtensionStatusBar } from './shared/status';
import { registerWebSocketAndGetBroadcastAndMcp } from './shared/web-socket/web-socket-server';
import * as fs from 'fs';
import {
  checkWorkspacePackages,
  scaffoldAgenceeConfig,
  guidedSetupWorkflow,
  detectHardwareDriver,
  ensureDaemonRunning,
  checkCodebaseFreshness,
  tailFile,
  queryDaemonStatus
} from './shared/workspace-setup';
import { initLlmRunner } from './features/codernic/model/llm-runner';
import { registerHealthCommand } from './features/codernic/model/commands/register-health-command';
import { resolvePlatformBinaries } from './utils/binaries';
import { CopilotHttpProxy } from './shared/api/copilot-http-proxy';



export const activate = async function (
  context: vscode.ExtensionContext,
): Promise<McpConnectionManager | null> {
  let broadcastFn: ((payload: unknown) => void) | null = null;
  let logBuffer: { timestamp: string; message: string }[] = [];

  // Set up interval to flush logs batch every 200ms
  setInterval(() => {
    if (logBuffer.length > 0 && broadcastFn) {
      try {
        broadcastFn({
          type: 'codernic:system-log-batch',
          payload: {
            logs: logBuffer,
          }
        });
        logBuffer = [];
      } catch (e) {
        // ignore
      }
    }
  }, 200);

  const rawChannel = vscode.window.createOutputChannel('AI Agencee');
  const channel = {
    appendLine: (value: string) => {
      rawChannel.appendLine(value);
      logBuffer.push({
        timestamp: new Date().toISOString(),
        message: value,
      });
    },
    append: (value: string) => {
      rawChannel.append(value);
    },
    show: (preserveFocus?: boolean) => {
      rawChannel.show(preserveFocus);
    },
    dispose: () => {
      rawChannel.dispose();
    },
    name: rawChannel.name,
    clear: () => rawChannel.clear(),
    hide: () => rawChannel.hide(),
  } as vscode.OutputChannel;

  let exportedMcpManager: McpConnectionManager | null = null;

  await runActivate(channel, async () => {
    const packageJson = context.extension.packageJSON;
    const startTime = Date.now();
    channel.appendLine(`[INIT] AI Agencee v${packageJson.version} activating...`);

    // === PHASE 0: Zero-Compile Binaries Resolution ===
    let resolvedBinaries: ReturnType<typeof resolvePlatformBinaries> | null = null;
    try {
      resolvedBinaries = resolvePlatformBinaries(context.extensionPath);
      channel.appendLine(`[INIT] Zero-Compile Binaries resolved for architecture.`);
      
      // Clear legacy global config if it's there
      const config = vscode.workspace.getConfiguration();
      if (config.get('ai-agencee.mcpPath')) {
        await config.update('ai-agencee.mcpPath', undefined, vscode.ConfigurationTarget.Global);
      }
    } catch (err) {
      channel.appendLine(`[WARN] Zero-Compile fallback: ${err instanceof Error ? err.message : String(err)}`);
    }

    // === PHASE 1: Workspace Detection ===
    const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath ?? '';
    const agentsDir = workspaceRoot ? resolveAgentsDir(workspaceRoot) : '';
    const rulesDir = workspaceRoot ? resolveRulesDir(workspaceRoot) : '';
    const techsDir = workspaceRoot ? resolveTechsDir(workspaceRoot) : '';
    const promptsDir = workspaceRoot ? resolvePromptsDir(workspaceRoot) : '';

    if (workspaceRoot) {
      channel.appendLine(`[INIT] Workspace: ${workspaceRoot}`);
    } else {
      channel.appendLine('[INIT] No workspace folder open');
    }

    // === PHASE 1.5: Workspace Setup ===
    if (workspaceRoot) {
      await scaffoldAgenceeConfig(workspaceRoot, context.extensionPath, channel);
      await checkWorkspacePackages(
        workspaceRoot,
        context.extensionPath,
        channel,
        context.workspaceState,
      );
    }

    // === PHASE 2: Tree Provider Creation ===
    // Removed TcTreeProvider

    // === PHASE 3: Status Bar & Architecture Hybride ===
    const extStatusBar = createExtensionStatusBar(packageJson.version);
    context.subscriptions.push(extStatusBar);

    // Set up MCP connection manager FIRST
    const mcpManager = createMcpConnectionManager();
    exportedMcpManager = mcpManager;

    // Set up local Copilot proxy
    const copilotProxy = new CopilotHttpProxy();
    context.subscriptions.push(copilotProxy);
    copilotProxy.start().catch(err => {
      channel.appendLine(`[CopilotProxy] Failed to start local proxy: ${err}`);
    });

    initLlmRunner(context, mcpManager);

    // Instanciation du serveur WebSocket (remplace la Webview)
    const [broadcastToUI, reExportedMcpManager] = registerWebSocketAndGetBroadcastAndMcp(
      context,
      exportedMcpManager,
      workspaceRoot,
      channel,
    ) as [(payload: unknown) => void, McpConnectionManager];

    broadcastFn = broadcastToUI;

    const telemetryBridge = new TelemetryBridge(broadcastToUI);
    context.subscriptions.push(telemetryBridge);

    context.subscriptions.push(channel);

    context.subscriptions.push(
      // Re-broadcast LLM list vers le WebSocket
      vscode.lm.onDidChangeChatModels(() => {
        broadcastLlms((msg) => broadcastToUI(msg), context, workspaceRoot);
        broadcastRouteProfiles((msg) => broadcastToUI(msg), workspaceRoot);
      }),
      vscode.commands.registerCommand('ai-agencee.showLogs', () => channel.show()),
      vscode.commands.registerCommand('codernic.stopDAG', () => {
        abortExecution();
        vscode.window.showInformationMessage('DAG execution stopped.');
      }),
      vscode.commands.registerCommand('ai-agencee.openTui', () => {
        vscode.window.showInformationMessage(
          'AI Agencee TUI is not yet available in this version. Use the Codernic panel instead.'
        );
      }),
      vscode.commands.registerCommand('ai-agencee.openCodernic', async () => {
        vscode.env.openExternal(
          vscode.Uri.parse(process.env.VITE_CODERNIC_URL || 'http://localhost:47321'),
        );
      }),
      (() => { registerHealthCommand(context); return { dispose: () => {} }; })(),
      vscode.commands.registerCommand('ai-agencee.showWelcome', () => {
        if (!workspaceRoot) {
          vscode.window.showErrorMessage('Please open a workspace folder first');
        } else {
          vscode.window.showInformationMessage('Welcome to AI Agencee. Open Codernic UI to start.');
        }
      }),
      vscode.commands.registerCommand('ai-agencee.showQualityGates', () => {
        vscode.window.showInformationMessage('Open Codernic UI to view Quality Gates.');
      }),
    );

    // Participants de chat
    const chatParticipant = createChatParticipant(null, channel);
    context.subscriptions.push(chatParticipant);

    const codernicParticipant = createCodernicParticipant(null, channel);
    context.subscriptions.push(codernicParticipant);

    // === PHASE 4: Infrastructure (Indexing & MCP) ===
    if (workspaceRoot) {
      initMcpLifecycle(context, mcpManager, workspaceRoot, extStatusBar, channel);
    }

    // === PHASE 5: Commands Registration ===
    // Removed registerTcCommands

    // CORRECTION DU BUG DE SYNTAXE ET REDIRECTION VERS WEBSOCKET
    const addFileToContextDisposable = vscode.commands.registerCommand(
      'codernic.addFileToContext',
      async (uri: vscode.Uri) => {
        const targetUri = uri || vscode.window.activeTextEditor?.document.uri;
        if (!targetUri || targetUri.scheme !== 'file') return;

        const activeEditor = vscode.window.activeTextEditor;
        let lines: [number, number] | undefined = undefined;

        if (activeEditor && activeEditor.document.uri.fsPath === targetUri.fsPath) {
          const selection = activeEditor.selection;
          if (!selection.isEmpty) {
            lines = [selection.start.line + 1, selection.end.line + 1];
          }
        }

        const payload = {
          type: 'CODERNIC_CONTEXT_ADD_FILE',
          filePath: targetUri.fsPath,
          lines,
        };

        vscode.window.setStatusBarMessage(
          `$(check) Codernic: Context injecté (${targetUri.fsPath.split('/').pop()}${
            lines ? ` [Lines ${lines[0]}:${lines[1]}]` : ''
          })`,
          3000,
        );

        // Utilisation propre du pont WebSocket à la place de l'ancienne Webview
        broadcastToUI(payload);
      },
    );
    context.subscriptions.push(addFileToContextDisposable);

    channel.appendLine('[COMMANDS] ✓ Registered');

    // === PHASE 6: Data Loading ===
    // Managed via IPC now

    // === PHASE 7: File Watcher ===
    if (workspaceRoot) {
      let debounceTimer: ReturnType<typeof setTimeout> | null = null;
      const watcher = vscode.workspace.createFileSystemWatcher(
        new vscode.RelativePattern(workspaceRoot, '.agencee/config/**'),
      );
      const scheduleRefresh = () => {
        if (debounceTimer) clearTimeout(debounceTimer);
        debounceTimer = setTimeout(async () => {
          debounceTimer = null;
          channel.appendLine('[TREE] ↺ File change detected — UI refresh might be needed');
          broadcastFn?.({ type: 'codernic:assets-changed' });
        }, 500);
      };
      watcher.onDidCreate(scheduleRefresh);
      watcher.onDidChange(scheduleRefresh);
      watcher.onDidDelete(scheduleRefresh);
      context.subscriptions.push(watcher);
      channel.appendLine('[TREE] ✓ File watcher registered for .agencee/config/**');
    }

    // === PHASE 8: First Launch Welcome & Onboarding ===
    const hasSeenWelcome = context.globalState.get('ai-agencee.hasSeenWelcome', false);

    // Always run daemon startup logic if we have a workspace
    if (workspaceRoot) {
      setTimeout(async () => {
        const driver = await detectHardwareDriver();
        channel.appendLine(`[INIT] Host hardware capability: ${driver.toUpperCase()}`);

        await ensureDaemonRunning(context.extensionPath, channel);

        // Setup log tailing
        const daemonLog = '/tmp/ai_agencee_daemon.log';
        const indexerLog = '/tmp/ai_agencee_indexer.log';

        const tailLog = (filePath: string, prefix: string) => {
          try {
            if (!fs.existsSync(filePath)) {
              fs.writeFileSync(filePath, '');
            }
            const watcher = tailFile(filePath, (line) => {
              channel.appendLine(`${prefix} ${line}`);
            });
            context.subscriptions.push({ dispose: () => watcher.close() });
          } catch (e) {
            channel.appendLine(`[LOG-TAIL] Failed to tail ${filePath}: ${e}`);
          }
        };

        tailLog(daemonLog, '[DAEMON]');
        tailLog(indexerLog, '[INDEXER]');

        // Periodic daemon status and GPU VRAM check (5s)
        const checkStatus = async () => {
          const status = await queryDaemonStatus();
          const isAlive = status !== null;
          let vramUsageVal = null;
          if (isAlive && status) {
             vramUsageVal = (status && status.Status) ? status.Status.vram_used_gb : null;
          }
          broadcastToUI({
            type: 'codernic:system-status',
            payload: {
              daemonStatus: isAlive ? 'running' : 'stopped',
              vramUsage: vramUsageVal,
              gpuTarget: driver.toUpperCase(),
            },
          });
        };

        // Query once immediately and then setup interval
        await checkStatus();
        const statusInterval = setInterval(checkStatus, 5000);
        context.subscriptions.push({ dispose: () => clearInterval(statusInterval) });



        await checkCodebaseFreshness(workspaceRoot, context.extensionPath, channel, broadcastToUI);
      }, 1000);
    }

    if (!hasSeenWelcome && workspaceRoot) {
      channel.appendLine('[WELCOME] First launch detected — running onboarding in background');
      setTimeout(async () => {
        context.globalState.update('ai-agencee.hasSeenWelcome', true);
        await guidedSetupWorkflow(workspaceRoot, context.extensionPath, channel, context);
      }, 1500);
    } else if (workspaceRoot) {
      channel.appendLine('[WELCOME] Subsequent launch detected.');
    }

    const duration = Date.now() - startTime;
    channel.appendLine(`[INIT] ✓ Activation completed in ${duration}ms`);
  });

  return exportedMcpManager;
};

export const deactivate = function (): void {
  // nothing
};
