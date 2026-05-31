import * as vscode from 'vscode';
import { AieEditorPanel, TieEditorPanel } from './features/agent-editor';
import { abortExecution } from './features/codernic/agent-mode/dag-runner';
import { QualityGatePanel, type DagResult } from './features/quality-gates';
import { SchemasWebviewProvider } from './features/schemas';
import type { AgentEntry, TechEntry } from './features/tech-catalog';
import {
  registerTcCommands,
  resolveAgentsDir,
  resolvePromptsDir,
  resolveRulesDir,
  resolveTechsDir,
  TcItemInstance,
  TcTreeProvider,
  writeAgent,
  writeTech,
} from './features/tech-catalog';
import { WelcomePanel } from './features/welcome';
import { broadcastLlms } from './shared/api/llm-utils';
import { createChatParticipant, createCodernicParticipant } from './shared/chat-participant';
import { notify, runActivate, wrapCmd } from './shared/error-utils';
import {
  createMcpConnectionManager,
  type McpClientInstance,
  type McpConnectionManager,
} from './shared/mcp';
import { initMcpLifecycle } from './shared/mcp/lifecycle';
import { createExtensionStatusBar } from './shared/status';
import { registerWebSocketAndGetBroadcastAndMcp } from './shared/web-socket/web-socket-server';
import {
  checkWorkspacePackages,
  scaffoldAgenceeConfig,
  guidedSetupWorkflow,
  detectHardwareDriver,
  pingDaemon,
  ensureDaemonRunning,
  checkCodebaseFreshness
} from './shared/workspace-setup';

// --- TYPES ---
type TcProvider = vscode.TreeDataProvider<TcItemInstance> & {
  refresh(node?: TcItemInstance): void;
  loadAgents(): Promise<void>;
  addAgent(label: string): Promise<TcItemInstance>;
  renameAgent(id: string, newLabel: string): Promise<void>;
  removeAgent(id: string): Promise<void>;
  loadRules(): Promise<void>;
  loadDags(): Promise<void>;
  loadPrompts(): Promise<void>;
  loadTechs(): Promise<void>;
  addTech(label: string): Promise<TcItemInstance>;
  renameTech(id: string, newLabel: string): Promise<void>;
  removeTech(id: string): Promise<void>;
  loadProviders(): Promise<void>;
};
type TcTreeProviderCtor = {
  new (
    agentsDir: string,
    rulesDir: string,
    techsDir: string,
    promptsDir: string,
    version?: string,
  ): TcProvider;
};

type SchemasWebviewProviderCtor = {
  new (
    ctx: vscode.ExtensionContext,
    getMcpClient: () => McpClientInstance | undefined,
    workspaceRoot: string,
  ): vscode.WebviewViewProvider;
};
type AieEditorPanelCtor = {
  new (
    ctx: vscode.ExtensionContext,
    onSave: (entry: AgentEntry) => Promise<void>,
    techsDir: string,
    onTechCreated?: () => Promise<void>,
  ): { open(entry: AgentEntry): void };
};
type TieEditorPanelCtor = {
  new (
    ctx: vscode.ExtensionContext,
    onSave: (entry: TechEntry) => Promise<void>,
  ): { open(entry: TechEntry): void };
};

