import * as vscode from 'vscode';
import type { MessageContext } from '../types/message-context.types';
import type { MessageHandler } from '../types/message-handler.types';
import * as path from 'path';

export const CreateAssetHandler = function (this: MessageHandler): void {};

CreateAssetHandler.prototype.handle = async function (
  this: MessageHandler,
  payload: unknown,
  _context: MessageContext,
): Promise<void> {
  const { type } = payload as { type: string };

  if (!type || !(_context as any).workspaceRoot) return;
  const workspaceRoot = (_context as any).workspaceRoot;

  const folderMap: Record<string, string> = {
    'agent': 'agents',
    'dag': 'dags',
    'technology': 'technologies',
  };

  const folderName = folderMap[type];
  if (!folderName) {
    vscode.window.showErrorMessage(`Unknown asset type: ${type}`);
    return;
  }

  const fileName = await vscode.window.showInputBox({
    prompt: `Enter a name for the new ${type} (without .json)`,
    placeHolder: `my_new_${type}`,
  });

  if (!fileName) {
    return; // User cancelled
  }

  const fullPath = path.join(workspaceRoot, '.agencee', 'config', folderName, `${fileName}.json`);

  try {
    const uri = vscode.Uri.file(fullPath);
    // Create an empty json file
    const content = new Uint8Array(Buffer.from('{\n  "name": "' + fileName + '"\n}'));
    await vscode.workspace.fs.writeFile(uri, content);
    
    // Open it
    const doc = await vscode.workspace.openTextDocument(uri);
    await vscode.window.showTextDocument(doc);
  } catch (err) {
    vscode.window.showErrorMessage(`Failed to create asset: ${err instanceof Error ? err.message : String(err)}`);
  }
};
