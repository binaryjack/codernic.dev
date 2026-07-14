import * as vscode from 'vscode';
import { PhaseActivator, BootstrapContext } from './types';
import { detectHardwareDriver, checkCodebaseFreshness, tailFile, queryDaemonStatus, guidedSetupWorkflow } from '../shared/workspace-setup';
import * as fs from 'fs';

export class LifecyclePhase implements PhaseActivator {
  name = 'Lifecycle & Watchers Phase';

  async activate(ctx: BootstrapContext): Promise<void> {
    const { vscodeContext, channel, workspaceRoot, broadcastToUI, extStatusBar } = ctx;

    if (workspaceRoot) {
      let debounceTimer: ReturnType<typeof setTimeout> | null = null;
      const watcher = vscode.workspace.createFileSystemWatcher(
        new vscode.RelativePattern(workspaceRoot, '.codernic/{llms,config,agents,dags,technologies}/**'),
      );
      const scheduleRefresh = (uri: vscode.Uri) => {
        if (uri.fsPath.includes('artifacts') || uri.fsPath.includes('sessions')) return;
        if (debounceTimer) clearTimeout(debounceTimer);
        debounceTimer = setTimeout(async () => {
          debounceTimer = null;
          channel.appendLine('[TREE] ↺ File change detected — UI refresh might be needed');
          broadcastToUI?.({ type: 'codernic:assets-changed' });
          if (uri.fsPath.includes('llms') || uri.fsPath.includes('.provider.json')) {
            const { broadcastLlms, broadcastRouteProfiles } = require('../shared/api/llm-utils');
            broadcastLlms((msg: Record<string, unknown>) => broadcastToUI?.(msg), vscodeContext, workspaceRoot);
            broadcastRouteProfiles((msg: Record<string, unknown>) => broadcastToUI?.(msg), workspaceRoot);
          }
        }, 500);
      };
      watcher.onDidCreate(scheduleRefresh);
      watcher.onDidChange(scheduleRefresh);
      watcher.onDidDelete(scheduleRefresh);
      vscodeContext.subscriptions.push(watcher);
      channel.appendLine('[TREE] ✓ File watcher registered for .codernic/config/**');

      setTimeout(async () => {
        const driver = await detectHardwareDriver();
        channel.appendLine(`[INIT] Host hardware capability: ${driver.toUpperCase()}`);

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
            vscodeContext.subscriptions.push({ dispose: () => watcher.close() });
          } catch (e) {
            channel.appendLine(`[LOG-TAIL] Failed to tail ${filePath}: ${e}`);
          }
        };

        tailLog(daemonLog, '[DAEMON]');
        tailLog(indexerLog, '[INDEXER]');

        const checkStatus = async () => {
          const status = await queryDaemonStatus();
          const isAlive = status !== null;
          let vramUsageVal = null;
          let vramTotalVal = null;
          let totalRamVal = null;
          if (isAlive && status && status.Status) {
             vramUsageVal = status.Status.vram_used_gb;
             vramTotalVal = status.Status.vram_total_gb;
             totalRamVal = status.Status.total_ram_gb;
          }
          extStatusBar.updateDaemonStatus(isAlive ? 'running' : 'stopped');
          broadcastToUI({
            type: 'codernic:system-status',
            payload: {
              daemonStatus: isAlive ? 'running' : 'stopped',
              vramUsage: vramUsageVal,
              vramTotal: vramTotalVal,
              totalRam: totalRamVal,
              gpuTarget: driver.toUpperCase(),
            },
          });
        };

        await checkStatus();
        const statusInterval = setInterval(checkStatus, 5000);
        vscodeContext.subscriptions.push({ dispose: () => clearInterval(statusInterval) });

        await checkCodebaseFreshness(workspaceRoot, vscodeContext.extensionPath, channel, broadcastToUI, extStatusBar);
      }, 1000);
    }

    const hasSeenWelcome = vscodeContext.globalState.get('ai-agencee.hasSeenWelcome', false);
    if (!hasSeenWelcome && workspaceRoot) {
      channel.appendLine('[WELCOME] First launch detected — running onboarding in background');
      setTimeout(async () => {
        vscodeContext.globalState.update('ai-agencee.hasSeenWelcome', true);
        await guidedSetupWorkflow(workspaceRoot, vscodeContext.extensionPath, channel, vscodeContext);
      }, 1500);
    } else if (workspaceRoot) {
      channel.appendLine('[WELCOME] Subsequent launch detected.');
    }
  }
}
