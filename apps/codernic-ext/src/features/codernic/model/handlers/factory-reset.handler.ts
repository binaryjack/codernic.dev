import * as fs from 'fs/promises';
import * as path from 'path';
import * as vscode from 'vscode';
import type { MessageContext } from '../types/message-context.types';
import type { MessageHandler } from '../types/message-handler.types';
import { ConfigPaths } from '../../../../shared/utils/config-paths';
import { getRemoteConfigBaseUrl } from '../engine-config';

export class FactoryResetHandler implements MessageHandler {
  async handle(_payload: unknown, context: MessageContext): Promise<void> {
    const { channel, workspaceRoot } = context;

    try {
      const globalPath = ConfigPaths.getGlobalInstallationPath();
      
      const remoteConfigUrl = getRemoteConfigBaseUrl(workspaceRoot);
      if (!remoteConfigUrl) {
        const errorMsg = "⚠️ Configuration error: 'factory.base_url' is missing in engine.json. Please download the latest configuration from https://github.com/binaryjack/codernic.dev and add it to your engine.json file.";
        channel.appendLine(`[FactoryReset] ${errorMsg}`);
        vscode.window.showErrorMessage(errorMsg);
        return;
      }
      
      // Get extension version
      const ext = vscode.extensions.getExtension('binaryjack.codernic');
      const version = ext?.packageJSON?.version || '0.6.402';
      // Convert 0.6.402 to v-0-6-402 for URL format
      const versionDir = `v-${version.replace(/\./g, '-')}`;

      channel.appendLine(`[FactoryReset] Starting factory reset for Codernic version ${version} (${versionDir})`);

      // 1. Create backup of current ~/.codernic folder
      const backupPath = `${globalPath}_backup_${Date.now()}`;
      try {
        await fs.cp(globalPath, backupPath, { recursive: true });
        channel.appendLine(`[FactoryReset] Created backup at ${backupPath}`);
        vscode.window.showInformationMessage(`Codernic config backed up to ${backupPath}`);
      } catch (e: unknown) {
        if (((e as any).code) !== 'ENOENT') {
          channel.appendLine(`[FactoryReset] Backup failed: ${(e instanceof Error ? e.message : String(e))}`);
          vscode.window.showErrorMessage(`Backup failed: ${(e instanceof Error ? e.message : String(e))}`);
          return;
        }
        // If it doesn't exist yet, that's fine
      }

      // 2. We'll download files from codernic.dev repo. 
      // For now, since we know we fallback to latest if the specific version doesn't exist, we will try the version first.
      const baseUrl = `${remoteConfigUrl}/${versionDir}`;
      const latestUrl = `${remoteConfigUrl}/latest`;

      const filesToDownload = [
        { name: 'routes.json', dest: '.' },
        { name: 'schemas/agents.form.schema.json', dest: 'schemas' },
        { name: 'schemas/dags.form.schema.json', dest: 'schemas' },
        { name: 'schemas/techs.form.schema.json', dest: 'schemas' },
        { name: 'schemas/providers.form.schema.json', dest: 'schemas' },
        { name: 'schemas/routes.form.schema.json', dest: 'schemas' },
        { name: 'providers/anthropic.provider.json', dest: 'providers' },
        { name: 'providers/gguf-local.provider.json', dest: 'providers' },
        { name: 'providers/google.provider.json', dest: 'providers' },
        { name: 'providers/openai.provider.json', dest: 'providers' },
        { name: 'providers/cloud.route.json', dest: 'providers' },
        { name: 'providers/hybrid.route.json', dest: 'providers' },
        { name: 'providers/local.route.json', dest: 'providers' },
        { name: 'system-instructions/agent-generation.xml', dest: 'system-instructions' },
        { name: 'system-instructions/convention-mining.xml', dest: 'system-instructions' },
        { name: 'system-instructions/journey.xml', dest: 'system-instructions' },
        { name: 'system-instructions/tech-identification.xml', dest: 'system-instructions' },
      ];

      // Recreate or ensure config directories exist
      for (const file of filesToDownload) {
        const destDir = path.join(globalPath, file.dest);
        await fs.mkdir(destDir, { recursive: true });
      }

      let usedLatest = false;

      // Simple fetch wrapper
      const fetchFile = async (url: string): Promise<string | null> => {
        try {
          const res = await fetch(url);
          if (!res.ok) return null;
          return await res.text();
        } catch {
          return null;
        }
      };

      for (const file of filesToDownload) {
        let content = await fetchFile(`${baseUrl}/${file.name}`);
        if (!content) {
          channel.appendLine(`[FactoryReset] File ${file.name} not found in ${versionDir}, trying latest...`);
          content = await fetchFile(`${latestUrl}/${file.name}`);
          if (content) usedLatest = true;
        }

        if (content) {
          const destPath = path.join(globalPath, file.dest, path.basename(file.name));
          await fs.writeFile(destPath, content, 'utf-8');
          channel.appendLine(`[FactoryReset] Successfully downloaded and saved ${file.name}`);
        } else {
          channel.appendLine(`[FactoryReset] WARNING: Could not download ${file.name}`);
        }
      }

      if (usedLatest) {
        vscode.window.showWarningMessage(`Codernic Factory Reset completed, but some files fell back to "latest" because ${versionDir} was not found on GitHub.`);
      } else {
        vscode.window.showInformationMessage('Codernic Factory Reset completed successfully.');
      }

      // Reload window or resend schemas? We should trigger a reload so the UI gets fresh data
      vscode.commands.executeCommand('workbench.action.reloadWindow');

    } catch (error) {
      const err = error as Error;
      channel.appendLine(`[FactoryReset] Failed: ${err.message}`);
      vscode.window.showErrorMessage(`Factory Reset failed: ${err.message}`);
    }
  }
}
