import * as path from 'path';
import { AssetPathStrategy } from './asset-path.strategy';
import { ConfigPaths } from '../../../../shared/utils/config-paths';

export class PromptPathStrategy implements AssetPathStrategy {
  async resolveWritePath(workspaceRoot: string, id: string): Promise<string> {
    const writePath = path.join(workspaceRoot, '.codernic', 'config', 'codernic');
    return path.join(writePath, 'prompts', `${id.replace(/^prompt-/, '')}.xml`);
  }

  async resolveReadPath(workspaceRoot: string, id: string): Promise<string | null> {
    const relPath = path.join('config', 'codernic', 'prompts', `${id.replace(/^prompt-/, '')}.xml`);
    return ConfigPaths.resolveFile(workspaceRoot, relPath);
  }

  isDirectory(): boolean {
    return false;
  }
}
