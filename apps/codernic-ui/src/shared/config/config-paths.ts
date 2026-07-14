import * as path from 'path';
import * as os from 'os';
import * as fs from 'fs';

export interface FrontendEngineConfig {
  network: {
    daemon_ws_port: number;
    ui_dev_port: number;
  };
  systemPaths: {
    codernicapp: string;
  };
}

export class FrontendConfigManager {
  static getEngineConfig(): FrontendEngineConfig {
    const defaultCodernicApp = path.join(os.homedir() || '.', 'codernicapp');
    
    const defaults: FrontendEngineConfig = {
      network: {
        daemon_ws_port: 47321,
        ui_dev_port: 5173,
      },
      systemPaths: {
        codernicapp: defaultCodernicApp,
      },
    };

    try {
      const engineJsonPath = path.join(defaultCodernicApp, 'engine.json');
      if (fs.existsSync(engineJsonPath)) {
        const content = fs.readFileSync(engineJsonPath, 'utf8');
        const json = JSON.parse(content);
        if (json.network) {
          defaults.network = { ...defaults.network, ...json.network };
        }
        if (json.systemPaths) {
          defaults.systemPaths = { ...defaults.systemPaths, ...json.systemPaths };
        }
      }
    } catch (e) {
      // Default fallback applies
    }
    
    return defaults;
  }
}
