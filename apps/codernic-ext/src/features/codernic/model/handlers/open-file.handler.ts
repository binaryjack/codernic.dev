import * as vscode from 'vscode';
import * as path from 'path';
import type { MessageContext } from '../types/message-context.types';
import type { MessageHandler } from '../types/message-handler.types';

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

  let fullPath = '';
  if (type === 'agent') {
    fullPath = path.join(_context.workspaceRoot, '.agencee', 'config', 'agents', `${id}.agent.json`);
  } else if (type === 'dag') {
    fullPath = path.join(_context.workspaceRoot, '.agencee', 'config', 'agents', `${id}.dag.json`);
  } else if (type === 'technology') {
    fullPath = path.join(_context.workspaceRoot, '.agencee', 'config', 'technologies', id, `${id}.tech.json`);
  } else {
    return;
  }

  try {
    const uri = vscode.Uri.file(fullPath);
    const doc = await vscode.workspace.openTextDocument(uri);
    const editor = await vscode.window.showTextDocument(doc);

  } catch (err) {
    vscode.window.showErrorMessage(`Failed to open file: ${err instanceof Error ? err.message : String(err)}`);
  }
};
