import * as path from 'path';
import { AssetPathStrategy } from './asset-path.strategy';
import { ConfigPaths } from '../../../../shared/utils/config-paths';

export class TechnologyPathStrategy implements AssetPathStrategy {
  async resolveWritePath(workspaceRoot: string, id: string): Promise<string> {
    const writePath = ConfigPaths.getPrimaryWritePath(workspaceRoot);
    return path.join(writePath, 'technologies', id, `${id}.tech.json`);
  }

  async resolveReadPath(workspaceRoot: string, id: string): Promise<string | null> {
    const relPath = path.join('technologies', id, `${id}.tech.json`);
    return ConfigPaths.resolveFile(workspaceRoot, relPath);
  }

  isDirectory(): boolean {
    return true; // Techs have their own dir which we delete recursively
  }
}
