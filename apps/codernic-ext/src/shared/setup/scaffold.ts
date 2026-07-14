import * as fs from 'fs/promises';
import * as path from 'path';
import * as vscode from 'vscode';

/** Files to copy: [source relative to extensionPath, target relative to workspaceRoot] */
const SCAFFOLD_FILES: [string, string][] = [
  [
    path.join('media', 'prompts', 'tech-identification.xml'),
    path.join('system-instructions', 'tech-identification.xml'),
  ],
  [
    path.join('media', 'prompts', 'convention-mining.xml'),
    path.join('system-instructions', 'convention-mining.xml'),
  ],
  [
    path.join('media', 'prompts', 'agent-generation.xml'),
    path.join('system-instructions', 'agent-generation.xml'),
  ],
  [
    path.join('media', 'journey.xml'),
    path.join('system-instructions', 'journey.xml'),
  ],
  [
    path.join('media', 'config-templates', 'llms', 'routes.json'),
    path.join('llms', 'routes.json'),
  ],
  [
    path.join('media', 'config-templates', 'llms', 'local.route.json'),
    path.join('llms', 'local.route.json'),
  ],
  [
    path.join('media', 'config-templates', 'llms', 'cloud.route.json'),
    path.join('llms', 'cloud.route.json'),
  ],
  [
    path.join('media', 'config-templates', 'llms', 'hybrid.route.json'),
    path.join('llms', 'hybrid.route.json'),
  ],
  [
    path.join('media', 'config-templates', 'llms', 'openai.provider.json'),
    path.join('llms', 'openai.provider.json'),
  ],
  [
    path.join('media', 'config-templates', 'llms', 'anthropic.provider.json'),
    path.join('llms', 'anthropic.provider.json'),
  ],
  [
    path.join('media', 'config-templates', 'llms', 'google.provider.json'),
    path.join('llms', 'google.provider.json'),
  ],
  [
    path.join('media', 'config-templates', 'llms', 'ollama.provider.json'),
    path.join('llms', 'ollama.provider.json'),
  ],
  [
    path.join('media', 'config-templates', 'llms', 'xai.provider.json'),
    path.join('llms', 'xai.provider.json'),
  ],
  [
    path.join('media', 'config-templates', 'llms', 'gguf-local.provider.json'),
    path.join('llms', 'gguf-local.provider.json'),
  ]
];

/**
 * Copy bundled default XML files into the workspace `.codernic/` and `.codernic/` folders.
 * Skips files that already exist — never overwrites user customisations.
 * All failures are logged and non-fatal.
 */
export async function scaffoldAgenceeConfig(
  workspaceRoot: string,
  extensionPath: string,
  channel: vscode.OutputChannel,
): Promise<void> {
  const globalRoot = path.join(require('os').homedir(), '.codernic');
  channel.appendLine('[SCAFFOLD] Checking global .codernic engine files…');

  for (const [srcRel, dstRel] of SCAFFOLD_FILES) {
    const src = path.join(extensionPath, srcRel);
    const dst = path.join(globalRoot, dstRel);

    try {
      // Ensure target directory exists
      await fs.mkdir(path.dirname(dst), { recursive: true });

      // Check if target already exists
      try {
        await fs.access(dst);
        channel.appendLine(`[SCAFFOLD] exists: ${dstRel}`);
        continue;
      } catch {
        // File absent — copy it
      }

      await fs.copyFile(src, dst);
      channel.appendLine(`[SCAFFOLD] ✓ created: ${dstRel}`);
    } catch (err) {
      channel.appendLine(
        `[SCAFFOLD] ⚠ failed to scaffold ${dstRel}: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }

  // Sweep legacy configurations
  try {
    const llmsDir = path.join(globalRoot, 'llms');
    const files = await fs.readdir(llmsDir);
    for (const file of files) {
      if (file.endsWith('.provider.json')) {
        const filePath = path.join(llmsDir, file);
        try {
          const content = JSON.parse(await fs.readFile(filePath, 'utf-8'));
          if (content.type === 'local_candle') {
            await fs.unlink(filePath);
            channel.appendLine(`[SCAFFOLD] ✓ deleted legacy unsupported provider: ${file}`);
          }
        } catch (e) {
          // ignore parsing errors
        }
      }
    }
  } catch (err) {
    // llms dir might not exist yet, ignore
  }
}

