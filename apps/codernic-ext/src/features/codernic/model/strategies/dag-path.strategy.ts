import * as path from 'path';
import { AssetPathStrategy } from './asset-path.strategy';
import { ConfigPaths } from '../../../../shared/utils/config-paths';

export class DagPathStrategy implements AssetPathStrategy {
  async resolveWritePath(workspaceRoot: string, id: string): Promise<string> {
    const writePath = ConfigPaths.getPrimaryWritePath(workspaceRoot);
    return path.join(writePath, 'dags', `${id}.dag.json`);
  }

  async resolveReadPath(workspaceRoot: string, id: string): Promise<string | null> {
    const relPath = path.join('dags', `${id}.dag.json`);
    return ConfigPaths.resolveFile(workspaceRoot, relPath);
  }

  isDirectory(): boolean {
    return false;
  }
}
