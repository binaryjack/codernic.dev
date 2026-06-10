import * as vscode from 'vscode';

export function registerHealthCommand(context: vscode.ExtensionContext) {
  const disposable = vscode.commands.registerCommand('ai-agencee.runSystemHealthCheck', () => {
    vscode.window.showInformationMessage('Ouverture du diagnostic système...');
    vscode.commands.executeCommand('ai-agencee.openCodernic');
  });
  context.subscriptions.push(disposable);
}
