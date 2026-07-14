import * as vscode from 'vscode';
import type { MessageContext } from '../types/message-context.types';
import type { MessageHandler } from '../types/message-handler.types';
import * as path from 'path';
import { AssetPathResolver } from '../strategies/asset-path-resolver';

export const CreateAssetHandler = function (this: MessageHandler): void {};

CreateAssetHandler.prototype.handle = async function (
  this: MessageHandler,
  payload: unknown,
  _context: MessageContext,
): Promise<void> {
  const { type, id, transactionId, scaffoldedData } = payload as { type: string; id?: string; transactionId?: string; scaffoldedData?: any };

  if (!type || !_context.workspaceRoot) {
    if (transactionId && _context.reply) {
      _context.reply({ type: 'codernic:command-error', payload: { transactionId, error: 'Missing type or workspaceRoot' } });
    }
    return;
  }
  const workspaceRoot = _context.workspaceRoot;

  let fileName = id;
  if (!fileName) {
    fileName = await vscode.window.showInputBox({
      prompt: `Enter a name for the new ${type} (without .json)`,
      placeHolder: `my_new_${type}`,
    });
  }

  if (!fileName) {
    if (transactionId && _context.reply) {
      _context.reply({ type: 'codernic:command-error', payload: { transactionId, error: 'User cancelled asset creation' } });
    }
    return; // User cancelled
  }

  let fullPath = '';
  try {
    const strategy = AssetPathResolver.getStrategy(type);
    fullPath = await strategy.resolveWritePath(workspaceRoot, fileName);

    if (strategy.isDirectory()) {
      await vscode.workspace.fs.createDirectory(vscode.Uri.file(path.dirname(fullPath)));
    }
  } catch (err: unknown) {
    vscode.window.showErrorMessage((err instanceof Error ? err.message : String(err)));
    if (transactionId && _context.reply) {
      _context.reply({ type: 'codernic:command-error', payload: { transactionId, error: (err instanceof Error ? err.message : String(err)) } });
    }
    return;
  }

  try {
    const uri = vscode.Uri.file(fullPath);
    let content: Uint8Array;
    if (type === 'rule' || type === 'prompt') {
      const xmlContent = typeof scaffoldedData === 'string' ? scaffoldedData : `<instruction>\n  <!-- Your ${type} here -->\n</instruction>`;
      content = new Uint8Array(Buffer.from(xmlContent));
    } else {
      const newObj = scaffoldedData && Object.keys(scaffoldedData).length > 0 ? scaffoldedData : {};
      if (!newObj.name && type !== 'config/llms' && type !== 'config/llms/routes') {
        newObj.name = fileName;
      }
      content = new Uint8Array(Buffer.from(JSON.stringify(newObj, null, 2)));
    }
    
    await vscode.workspace.fs.writeFile(uri, content);
    
    // Open it
    const doc = await vscode.workspace.openTextDocument(uri);
    await vscode.window.showTextDocument(doc);
    if (transactionId && _context.reply) {
      _context.reply({ type: 'codernic:asset-created', payload: { transactionId, type, fileName } });
    }
  } catch (err) {
    vscode.window.showErrorMessage(`Failed to create asset: ${err instanceof Error ? (err instanceof Error ? err.message : String(err)) : String(err)}`);
    if (transactionId && _context.reply) {
      _context.reply({ type: 'codernic:command-error', payload: { transactionId, error: err instanceof Error ? (err instanceof Error ? err.message : String(err)) : String(err) } });
    }
  }
};
