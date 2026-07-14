import * as vscode from 'vscode';
import type { MessageContext } from '../types/message-context.types';
import type { MessageHandler } from '../types/message-handler.types';
import * as path from 'path';
import * as os from 'os';
import { ConfigPaths } from '../../../../shared/utils/config-paths';
import { AssetPathResolver } from '../strategies/asset-path-resolver';

export const GetAssetHandler = function (this: MessageHandler): void {};

GetAssetHandler.prototype.handle = async function (
  this: MessageHandler,
  payload: unknown,
  _context: MessageContext,
): Promise<void> {
  const { assetType, id, isMetadata } = payload as { assetType?: string, type?: string, id: string, isMetadata?: boolean };
  const actualType = assetType || (payload as Record<string, unknown>).type;

  _context.channel.appendLine(`[GetAsset] Requested actualType=${actualType}, id=${id}`);

  if (!actualType || !id || !_context.workspaceRoot) return;

  let fullPath = '';
  if (actualType === 'config/llms' && (id === 'providers' || id === 'providers.json')) {
    // Special case: aggregate all providers dynamically
    try {
      // Global engine directory
      const engineConfig = ConfigPaths.getEngineConfig();
      const globalProviders = engineConfig.systemPaths.system_providers_dir;

      const llmsDirs = [globalProviders];
      const allProviders: any[] = [];
      const allModels: any[] = [];

      for (const llmsDir of llmsDirs) {
        try {
          const files = await vscode.workspace.fs.readDirectory(vscode.Uri.file(llmsDir));
          for (const [file, fileType] of files) {
            if (fileType === vscode.FileType.File && file.endsWith('.provider.json')) {
              try {
                const data = await vscode.workspace.fs.readFile(vscode.Uri.file(path.join(llmsDir, file)));
                const parsed = JSON.parse(new TextDecoder().decode(data));
                const provId = file.replace('.provider.json', '');
                allProviders.push({
                  id: provId,
                  name: parsed.name || provId,
                  type: parsed.type || 'unknown'
                });
                if (Array.isArray(parsed.models)) {
                  for (const m of parsed.models) {
                    const engineConfig = ConfigPaths.getEngineConfig();
                    const modelsDir = engineConfig.systemPaths.system_models_download_dir;
                    let absPath = '';
                    if (m.folderName && m.fileName) {
                      absPath = path.join(modelsDir, m.folderName, m.fileName);
                    } else if (m.modelPath) {
                      absPath = m.modelPath;
                    }
                    const isMissing = absPath ? !require('fs').existsSync(absPath) : false;
                    allModels.push({ ...m, providerId: provId, isMissing });
                  }
                } else if (parsed[parsed.type]?.models) {
                  for (const m of parsed[parsed.type].models) {
                    const engineConfig = ConfigPaths.getEngineConfig();
                    const modelsDir = engineConfig.systemPaths.system_models_download_dir;
                    let absPath = '';
                    if (m.folderName && m.fileName) {
                      absPath = path.join(modelsDir, m.folderName, m.fileName);
                    } else if (m.modelPath) {
                      absPath = m.modelPath;
                    }
                    const isMissing = absPath ? !require('fs').existsSync(absPath) : false;
                    allModels.push({ ...m, providerId: provId, isMissing });
                  }
                }
              } catch (e) {
                _context.channel.appendLine(`[GetAsset] Error reading provider ${file}: ${e}`);
              }
            }
          }
        } catch (e) {
          // ignore missing directory
        }
      }

      const aggregated = {
        providers: allProviders,
        models: allModels
      };

      const content = JSON.stringify(aggregated, null, 2);
      if (_context.reply) {
        _context.reply({ type: 'codernic:asset-content', payload: { id: 'providers.json', content, assetType: actualType, isMetadata } });
      }
      return;
    } catch (err) {
      _context.channel.appendLine(`[GetAsset] Error aggregating providers: ${err}`);
      if (_context.reply) {
        _context.reply({ type: 'codernic:chat-error', payload: { text: `Failed to aggregate providers: ${err instanceof Error ? (err instanceof Error ? err.message : String(err)) : String(err)}` } });
      }
      return;
    }
  } else {
    try {
      const strategy = AssetPathResolver.getStrategy(actualType as string);
      const resolvedPath = await strategy.resolveReadPath(_context.workspaceRoot, id);
      
      // Fallback for system-instructions which don't have a strategy yet
      let finalResolvedPath = resolvedPath;
      if (!finalResolvedPath && (actualType === 'config/codernic/rules' || actualType === 'config/codernic/prompts')) {
        const engineConfig = ConfigPaths.getEngineConfig();
        const fallback = path.join(engineConfig.systemPaths.system_instructions_dir, `${id}.xml`);
        if (require('fs').existsSync(fallback)) finalResolvedPath = fallback;
        const jsonFallback = path.join(engineConfig.systemPaths.system_instructions_dir, `${id}.json`);
        if (require('fs').existsSync(jsonFallback)) finalResolvedPath = jsonFallback;
      }

      if (!finalResolvedPath) {
        _context.channel.appendLine(`[GetAsset] Error: File not found for ${actualType} ${id}`);
        if (_context.reply) {
          _context.reply({ type: 'codernic:chat-error', payload: { text: `Asset not found: ${id}` } });
        }
        return;
      }
      fullPath = finalResolvedPath;
    } catch (err: unknown) {
      _context.channel.appendLine(`[GetAsset] Strategy Error: ${(err instanceof Error ? err.message : String(err))}`);
      if (_context.reply) {
        _context.reply({ type: 'codernic:chat-error', payload: { text: `Asset strategy error: ${(err instanceof Error ? err.message : String(err))}` } });
      }
      return;
    }
  }

  try {
    const uri = vscode.Uri.file(fullPath);
    _context.channel.appendLine(`[GetAsset] Reading file: ${fullPath}`);
    const data = await vscode.workspace.fs.readFile(uri);
    const content = new TextDecoder().decode(data);
    _context.channel.appendLine(`[GetAsset] Sending content of length: ${content.length}`);
    if (_context.reply) {
      _context.reply({ type: 'codernic:asset-content', payload: { id, content, assetType: actualType, isMetadata } });
    }
  } catch (err) {
    _context.channel.appendLine(`[GetAsset] Error: ${err}`);
    if (_context.reply) {
      _context.reply({ type: 'codernic:chat-error', payload: { text: `Asset not found: ${err instanceof Error ? (err instanceof Error ? err.message : String(err)) : String(err)}` } });
    }
  }
};
