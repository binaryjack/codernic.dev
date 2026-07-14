import * as vscode from 'vscode';
import * as path from 'path';
import { promises as fs } from 'fs';
import type { MessageContext } from '../types/message-context.types';
import type { MessageHandler } from '../types/message-handler.types';

export class SaveLayoutHandler implements MessageHandler {
  async handle(payload: unknown, context: MessageContext): Promise<void> {
    const data = payload as { name: string; blocks: any };
    if (!data.name || !data.blocks) return;

    if (!vscode.workspace.workspaceFolders?.[0]) return;
    const rootPath = vscode.workspace.workspaceFolders[0].uri.fsPath;
    const layoutsDir = path.join(rootPath, '.codernic', 'config', 'layouts');

    try {
      await fs.mkdir(layoutsDir, { recursive: true });
      const filePath = path.join(layoutsDir, `${data.name}.json`);
      await fs.writeFile(filePath, JSON.stringify(data.blocks, null, 2), 'utf-8');
      
      context.reply({ type: 'codernic:layout-saved', payload: { success: true } });
    } catch (e) {
      context.reply({ type: 'codernic:layout-saved', payload: { success: false, error: String(e) } });
    }
  }
}
