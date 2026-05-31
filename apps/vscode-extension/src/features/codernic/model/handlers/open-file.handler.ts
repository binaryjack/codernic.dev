import * as vscode from 'vscode';
import type { MessageContext } from '../types/message-context.types';
import type { MessageHandler } from '../types/message-handler.types';

export const OpenFileHandler = function (this: MessageHandler): void {};

OpenFileHandler.prototype.handle = async function (
  this: MessageHandler,
  payload: unknown,
  _context: MessageContext,
): Promise<void> {
  const { filePath, line } = payload as {
    filePath: string;
    line?: number;
  };

  if (!filePath) return;

  try {
    const uri = vscode.Uri.file(filePath);
    const doc = await vscode.workspace.openTextDocument(uri);
    const editor = await vscode.window.showTextDocument(doc);
    if (line !== undefined && line > 0) {
      const pos = new vscode.Position(line - 1, 0);
      editor.selection = new vscode.Selection(pos, pos);
      editor.revealRange(new vscode.Range(pos, pos), vscode.TextEditorRevealType.InCenter);
    }
  } catch (err) {
    vscode.window.showErrorMessage(`Failed to open file: ${err instanceof Error ? err.message : String(err)}`);
  }
};
