import * as vscode from 'vscode';
import type { MessageContext } from '../types/message-context.types';
import type { MessageHandler } from '../types/message-handler.types';
import * as path from 'path';

export const DeleteAssetHandler = function (this: MessageHandler): void {};

DeleteAssetHandler.prototype.handle = async function (
  this: MessageHandler,
  payload: unknown,
  _context: MessageContext,
): Promise<void> {
  const { type, id } = payload as { type: string; id: string };

  if (!type || !id || !(_context as any).workspaceRoot) return;
  const workspaceRoot = (_context as any).workspaceRoot;

  const folderMap: Record<string, string> = {
    'agent': 'agents',
    'dag': 'dags',
    'technology': 'technologies',
  };
  const folderName = folderMap[type];
  if (!folderName) return;

  const fullPath = path.join(workspaceRoot, '.agencee', 'config', folderName, `${id}.json`);

  try {
    const uri = vscode.Uri.file(fullPath);
    await vscode.workspace.fs.delete(uri, { useTrash: true });
    vscode.window.showInformationMessage(`Asset deleted: ${uri.fsPath}`);
  } catch (err) {
    vscode.window.showErrorMessage(`Failed to delete asset: ${err instanceof Error ? err.message : String(err)}`);
  }
};
