import * as fs from 'fs/promises';
import { existsSync } from 'fs';
import * as path from 'path';
import type { CustomLlmModel, LlmProvider } from './custom-llm.types';
import { ConfigPaths } from '../../../shared/utils/config-paths';

export interface ProviderConfigFile extends LlmProvider {
  models: Omit<CustomLlmModel, 'providerId' | 'isCustom'>[];
}

export const LlmConfigRepository = {
  getGlobalDir(): string {
    const engineConfig = ConfigPaths.getEngineConfig();
    return engineConfig.systemPaths.system_providers_dir;
  },

  getWorkspaceDir(workspaceRoot: string): string {
    const engineConfig = ConfigPaths.getEngineConfig();
    return ConfigPaths.expandWorkspace(engineConfig.projectPaths.custom_config_providers, workspaceRoot);
  },

  async ensureDir(workspaceRoot: string): Promise<void> {
    const globalDir = this.getGlobalDir();
    const workspaceDir = this.getWorkspaceDir(workspaceRoot);
    await fs.mkdir(globalDir, { recursive: true }).catch(() => {});
    await fs.mkdir(workspaceDir, { recursive: true }).catch(() => {});
  },

  async loadAllProviders(workspaceRoot?: string): Promise<ProviderConfigFile[]> {
    const dirs = [this.getGlobalDir()];
    if (workspaceRoot) {
      dirs.push(this.getWorkspaceDir(workspaceRoot));
    }
    const providersMap = new Map<string, ProviderConfigFile>();
    
    for (const dir of dirs) {
      try {
        const files = await fs.readdir(dir);
        const providerFiles = files.filter((f) => f.endsWith('.provider.json'));
        for (const file of providerFiles) {
          try {
            const content = await fs.readFile(path.join(dir, file), 'utf-8');
            const parsed = JSON.parse(content);
            if (parsed && typeof parsed === 'object') {
              const prefix = file.replace('.provider.json', '');
              const id = typeof parsed.id === 'string' && parsed.id ? parsed.id : prefix;
              const name = typeof parsed.name === 'string' && parsed.name ? parsed.name : prefix;
              let models = Array.isArray(parsed.models) ? parsed.models : [];
              if (models.length === 0) {
                // Fallback to nested provider objects (e.g., local-managed-llama)
                for (const key of Object.keys(parsed)) {
                  if (typeof parsed[key] === 'object' && parsed[key] !== null) {
                    const nestedModels = parsed[key].models;
                    if (Array.isArray(nestedModels) && nestedModels.length > 0) {
                      models = nestedModels;
                      break;
                    }
                  }
                }
              }
              
              // Normalize legacy string arrays to objects
              models = models.map((m: any) => {
                const modelObj = typeof m === 'string' ? { id: m, name: m } : m;
                if (modelObj.modelPath && !existsSync(modelObj.modelPath)) {
                  modelObj.isMissing = true;
                }
                return modelObj;
              });

              providersMap.set(id, {
                ...parsed,
                id,
                name,
                models,
              } as ProviderConfigFile);
              await fs.appendFile('/tmp/llm-debug.log', `Loaded provider: ${id} from ${file} in ${dir}\\n`);
            }
          } catch (e) {
            // Log error to tmp file for debugging
            await fs.appendFile('/tmp/llm-debug.log', `Error parsing ${file} in ${dir}: ${e}\\n`);
          }
        }
      } catch {
        // Skip
      }
    }
    return Array.from(providersMap.values());
  },


  async saveProvider(
    workspaceRoot: string,
    provider: ProviderConfigFile,
    originalId?: string,
  ): Promise<void> {
    await this.ensureDir(workspaceRoot);
    const dir = this.getWorkspaceDir(workspaceRoot);
    const newSlug = provider.id.replace(/[^a-z0-9]+/gi, '-').toLowerCase();
    const newFilePath = path.join(dir, `${newSlug}.provider.json`);

    // When editing an existing provider, remove any file that was previously
    // storing the originalId to prevent ghost duplicates in the provider list.
    if (originalId) {
      try {
        const files = await fs.readdir(dir);
        for (const file of files) {
          if (!file.endsWith('.provider.json')) continue;
          const filePath = path.join(dir, file);
          // Skip the target file we're about to write
          if (filePath === newFilePath) continue;
          try {
            const content = await fs.readFile(filePath, 'utf-8');
            const data = JSON.parse(content);
            if (data?.id === originalId) {
              await fs.unlink(filePath);
            }
          } catch {
            // Skip unreadable files
          }
        }
      } catch {
        // Directory scan failed, continue with write
      }
    }

    await fs.writeFile(newFilePath, JSON.stringify(provider, null, 2) + '\n', 'utf-8');
  },

  async deleteProvider(workspaceRoot: string, providerId: string): Promise<void> {
    const dirs = [this.getGlobalDir(), this.getWorkspaceDir(workspaceRoot)];
    for (const dir of dirs) {
      try {
        const files = await fs.readdir(dir);
        for (const file of files) {
          if (file.endsWith('.provider.json')) {
            const content = await fs.readFile(path.join(dir, file), 'utf-8');
            const data = JSON.parse(content);
            if (data.id === providerId) {
              await fs.unlink(path.join(dir, file));
            }
          }
        }
      } catch {
        // Ignore
      }
    }
  },
};
