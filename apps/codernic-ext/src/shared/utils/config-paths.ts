import * as path from 'path';
import * as os from 'os';
import * as fs from 'fs';

export interface EnginePathsConfig {
  systemPaths: {
    codernicapp: string;
    system_providers_dir: string;
    system_instructions_dir: string;
    system_models_download_dir: string;
    system_routes_file: string;
    system_agents: string;
    system_schemas: string;
    system_logs: string;
    system_layouts: string;
  };
  projectPaths: {
    global_dir: string;
    custom_config_base_path: string;
    custom_config_providers: string;
    custom_config_routes_file: string;
    agents: string;
    dags: string;
    technologies: string;
    system_session: string;
    system_artifacts: string;
    system_ragtime: string;
  };
  network: {
    daemon_ws_port: number;
    inference_port: number;
    mcp_bridge_port: number;
    ui_dev_port: number;
    atomos_mcp_port: number;
  };
}

export class ConfigPaths {
  static getEngineConfig(): EnginePathsConfig {
    const defaultCodernicApp = path.join(os.homedir() || '.', 'codernicapp');
    const defaultCodernicGlobal = '~/.codernic';
    const defaults: EnginePathsConfig = {
      systemPaths: {
        codernicapp: defaultCodernicApp,
        system_providers_dir: path.join(defaultCodernicApp, 'providers'),
        system_instructions_dir: path.join(defaultCodernicApp, 'system-instructions'),
        system_models_download_dir: path.join(defaultCodernicApp, 'models'),
        system_routes_file: path.join(defaultCodernicApp, 'providers', 'routes.json'),
        system_agents: path.join(defaultCodernicApp, 'agents'),
        system_schemas: path.join(defaultCodernicApp, 'schemas'),
        system_logs: path.join(defaultCodernicApp, 'logs'),
        system_layouts: path.join(defaultCodernicApp, 'layouts'),
      },
      projectPaths: {
        global_dir: defaultCodernicGlobal,
        custom_config_base_path: `${defaultCodernicGlobal}/config`,
        custom_config_providers: `${defaultCodernicGlobal}/config/providers`,
        custom_config_routes_file: `${defaultCodernicGlobal}/config/providers/routes.json`,
        agents: `${defaultCodernicGlobal}/agents`,
        dags: `${defaultCodernicGlobal}/dags`,
        technologies: `${defaultCodernicGlobal}/technologies`,
        system_session: `${defaultCodernicGlobal}/sessions`,
        system_artifacts: `${defaultCodernicGlobal}/artifacts`,
        system_ragtime: `${defaultCodernicGlobal}/ragtime.db`,
      },
      network: {
        daemon_ws_port: 47321,
        inference_port: 8000,
        mcp_bridge_port: 47322,
        ui_dev_port: 5173,
        atomos_mcp_port: 9743
      }
    };

    try {
      const engineJsonPath = path.join(defaultCodernicApp, 'engine.json');
      if (fs.existsSync(engineJsonPath)) {
        const content = fs.readFileSync(engineJsonPath, 'utf8');
        const json = JSON.parse(content);
        if (json.systemPaths) {
          defaults.systemPaths = { ...defaults.systemPaths, ...json.systemPaths };
        }
        if (json.projectPaths) {
          defaults.projectPaths = { ...defaults.projectPaths, ...json.projectPaths };
        }
        if (json.network) {
          defaults.network = { ...defaults.network, ...json.network };
        }
      }
    } catch (e) {
      // Default fallback applies
    }
    return defaults;
  }

  static expandWorkspace(p: string, workspaceRoot: string): string {
    if (p.startsWith('~/')) {
      return path.join(workspaceRoot, p.substring(2));
    }
    return p;
  }

  static getCascadePaths(workspaceRoot: string): string[] {
    const config = this.getEngineConfig();
    const globalPath = config.systemPaths.codernicapp;
    const workspacePath = this.expandWorkspace(config.projectPaths.global_dir, workspaceRoot);
    return [workspacePath, globalPath];
  }

  static resolveFile(workspaceRoot: string, subPath: string): string | null {
    const paths = this.getCascadePaths(workspaceRoot);
    for (const p of paths) {
      const fullPath = path.join(p, subPath);
      if (fs.existsSync(fullPath)) {
        return fullPath;
      }
    }
    return null;
  }

  static resolveDirectories(workspaceRoot: string, subPath: string): string[] {
    const paths = this.getCascadePaths(workspaceRoot);
    const existing: string[] = [];
    for (const p of paths) {
      const fullPath = path.join(p, subPath);
      if (fs.existsSync(fullPath)) {
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
          existing.push(fullPath);
        }
      }
    }
    return existing;
  }

  static getPrimaryWritePath(workspaceRoot: string): string {
    const config = this.getEngineConfig();
    return this.expandWorkspace(config.projectPaths.global_dir, workspaceRoot);
  }

  static getGlobalInstallationPath(): string {
    const config = this.getEngineConfig();
    return config.systemPaths.codernicapp;
  }
}
