import * as path from 'path';
import * as os from 'os';
import * as fs from 'fs';
import { AssetPathStrategy } from './asset-path.strategy';
import { ConfigPaths } from '../../../../shared/utils/config-paths';

export class LlmsPathStrategy implements AssetPathStrategy {
  async resolveWritePath(workspaceRoot: string, id: string): Promise<string> {
    const config = ConfigPaths.getEngineConfig();
    const providersDir = ConfigPaths.expandWorkspace(config.projectPaths.custom_config_providers, workspaceRoot);

    if (id.endsWith('.route')) {
      const cleanId = id.replace('.route', '');
      return path.join(providersDir, `${cleanId}.route.json`);
    } else if (id.endsWith('.provider')) {
      const cleanId = id.replace('.provider', '');
      return path.join(providersDir, `${cleanId}.provider.json`);
    } else {
      return path.join(providersDir, `${id}.json`);
    }
  }

  async resolveReadPath(workspaceRoot: string, id: string): Promise<string | null> {
    const config = ConfigPaths.getEngineConfig();
    
    let filename = `${id}.json`;
    if (id.endsWith('.route')) filename = `${id.replace('.route', '')}.route.json`;
    else if (id.endsWith('.provider')) filename = `${id.replace('.provider', '')}.provider.json`;

    // Priority 1: Check if workspace has local overrides
    const relPath = path.join('config', 'providers', filename);
    const resolvedPath = ConfigPaths.resolveFile(workspaceRoot, relPath);
    if (resolvedPath) return resolvedPath;

    // Priority 2: Fallback to global config
    const fallback = path.join(config.systemPaths.system_providers_dir, filename);
    if (fs.existsSync(fallback)) return fallback;

    return null;
  }

  isDirectory(): boolean {
    return false;
  }
}
