import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { PhaseActivator, BootstrapContext } from './types';
import { resolvePlatformBinaries } from '../utils/binaries';
import { ConfigPaths } from '../shared/utils/config-paths';
import { scaffoldAgenceeConfig, checkWorkspacePackages } from '../shared/workspace-setup';

export class ConfigPhase implements PhaseActivator {
  name = 'Configuration Phase';

  async activate(ctx: BootstrapContext): Promise<void> {
    try {
      resolvePlatformBinaries(ctx.vscodeContext.extensionPath);
      ctx.channel.appendLine(`[INIT] Zero-Compile Binaries resolved for architecture.`);
      
      const config = vscode.workspace.getConfiguration();
      if (config.get('ai-agencee.mcpPath')) {
        await config.update('ai-agencee.mcpPath', undefined, vscode.ConfigurationTarget.Global);
      }

      const licenseKey = vscode.workspace.getConfiguration('ai-agencee').get<string>('licenseKey');
      if (licenseKey) {
        const codernicDir = ConfigPaths.getGlobalInstallationPath();
        if (!fs.existsSync(codernicDir)) {
          fs.mkdirSync(codernicDir, { recursive: true });
        }
        fs.writeFileSync(path.join(codernicDir, 'license.key'), licenseKey.trim(), 'utf8');
      }
    } catch (err) {
      ctx.channel.appendLine(`[WARN] Zero-Compile fallback: ${err instanceof Error ? (err instanceof Error ? err.message : String(err)) : String(err)}`);
    }

    if (ctx.workspaceRoot) {
      ctx.channel.appendLine(`[INIT] Workspace: ${ctx.workspaceRoot}`);
      await scaffoldAgenceeConfig(ctx.workspaceRoot, ctx.vscodeContext.extensionPath, ctx.channel);
      await checkWorkspacePackages(
        ctx.workspaceRoot,
        ctx.vscodeContext.extensionPath,
        ctx.channel,
        ctx.vscodeContext.workspaceState,
      );
    } else {
      ctx.channel.appendLine('[INIT] No workspace folder open');
    }
  }
}
