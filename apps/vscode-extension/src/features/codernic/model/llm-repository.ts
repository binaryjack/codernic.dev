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
          providers.push(JSON.parse(content) as ProviderConfigFile);
        } catch {
          // Skip invalid files
        }
      }
      return providers;
    } catch {
      return [];
    }
  },

  async saveProvider(workspaceRoot: string, provider: ProviderConfigFile): Promise<void> {
    await this.ensureDir(workspaceRoot);
    const slug = provider.id.replace(/[^a-z0-9]+/gi, '-').toLowerCase();
    const filePath = path.join(this.getDir(workspaceRoot), `${slug}.provider.json`);
    await fs.writeFile(filePath, JSON.stringify(provider, null, 2) + '\n', 'utf-8');
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
