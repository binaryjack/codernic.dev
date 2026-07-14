import * as vscode from 'vscode';
import { abortExecution } from '../features/codernic/agent-mode/dag-runner';
import { PhaseActivator, BootstrapContext } from './types';
import { registerHealthCommand } from '../features/codernic/model/commands/register-health-command';
import { broadcastLlms, broadcastRouteProfiles } from '../shared/api/llm-utils';

export class CommandsPhase implements PhaseActivator {
  name = 'Commands Registration Phase';

  async activate(ctx: BootstrapContext): Promise<void> {
    const { vscodeContext, channel, workspaceRoot, networkConfig, broadcastToUI } = ctx;

    vscodeContext.subscriptions.push(
      vscode.lm.onDidChangeChatModels(() => {
        broadcastLlms((msg: any) => broadcastToUI(msg), vscodeContext, workspaceRoot);
        broadcastRouteProfiles((msg: any) => broadcastToUI(msg), workspaceRoot);
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
        const url = `http://localhost:${networkConfig.ui_dev_port || 5173}`;
        vscode.env.openExternal(vscode.Uri.parse(url));
      }),
      vscode.commands.registerCommand('ai-agencee.schemas.openCanvas', async () => {
        const url = `http://localhost:${networkConfig.ui_dev_port || 5173}`;
        vscode.env.openExternal(vscode.Uri.parse(`${url}#/schemas`));
      }),
      vscode.commands.registerCommand('ai-agencee.buildEngine', async () => {
        vscode.window.showInformationMessage('Triggering Codernic Engine Build...');
        const terminal = vscode.window.createTerminal('Codernic Build');
        terminal.show();
        terminal.sendText('cargo build -p ai_agencee_engine_agent --release');
      }),
      (() => { registerHealthCommand(vscodeContext); return { dispose: () => {} }; })(),
      vscode.commands.registerCommand('ai-agencee.showWelcome', () => {
        if (!workspaceRoot) {
          vscode.window.showErrorMessage('Please open a workspace folder first');
        } else {
          vscode.window.showInformationMessage('Welcome to AI Agencee. Open Codernic UI to start.');
        }
      }),
      vscode.commands.registerCommand('ai-agencee.showQualityGates', async () => {
        const url = `http://localhost:${networkConfig.ui_dev_port || 5173}`;
        vscode.env.openExternal(vscode.Uri.parse(`${url}#/quality-gates`));
      }),
    );

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

        broadcastToUI(payload);
      },
    );
    vscodeContext.subscriptions.push(addFileToContextDisposable);

    channel.appendLine('[COMMANDS] ✓ Registered');
  }
}
