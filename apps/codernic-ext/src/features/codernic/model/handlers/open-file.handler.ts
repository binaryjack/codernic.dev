import * as vscode from 'vscode';
import type { MessageContext } from '../types/message-context.types';
import type { MessageHandler } from '../types/message-handler.types';
import { AssetPathResolver } from '../strategies/asset-path-resolver';

export const OpenFileHandler = function (this: MessageHandler): void {};

OpenFileHandler.prototype.handle = async function (
  this: MessageHandler,
  payload: unknown,
  _context: MessageContext,
): Promise<void> {
  const { type, id } = payload as {
    type: string;
    id: string;
  };

  if (!type || !id || !_context.workspaceRoot) return;

  try {
    const strategy = AssetPathResolver.getStrategy(type);
    let fullPath = await strategy.resolveReadPath(_context.workspaceRoot, id);

    if (!fullPath) {
      // If the file doesn't exist yet, fallback to resolving the write path
      fullPath = await strategy.resolveWritePath(_context.workspaceRoot, id);
    }

    if (!fullPath) {
      throw new Error(`Could not resolve path for ${type} with id ${id}`);
    }

    const uri = vscode.Uri.file(fullPath);
    const doc = await vscode.workspace.openTextDocument(uri);
    await vscode.window.showTextDocument(doc);

  } catch (err) {
    vscode.window.showErrorMessage(`Failed to open file: ${err instanceof Error ? err.message : String(err)}`);
  }
};
