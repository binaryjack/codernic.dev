import type { MessageContext } from '../types/message-context.types';
import type { MessageHandler } from '../types/message-handler.types';
import { getDaemonMetadata, ensureDaemonRunning } from '../../../../shared/workspace-setup';
import { spawn } from 'child_process';
import * as vscode from 'vscode';

export class DaemonActionHandler implements MessageHandler {
  async handle(payload: unknown, context: MessageContext): Promise<void> {
    const { action } = payload as { action: 'start' | 'stop' | 'restart' };
    const { channel, extensionPath } = context;

    channel.appendLine(`[DAEMON UI] Received daemon action: ${action}`);

    if (!extensionPath) {
      channel.appendLine('[DAEMON] Missing extensionPath in context');
      return;
    }

    try {
      const metadata = await getDaemonMetadata();

      if (action === 'stop' || action === 'restart') {
        if (metadata) {
          channel.appendLine(`[DAEMON UI] Stopping daemon PID ${metadata.pid}`);
          try {
            process.kill(metadata.pid, 'SIGINT'); // graceful
            // wait a bit
            await new Promise((r) => setTimeout(r, 1000));
            // if still alive, sigterm
            if (await getDaemonMetadata()) {
              process.kill(metadata.pid, 'SIGKILL');
            }
            channel.appendLine(`[DAEMON UI] Daemon PID ${metadata.pid} stopped successfully.`);
          } catch (e) {
            channel.appendLine(`[DAEMON UI] Error killing daemon: ${e}`);
          }
        } else {
          channel.appendLine('[DAEMON UI] Daemon not running, cannot stop.');
        }
      }

      if (action === 'start' || action === 'restart') {
        channel.appendLine(`[DAEMON UI] Triggering ensureDaemonRunning to start daemon...`);
        vscode.window.showInformationMessage('AI Agencee: Starting background daemon...');
        await ensureDaemonRunning(extensionPath, channel as unknown as vscode.OutputChannel);
        channel.appendLine(`[DAEMON UI] ensureDaemonRunning completed.`);
      }
    } catch (err: unknown) {
      channel.appendLine(`[DAEMON UI] Action ${action} failed: ${(err instanceof Error ? err.message : String(err))}`);
    }
  }
}
