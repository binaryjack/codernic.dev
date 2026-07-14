import * as fs from 'fs';
import * as path from 'path';
import { ConfigPaths } from '../../../shared/utils/config-paths';

export interface EngineConfig {
  network?: {
    daemon_ws_port?: number;
    inference_port?: number;
    mcp_bridge_port?: number;
    ui_dev_port?: number;
  };
  paths?: {
    global_dir?: string;
    providers_dir?: string;
    system_instructions_dir?: string;
    models_download_dir?: string;
    routes_file?: string;
  };
  factory?: {
    base_url?: string;
    schemas_url?: string;
  };
}

export function readEngineConfig(workspaceRoot: string): EngineConfig | null {
  const engineJsonPath = ConfigPaths.resolveFile(workspaceRoot, 'engine.json');
  if (!engineJsonPath) {
    return null;
  }
  try {
    const content = fs.readFileSync(engineJsonPath, 'utf-8');
    return JSON.parse(content) as EngineConfig;
  } catch (e) {
    return null;
  }
}

export function getRemoteConfigBaseUrl(workspaceRoot: string): string | null {
  const config = readEngineConfig(workspaceRoot);
  return config?.factory?.base_url || null;
}

export function getRemoteSchemasUrl(workspaceRoot: string): string | null {
  const config = readEngineConfig(workspaceRoot);
  return config?.factory?.schemas_url || null;
}
