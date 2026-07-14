import * as vscode from 'vscode';
import type { MessageContext } from '../types/message-context.types';
import type { MessageHandler } from '../types/message-handler.types';
import * as path from 'path';
import { AssetPathResolver } from '../strategies/asset-path-resolver';

export const DeleteAssetHandler = function (this: MessageHandler): void {};

DeleteAssetHandler.prototype.handle = async function (
  this: MessageHandler,
  payload: unknown,
  _context: MessageContext,
): Promise<void> {
  const { type, id, transactionId } = payload as { type: string; id: string; transactionId?: string };

  if (!type || !id || !_context.workspaceRoot) {
    if (transactionId && _context.reply) {
      _context.reply({ type: 'codernic:command-error', payload: { transactionId, error: 'Missing type, id, or workspaceRoot' } });
    }
    return;
  }
  const workspaceRoot = _context.workspaceRoot;

  let fullPath = '';
  let isDirectory = false;
  
  try {
    const strategy = AssetPathResolver.getStrategy(type);
    // Actually, delete should be based on write path, or read path? Usually write path.
    fullPath = await strategy.resolveWritePath(workspaceRoot, id);
    isDirectory = strategy.isDirectory();
  } catch (err: unknown) {
    vscode.window.showErrorMessage((err instanceof Error ? err.message : String(err)));
    if (transactionId && _context.reply) {
      _context.reply({ type: 'codernic:command-error', payload: { error: (err instanceof Error ? err.message : String(err)), transactionId } });
    }
    return;
  }

  try {
    const uri = vscode.Uri.file(fullPath);
    await vscode.workspace.fs.delete(uri, { recursive: isDirectory, useTrash: true });
    
    // Update technology index if deleting a tech
    if (type === 'technology') {
      const parentDir = path.dirname(fullPath);
      const indexPath = path.join(parentDir, 'index.json');
      try {
        const indexUri = vscode.Uri.file(indexPath);
        const raw = await vscode.workspace.fs.readFile(indexUri);
        const indexData: string[] = JSON.parse(new TextDecoder().decode(raw));
        const filtered = indexData.filter((t) => t !== id);
        await vscode.workspace.fs.writeFile(indexUri, new TextEncoder().encode(JSON.stringify(filtered, null, 2)));
      } catch (e) {
        // Index might not exist or failed to update, ignore
      }
    }

    if (transactionId && _context.reply) {
      _context.reply({ type: 'codernic:asset-deleted', payload: { type, id, transactionId } });
    }
  } catch (err) {
    vscode.window.showErrorMessage(`Failed to delete asset: ${err instanceof Error ? (err instanceof Error ? err.message : String(err)) : String(err)}`);
    if (transactionId && _context.reply) {
      _context.reply({ type: 'codernic:command-error', payload: { error: err instanceof Error ? (err instanceof Error ? err.message : String(err)) : String(err), transactionId } });
    }
  }
};
