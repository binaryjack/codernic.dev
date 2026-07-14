import * as vscode from 'vscode';
import type { MessageContext } from '../types/message-context.types';
import type { MessageHandler } from '../types/message-handler.types';

export const BrowseFileHandler = function (this: MessageHandler): void {};

BrowseFileHandler.prototype.handle = async function (
  this: MessageHandler,
  payload: unknown,
  context: MessageContext,
): Promise<void> {
  const { reply } = context;
  const { title, filters, key } = payload as {
    title: string;
    filters?: Record<string, string[]>;
    key?: string;
  };

  const options: vscode.OpenDialogOptions = {
    canSelectMany: false,
    openLabel: 'Select',
    title,
    filters,
  };

  const uri = await vscode.window.showOpenDialog(options);
  if (uri && uri[0]) {
    reply({
      type: 'codernic:file-selected',
      payload: { path: uri[0].fsPath, key },
    });
  }
};