export const activate = async function (
  context: vscode.ExtensionContext,
): Promise<McpConnectionManager | null> {
  const channel = vscode.window.createOutputChannel('AI Agencee');
  let exportedMcpManager: McpConnectionManager | null = null;

  await runActivate(channel, async () => {
    const packageJson = context.extension.packageJSON;
    const startTime = Date.now();
    channel.appendLine(`[INIT] AI Agencee v${packageJson.version} activating...`);

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
    let tc: TcProvider;
    try {
      tc = new (TcTreeProvider as unknown as TcTreeProviderCtor)(
        agentsDir,
        rulesDir,
        techsDir,
        promptsDir,
        packageJson.version,
      );
      channel.appendLine('[TREE] ✓ Provider created');
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err);
      channel.appendLine(`[TREE] ✗ Failed to create provider: ${errMsg}`);
      throw new Error(`Failed to create tree provider: ${errMsg}`);
    }

    // === PHASE 3: Status Bar & Architecture Hybride ===
    const extStatusBar = createExtensionStatusBar(packageJson.version);
    context.subscriptions.push(extStatusBar);

    const mcpManager = createMcpConnectionManager();
    exportedMcpManager = mcpManager;

    // Instanciation du serveur WebSocket (remplace la Webview)
    const [broadcastToUI, reExportedMcpManager] = registerWebSocketAndGetBroadcastAndMcp(
      context,
      exportedMcpManager,
      workspaceRoot,
      channel,
    ) as [(payload: unknown) => void, McpConnectionManager];

    const aie = new (AieEditorPanel as unknown as AieEditorPanelCtor)(
      context,
      wrapCmd(channel, async (entry) => {
        await writeAgent(agentsDir, entry as AgentEntry);
        await tc.loadAgents();
      }) as (entry: AgentEntry) => Promise<void>,
      techsDir,
      async () => {
        await tc.loadTechs();
      },
    );

    const tie = new (TieEditorPanel as unknown as TieEditorPanelCtor)(
      context,
      wrapCmd(channel, async (entry) => {
        await writeTech(techsDir, entry as TechEntry);
        await tc.loadTechs();
      }) as (entry: TechEntry) => Promise<void>,
    );

    const schemas = new (SchemasWebviewProvider as unknown as SchemasWebviewProviderCtor)(
      context,
      () => mcpManager.getClient() ?? undefined,
      workspaceRoot,
    );

    context.subscriptions.push(
      channel,
      vscode.window.registerTreeDataProvider('tc.assets', tc),
      vscode.window.registerWebviewViewProvider('ai-agencee.schemas', schemas, {
        webviewOptions: { retainContextWhenHidden: true },
      }),
      // Re-broadcast LLM list vers le WebSocket
      vscode.lm.onDidChangeChatModels(() => {
        broadcastLlms((msg) => broadcastToUI(msg));
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
      vscode.commands.registerCommand('ai-agencee.showWelcome', () => {
        if (workspaceRoot) {
          WelcomePanel.createOrShow(context.extensionUri, workspaceRoot, channel);
        } else {
          vscode.window.showErrorMessage('Please open a workspace folder first');
        }
      }),
      vscode.commands.registerCommand('ai-agencee.showQualityGates', (dagResult?: DagResult) => {
        if (dagResult) {
          QualityGatePanel.createOrShow(context.extensionUri, dagResult);
        } else {
          // Demo data
          const demoResult = {
            dagName: 'security-scan',
            runId: 'demo-' + Date.now(),
            status: 'success' as const,
            lanes: [],
            totalDurationMs: 5330,
            startedAt: new Date(Date.now() - 5330).toISOString(),
            completedAt: new Date().toISOString(),
          };
          QualityGatePanel.createOrShow(context.extensionUri, demoResult);
        }
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
    registerTcCommands(
      context,
      tc,
      { agentsDir, rulesDir, promptsDir, techsDir },
      aie,
      tie,
      channel,
    );

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
    const loadTreeData = async (silent = false) => {
      const tasks = [
        { name: 'Agents', fn: () => tc.loadAgents() },
        { name: 'DAGs', fn: () => tc.loadDags() },
        { name: 'Rules', fn: () => tc.loadRules() },
        { name: 'Prompts', fn: () => tc.loadPrompts() },
        { name: 'Techs', fn: () => tc.loadTechs() },
        { name: 'Providers', fn: () => tc.loadProviders() },
      ];

      for (const task of tasks) {
        try {
          await task.fn();
          if (!silent) channel.appendLine(`[TREE] ✓ ${task.name} loaded`);
        } catch (err) {
          const errMsg = err instanceof Error ? err.message : String(err);
          channel.appendLine(`[TREE] ✗ Failed to load ${task.name.toLowerCase()}: ${errMsg}`);
          if (!silent)
            void notify(
              'warn',
              `AI Agencee: Failed to load ${task.name.toLowerCase()}. Check Output for details.`,
            );
        }
      }
    };

    channel.appendLine('[TREE] Loading persisted data...');
    await loadTreeData();

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
          await loadTreeData(true);
          channel.appendLine('[TREE] ↺ File change detected — tree refreshed');
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
    if (!hasSeenWelcome && workspaceRoot) {
      channel.appendLine('[WELCOME] First launch detected — showing welcome panel & onboarding selector');
      setTimeout(async () => {
        WelcomePanel.createOrShow(context.extensionUri, workspaceRoot, channel);
        context.globalState.update('ai-agencee.hasSeenWelcome', true);
        await guidedSetupWorkflow(workspaceRoot, context.extensionPath, channel, context);
      }, 1000);
    } else if (workspaceRoot) {
      channel.appendLine('[WELCOME] Subsequent launch detected — checking health & index freshness');
      setTimeout(async () => {
        const driver = await detectHardwareDriver();
        channel.appendLine(`[INIT] Host hardware capability: ${driver.toUpperCase()}`);

        await ensureDaemonRunning(context.extensionPath, channel);

        await checkCodebaseFreshness(workspaceRoot, channel);
      }, 1000);
    }

    const duration = Date.now() - startTime;
    channel.appendLine(`[INIT] ✓ Activation completed in ${duration}ms`);
  });

  return exportedMcpManager;
};

export const deactivate = function (): void {
  // nothing
};
