import * as fs from 'fs/promises';
import * as path from 'path';
import type { CustomLlmModel, LlmProvider } from './custom-llm.types';

export interface ProviderConfigFile extends LlmProvider {
  models: Omit<CustomLlmModel, 'providerId' | 'isCustom'>[];
}

export const LlmConfigRepository = {
  getDir(workspaceRoot: string): string {
    return path.join(workspaceRoot, '.agencee', 'config', 'llms');
  },

  async ensureDir(workspaceRoot: string): Promise<void> {
    const dir = this.getDir(workspaceRoot);
    await fs.mkdir(dir, { recursive: true });
  },

  async loadAllProviders(workspaceRoot: string): Promise<ProviderConfigFile[]> {
    const dir = this.getDir(workspaceRoot);
    try {
      const files = await fs.readdir(dir);
      const providerFiles = files.filter((f) => f.endsWith('.provider.json'));
      const providers: ProviderConfigFile[] = [];
      for (const file of providerFiles) {
        try {
          const content = await fs.readFile(path.join(dir, file), 'utf-8');
          const parsed = JSON.parse(content);
          if (parsed && typeof parsed === 'object') {
            const prefix = file.replace('.provider.json', '');
            const id = typeof parsed.id === 'string' && parsed.id ? parsed.id : prefix;
            const name = typeof parsed.name === 'string' && parsed.name ? parsed.name : prefix;
            const models = Array.isArray(parsed.models) ? parsed.models : [];
            providers.push({
              ...parsed,
              id,
              name,
              models,
            } as ProviderConfigFile);
          }
        } catch {
          // Skip invalid files
        }
      }
      return providers;
    } catch {
      return [];
    }
  },


  async saveProvider(
    workspaceRoot: string,
    provider: ProviderConfigFile,
    originalId?: string,
  ): Promise<void> {
    await this.ensureDir(workspaceRoot);
    const dir = this.getDir(workspaceRoot);
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
    const dir = this.getDir(workspaceRoot);
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
  },
};
