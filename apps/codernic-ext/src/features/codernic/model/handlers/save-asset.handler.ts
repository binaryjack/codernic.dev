import * as vscode from 'vscode';
import type { MessageContext } from '../types/message-context.types';
import type { MessageHandler } from '../types/message-handler.types';
import * as path from 'path';
import * as os from 'os';
import * as net from 'net';
import { AssetPathResolver } from '../strategies/asset-path-resolver';

export const SaveAssetHandler = function (this: MessageHandler): void {};

SaveAssetHandler.prototype.handle = async function (
  this: MessageHandler,
  payload: unknown,
  _context: MessageContext,
): Promise<void> {
  const { assetType, id, content } = payload as { assetType?: string, type?: string, id: string, content: string };
  const actualType = assetType || (payload as Record<string, unknown>).type;
  
  if (!actualType || !id || !_context.workspaceRoot) {
    if ((payload as Record<string, unknown>).transactionId && _context.reply) {
      _context.reply({ type: 'codernic:command-error', payload: { transactionId: (payload as Record<string, unknown>).transactionId, error: 'Missing type, id, or workspaceRoot' } });
    }
    return;
  }
  const workspaceRoot = _context.workspaceRoot;

  let fullPath = '';
  let dirPath = '';
  
  try {
    const strategy = AssetPathResolver.getStrategy(actualType as string);
    fullPath = await strategy.resolveWritePath(workspaceRoot, id);
    dirPath = path.dirname(fullPath);
  } catch (err: unknown) {
    vscode.window.showErrorMessage((err instanceof Error ? err.message : String(err)));
    if ((payload as Record<string, unknown>).transactionId && _context.reply) {
      _context.reply({ type: 'codernic:command-error', payload: { error: (err instanceof Error ? err.message : String(err)), transactionId: (payload as Record<string, unknown>).transactionId } });
    }
    return;
  }

  let finalContent = content;

  if (actualType === 'config/llms' || actualType === 'llms') {
    try {
      const parsed = JSON.parse(content);
      const rawKey = parsed.api_key || parsed.apiKey;
      
      if (rawKey && typeof rawKey === 'string' && !rawKey.startsWith('vault://') && rawKey.trim() !== '') {
        const vaultKey = `llm.provider.${id}.api_key`;
        
        await new Promise<void>((resolve, reject) => {
          const ipcPath = os.platform() === 'win32' ? '\\\\.\\pipe\\codernic_pipe' : '/tmp/codernic.sock';
          const socket = net.createConnection(ipcPath);
          
          socket.on('error', (err: any) => reject(new Error(`Daemon IPC error: ${(err instanceof Error ? err.message : String(err))}`)));
          
          socket.on('data', (d: Buffer) => {
            const rawRes = d.toString();
            try {
              for (const line of rawRes.trim().split('\n')) {
                if (!line) continue;
                const res = JSON.parse(line);
                if (res === 'Done' || (res && res.Done)) {
                  resolve();
                  socket.end();
                } else if (res && res.Error) {
                  reject(new Error(`Vault error: ${res.Error}`));
                  socket.end();
                }
              }
            } catch (e) {
              reject(e);
            }
          });
          
          socket.on('connect', () => {
            const req = { StoreSecret: { key: vaultKey, secret: rawKey } };
            socket.write(JSON.stringify(req) + '\n');
          });
        });
        
        if (parsed.api_key !== undefined) parsed.api_key = `vault://${vaultKey}`;
        if (parsed.apiKey !== undefined) parsed.apiKey = `vault://${vaultKey}`;
        finalContent = JSON.stringify(parsed, null, 2);
      }
    } catch (e) {
      console.error('[BYOK] Error intercepting LLM secret:', e);
    }
  }

  try {
    await vscode.workspace.fs.createDirectory(vscode.Uri.file(dirPath));
    const uri = vscode.Uri.file(fullPath);
    await vscode.workspace.fs.writeFile(uri, new TextEncoder().encode(finalContent));

    if (actualType === 'technology') {
      try {
        const parsedTech = JSON.parse(finalContent);
        if (parsedTech.DEPENDENCIES && Array.isArray(parsedTech.DEPENDENCIES)) {
          const rulesPath = path.join(dirPath, 'rules');
          await vscode.workspace.fs.createDirectory(vscode.Uri.file(rulesPath));
          
          let existingRules = new Set<string>();
          try {
            const entries = await vscode.workspace.fs.readDirectory(vscode.Uri.file(rulesPath));
            for (const [name, fileType] of entries) {
              if (fileType === vscode.FileType.Directory) existingRules.add(name);
            }
          } catch (e) {}
          
          const currentRules = new Set<string>();
          for (const dep of parsedTech.DEPENDENCIES) {
            if (dep.name) {
              currentRules.add(dep.name);
              const depRulePath = path.join(rulesPath, dep.name);
              await vscode.workspace.fs.createDirectory(vscode.Uri.file(depRulePath));
              
              const filesToCreate = ['do.xml', 'doNot.xml', 'rationale.md'];
              for (const f of filesToCreate) {
                const filePath = vscode.Uri.file(path.join(depRulePath, f));
                try {
                  await vscode.workspace.fs.stat(filePath);
                } catch {
                  await vscode.workspace.fs.writeFile(filePath, new Uint8Array(Buffer.from('')));
                }
              }
            }
          }
          
          for (const rule of existingRules) {
            if (!currentRules.has(rule)) {
              await vscode.workspace.fs.delete(vscode.Uri.file(path.join(rulesPath, rule)), { recursive: true, useTrash: true });
            }
          }
        }
      } catch (err) {
        console.error('Failed to sync rules', err);
      }
    }

    vscode.window.showInformationMessage(`Successfully saved ${actualType}: ${id}`);
    _context.reply({ type: 'codernic:asset-saved', payload: { id, transactionId: (payload as Record<string, unknown>).transactionId } });
  } catch (err) {
    _context.reply({ type: 'codernic:command-error', payload: { error: `Failed to save asset: ${err instanceof Error ? (err instanceof Error ? err.message : String(err)) : String(err)}`, transactionId: (payload as Record<string, unknown>).transactionId } });
  }
};
