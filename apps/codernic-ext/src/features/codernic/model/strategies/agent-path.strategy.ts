import * as path from 'path';
import { AssetPathStrategy } from './asset-path.strategy';
import { ConfigPaths } from '../../../../shared/utils/config-paths';

export class AgentPathStrategy implements AssetPathStrategy {
  async resolveWritePath(workspaceRoot: string, id: string): Promise<string> {
    const writePath = ConfigPaths.getPrimaryWritePath(workspaceRoot);
    return path.join(writePath, 'agents', `${id}.agent.json`);
  }

  async resolveReadPath(workspaceRoot: string, id: string): Promise<string | null> {
    const relPath = path.join('agents', `${id}.agent.json`);
    return ConfigPaths.resolveFile(workspaceRoot, relPath);
  }

  isDirectory(): boolean {
    return false;
  }
}
