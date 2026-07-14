import type { MessageContext } from '../types/message-context.types';
import type { MessageHandler } from '../types/message-handler.types';
import { ConfigPaths } from '../../../../shared/utils/config-paths';
import * as path from 'path';
import * as fs from 'fs/promises';

export const GetLocalModelsHandler = function (this: MessageHandler): void {};

GetLocalModelsHandler.prototype.handle = async function (
  this: MessageHandler,
  payload: unknown,
  _context: MessageContext,
): Promise<void> {
  const engineConfig = ConfigPaths.getEngineConfig();
  const modelsDir = engineConfig.systemPaths.system_models_download_dir;
  const localModels: { name: string; sizeBytes: number }[] = [];

  try {
    const entries = await fs.readdir(modelsDir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isDirectory()) {
        const modelPath = path.join(modelsDir, entry.name);
        try {
          const files = await fs.readdir(modelPath);
          let totalSize = 0;
          for (const file of files) {
            if (file.endsWith('.gguf') || file.endsWith('.mlx')) {
              const stat = await fs.stat(path.join(modelPath, file));
              totalSize += stat.size;
            }
          }
          if (totalSize > 0) {
            localModels.push({ name: entry.name, sizeBytes: totalSize });
          }
        } catch {
          // Ignore unreadable directories
        }
      }
    }
  } catch {
    // If models dir doesn't exist, we just return empty
  }

  _context.reply({ type: 'codernic:local-models', payload: { models: localModels } });
};

export const DeleteModelHandler = function (this: MessageHandler): void {};

DeleteModelHandler.prototype.handle = async function (
  this: MessageHandler,
  payload: unknown,
  _context: MessageContext,
): Promise<void> {
  const { name } = payload as { name: string };
  if (!name) return;

  const engineConfig = ConfigPaths.getEngineConfig();
  const modelDir = path.join(engineConfig.systemPaths.system_models_download_dir, name);

  try {
    // Delete the directory recursively
    await fs.rm(modelDir, { recursive: true, force: true });
    _context.channel.appendLine(`[DeleteModel] Successfully deleted local model: ${name}`);
    _context.reply({ type: 'codernic:model-deleted', payload: { name, success: true } });
  } catch (err) {
    _context.channel.appendLine(`[DeleteModel] Failed to delete local model ${name}: ${err}`);
    _context.reply({ type: 'codernic:model-deleted', payload: { name, success: false, error: String(err) } });
  }
};

export const LocalModelsDiscoveryHandler = function (this: MessageHandler): void {};

LocalModelsDiscoveryHandler.prototype.handle = async function (
  this: MessageHandler,
  payload: unknown,
  _context: MessageContext,
): Promise<void> {
  const engineConfig = ConfigPaths.getEngineConfig();
  const globalModelsDir = engineConfig.systemPaths.system_models_download_dir;
  const globalProvidersDir = engineConfig.systemPaths.system_providers_dir;
  const localProvidersDir = ConfigPaths.expandWorkspace(engineConfig.projectPaths.custom_config_providers, _context.workspaceRoot);

  const foundModels: any[] = [];
  const fsPromises = require('fs').promises;
  const fsSync = require('fs');

  // 1. Gather all physical models on disk
  const physicalModels = new Map<string, any>();
  try {
    const entries = await fsPromises.readdir(globalModelsDir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isDirectory()) {
        const modelPath = path.join(globalModelsDir, entry.name);
        try {
          const files = await fsPromises.readdir(modelPath);
          let totalSize = 0;
          let ggufFiles = [];

          for (const file of files) {
            if (file.endsWith('.gguf') || file.endsWith('.safetensors') || file.endsWith('.pt') || file.endsWith('.bin')) {
              const stat = await fsPromises.stat(path.join(modelPath, file));
              totalSize += stat.size;
              ggufFiles.push({ name: file, size: stat.size, path: path.join(modelPath, file) });
            }
          }

          if (ggufFiles.length > 0) {
            physicalModels.set(entry.name, {
              id: entry.name,
              name: entry.name,
              downloads: 0,
              likes: 0,
              isConfigured: false,
              configPath: '',
              gguf_files: ggufFiles.map(f => ({ name: f.name, size: f.size })),
              sizeBytes: totalSize,
              path: modelPath,
              isMissing: false,
              isAvailableOnHf: true,
            });
          }
        } catch (e) {
          // ignore
        }
      }
    }
  } catch (e) {
    // ignore
  }

  // 2. Gather all configured models
  const checkConfigDir = async (pDir: string) => {
    if (!fsSync.existsSync(pDir)) return;
    try {
      const pFiles = await fsPromises.readdir(pDir);
      for (const pFile of pFiles) {
        if (pFile.endsWith('.provider.json')) {
          try {
            const content = await fsPromises.readFile(path.join(pDir, pFile), 'utf8');
            const j = JSON.parse(content);
            if (j.models && Array.isArray(j.models)) {
              for (const m of j.models) {
                if (m.folderName && m.fileName) {
                  const pModel = physicalModels.get(m.folderName);
                  if (pModel) {
                    pModel.isConfigured = true;
                    pModel.configPath = path.join(pDir, pFile);
                    pModel.displayName = m.displayName || m.name || m.id;
                    pModel.fileName = m.fileName;
                  } else {
                    // It's configured but missing from disk!
                    // Check HuggingFace
                    let isAvailableOnHf = false;
                    try {
                        const hfName = m.folderName.replace('--', '/');
                        const res = await fetch(`https://huggingface.co/api/models/${hfName}`);
                        isAvailableOnHf = res.ok;
                    } catch(e) {}
                    
                    foundModels.push({
                      id: m.id,
                      name: m.folderName,
                      displayName: m.displayName || m.name || m.id,
                      downloads: 0,
                      likes: 0,
                      isConfigured: true,
                      configPath: path.join(pDir, pFile),
                      gguf_files: [{ name: m.fileName, size: 0 }],
                      sizeBytes: 0,
                      path: path.join(globalModelsDir, m.folderName),
                      isMissing: true,
                      isAvailableOnHf,
                      fileName: m.fileName,
                      folderName: m.folderName
                    });
                  }
                }
              }
            }
          } catch(e) {}
        }
      }
    } catch(e) {}
  };

  await checkConfigDir(globalProvidersDir);
  await checkConfigDir(localProvidersDir);

  // Add all physical models (the ones actually present)
  for (const pModel of physicalModels.values()) {
    foundModels.push(pModel);
  }

  _context.reply({ type: 'codernic:local-models-result', payload: { models: foundModels } });
};

export const RunModelSearchHandler = function (this: MessageHandler): void {};
RunModelSearchHandler.prototype.handle = async function (this: MessageHandler, payload: unknown, _context: MessageContext): Promise<void> { };
