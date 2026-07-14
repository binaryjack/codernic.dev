import * as vscode from 'vscode';
import * as path from 'path';
import { promises as fs } from 'fs';
import type { MessageContext } from '../types/message-context.types';
import type { MessageHandler } from '../types/message-handler.types';

export class LoadLayoutsHandler implements MessageHandler {
  async handle(payload: unknown, context: MessageContext): Promise<void> {
    const layouts: Record<string, any> = {};

    if (!vscode.workspace.workspaceFolders?.[0]) {
       context.reply({ type: 'codernic:layouts-loaded', payload: { layouts } });
       return;
    }
    
    const rootPath = vscode.workspace.workspaceFolders[0].uri.fsPath;
    const layoutsDir = path.join(rootPath, '.codernic', 'config', 'layouts');

    try {
      const files = await fs.readdir(layoutsDir);
      for (const file of files) {
        if (file.endsWith('.json')) {
          const name = file.replace('.json', '');
          const content = await fs.readFile(path.join(layoutsDir, file), 'utf-8');
          try {
            layouts[name] = JSON.parse(content);
          } catch (e) {}
        }
      }
    } catch (e) {
      // Directory might not exist, that's fine
    }

    context.reply({ type: 'codernic:layouts-loaded', payload: { layouts } });
  }
}
