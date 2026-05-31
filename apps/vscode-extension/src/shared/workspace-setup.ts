// ── workspace-setup.ts — on-activation workspace scaffolding & package checks ─
// Run non-fatally in PHASE 1.5 of extension.ts (after workspace detection,
// before provider creation). All errors are caught and logged to channel only.

import * as fs from 'fs/promises';
import * as path from 'path';
import * as vscode from 'vscode';
import * as net from 'net';
import { exec, spawn } from 'child_process';
import { promisify } from 'util';
import { notify, prompt } from '../shared/error-utils';

const execAsync = promisify(exec);

// ─── Types ────────────────────────────────────────────────────────────────────

type CompatiblePackages = Record<string, string>;

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Parse "^X.Y.Z" / "~X.Y.Z" / "X.Y.Z" → [major, minor, patch] as numbers. */
function parseVersion(raw: string): [number, number, number] | null {
  const cleaned = raw.replace(/^[\^~>=<\s]+/, '').split('-')[0]; // strip ranges/pre-release
  const parts = cleaned.split('.').map(Number);
  if (parts.length < 2 || parts.some(isNaN)) return null;
  return [parts[0], parts[1] ?? 0, parts[2] ?? 0];
}

/**
 * Returns true if `installed` satisfies `range` (caret semantics only).
 * "^X.Y.Z" = same major, minor+patch ≥ Y.Z
 */
function isCompatible(installed: string, range: string): boolean {
  const req = parseVersion(range);
  const ins = parseVersion(installed);
  if (!req || !ins) return true; // can't determine — don't false-alarm
  const [rMaj, rMin, rPat] = req;
  const [iMaj, iMin, iPat] = ins;
  if (iMaj !== rMaj) return false;
  if (iMin !== rMin) return iMin > rMin;
  return iPat >= rPat;
}

// ─── Scaffold ─────────────────────────────────────────────────────────────────

/** Files to copy: [source relative to extensionPath, target relative to workspaceRoot] */
const SCAFFOLD_FILES: [string, string][] = [
  [
    path.join('media', 'prompts', 'tech-identification.xml'),
    path.join('.agencee', 'config', 'codernic', 'prompts', 'tech-identification.xml'),
  ],
  [
    path.join('media', 'prompts', 'convention-mining.xml'),
    path.join('.agencee', 'config', 'codernic', 'prompts', 'convention-mining.xml'),
  ],
  [
    path.join('media', 'prompts', 'agent-generation.xml'),
    path.join('.agencee', 'config', 'codernic', 'prompts', 'agent-generation.xml'),
  ],
  [
    path.join('media', 'journey.xml'),
    path.join('.agencee', 'config', 'codernic', 'rules', 'journey.xml'),
  ],
  [
    path.join('media', 'config-templates', 'llms', 'candle-local.provider.json'),
    path.join('.agencee', 'config', 'llms', 'candle-local.provider.json'),
  ],
  [
    path.join('media', 'config-templates', 'llms', 'routes.json'),
    path.join('.agencee', 'config', 'llms', 'routes.json'),
  ],
];

/**
 * Copy bundled default XML files into the workspace `.agencee/` folder.
 * Skips files that already exist — never overwrites user customisations.
 * All failures are logged and non-fatal.
 */
export async function scaffoldAgenceeConfig(
  workspaceRoot: string,
  extensionPath: string,
  channel: vscode.OutputChannel,
): Promise<void> {
  channel.appendLine('[SCAFFOLD] Checking .agencee config files…');

  for (const [srcRel, dstRel] of SCAFFOLD_FILES) {
    const src = path.join(extensionPath, srcRel);
    const dst = path.join(workspaceRoot, dstRel);

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
}

// ─── Package Check ────────────────────────────────────────────────────────────

interface PackageJson {
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  'ai-agencee'?: {
    compatiblePackages?: Record<string, string>;
  };
}

export async function getMissingRequiredPackages(
  workspaceRoot: string,
  extensionPath: string,
): Promise<string[]> {
  try {
    const extPkg = JSON.parse(
      await fs.readFile(path.join(extensionPath, 'package.json'), 'utf-8'),
    ) as PackageJson;
    const compatiblePackages = extPkg['ai-agencee']?.compatiblePackages ?? {};
    if (Object.keys(compatiblePackages).length === 0) return [];

    const userPkgPath = path.join(workspaceRoot, 'package.json');
    let userPkg: PackageJson = {};
    try {
      userPkg = JSON.parse(await fs.readFile(userPkgPath, 'utf-8'));
    } catch {
      return Object.keys(compatiblePackages);
    }

    const installed: Record<string, string> = {
      ...userPkg.dependencies,
      ...userPkg.devDependencies,
    };

    const missing: string[] = [];
    for (const [pkgName] of Object.entries(compatiblePackages)) {
      if (!installed[pkgName]) missing.push(pkgName);
    }
    return missing;
  } catch {
    return [];
  }
}

/**
 * Check that the workspace has compatible @ai-agencee/* packages.
 * - Missing packages: prompt once per extension version, inject into devDependencies if user agrees.
 * - Mismatched versions: show a warning notification.
 *
 * Prompt guard key: `agencee.pkgPromptVersion` in workspaceState.
 */
export async function checkWorkspacePackages(
  workspaceRoot: string,
  extensionPath: string,
  channel: vscode.OutputChannel,
  workspaceState: vscode.ExtensionContext['workspaceState'],
): Promise<void> {
  channel.appendLine('[PKG-CHECK] Checking @ai-agencee/* packages…');

  // Read compatible packages from extension's own package.json
  let compatiblePackages: CompatiblePackages;
  try {
    const pkgData = await fs.readFile(path.join(extensionPath, 'package.json'), 'utf-8');
    const extPkg = JSON.parse(pkgData) as {
      version: string;
      'ai-agencee'?: { compatiblePackages?: CompatiblePackages };
    };
    compatiblePackages = extPkg['ai-agencee']?.compatiblePackages ?? {};
    const extensionVersion = extPkg.version;

    if (Object.keys(compatiblePackages).length === 0) {
      channel.appendLine('[PKG-CHECK] No compatiblePackages declared — skipping.');
      return;
    }

    // Read user's workspace package.json
    const userPkgPath = path.join(workspaceRoot, 'package.json');
    let userPkg: {
      dependencies?: Record<string, string>;
      devDependencies?: Record<string, string>;
    };
    try {
      userPkg = JSON.parse(await fs.readFile(userPkgPath, 'utf-8'));
    } catch {
      channel.appendLine('[PKG-CHECK] No workspace package.json found — skipping.');
      return;
    }

    // Merge all installed versions
    const installed: Record<string, string> = {
      ...userPkg.dependencies,
      ...userPkg.devDependencies,
    };

    const missing: string[] = [];
    const mismatched: Array<{ name: string; has: string; needs: string }> = [];

    for (const [pkgName, requiredRange] of Object.entries(compatiblePackages)) {
      const installedVersion = installed[pkgName];
      if (!installedVersion) {
        missing.push(pkgName);
      } else if (!isCompatible(installedVersion, requiredRange)) {
        mismatched.push({ name: pkgName, has: installedVersion, needs: requiredRange });
      }
    }

    // ── Version mismatches — warn via toast ──────────────────────────────────
    for (const { name, has, needs } of mismatched) {
      const msg = `${name} ${has} is installed but AI Agencee ${extensionVersion} requires ${needs}. Run: npm install ${name}@latest -D`;
      channel.appendLine(`[PKG-CHECK] ⚠ mismatch: ${msg}`);
      notify('warn', msg);
    }

    // ── Missing packages — prompt once per extension version ─────────────────
    if (missing.length > 0) {
      const alreadyPrompted = workspaceState.get<string>('agencee.pkgPromptVersion');
      if (alreadyPrompted === extensionVersion) {
        channel.appendLine(
          `[PKG-CHECK] Already prompted this version (${extensionVersion}) — skipping.`,
        );
        return;
      }

      const pkgList = missing.join(', ');
      channel.appendLine(`[PKG-CHECK] Missing packages: ${pkgList}`);

      const answer = await prompt(
        'info',
        `AI Agencee: Add ${pkgList} to devDependencies for full indexing and MCP support?`,
        'Add',
        'Not now',
      );

      // Mark as prompted regardless of answer (don't re-ask until version changes)
      await workspaceState.update('agencee.pkgPromptVersion', extensionVersion);

      if (answer === 'Add') {
        try {
          // Re-read to preserve formatting as much as possible
          const raw = await fs.readFile(userPkgPath, 'utf-8');
          const parsed = JSON.parse(raw) as {
            devDependencies?: Record<string, string>;
            [k: string]: unknown;
          };
          if (!parsed.devDependencies) parsed.devDependencies = {};

          for (const pkgName of missing) {
            const range = compatiblePackages[pkgName];
            // Strip caret — inject exact minimum version so user can see what was pinned
            const exactVersion = range.replace(/^[\^~]/, '');
            parsed.devDependencies[pkgName] = `^${exactVersion}`;
            channel.appendLine(
              `[PKG-CHECK] ✓ added ${pkgName}@^${exactVersion} to devDependencies`,
            );
          }

          await fs.writeFile(userPkgPath, JSON.stringify(parsed, null, 2) + '\n', 'utf-8');
          channel.appendLine(
            '[PKG-CHECK] ✓ package.json updated. Run: pnpm install (or npm install) to complete setup.',
          );
          notify(
            'info',
            `AI Agencee: Added ${pkgList} to package.json devDependencies. Run pnpm install to complete setup.`,
          );
        } catch (writeErr) {
          const msg = writeErr instanceof Error ? writeErr.message : String(writeErr);
          channel.appendLine(`[PKG-CHECK] ✗ Failed to write package.json: ${msg}`);
          notify(
            'warn',
            `AI Agencee: Could not update package.json automatically. Add ${pkgList} manually.`,
          );
        }
      }
    } else {
      channel.appendLine('[PKG-CHECK] ✓ All required packages present and compatible.');
    }
  } catch (err) {
    channel.appendLine(
      `[PKG-CHECK] ⚠ Unexpected error: ${err instanceof Error ? err.message : String(err)}`,
    );
    // Non-fatal — extension continues normally
  }
}

export async function detectHardwareDriver(): Promise<'rocm' | 'cuda' | 'metal' | 'cpu'> {
  if (process.platform === 'darwin') {
    return 'metal';
  }
  if (process.platform === 'linux') {
    try {
      await fs.access('/dev/kfd');
      return 'rocm';
    } catch {
      // Ignored
    }
    try {
      await execAsync('nvidia-smi');
      return 'cuda';
    } catch {
      // Ignored
    }
  }
  if (process.platform === 'win32') {
    try {
      await execAsync('nvidia-smi');
      return 'cuda';
    } catch {
      // Ignored
    }
  }
  return 'cpu';
}

export async function pingDaemon(socketPath: string = '/tmp/ai_agencee.sock'): Promise<boolean> {
  return new Promise((resolve) => {
    const socket = net.createConnection(socketPath);
    socket.on('connect', () => {
      socket.end();
      resolve(true);
    });
    socket.on('error', () => {
      resolve(false);
    });
  });
}

/**
 * Ensures the AI Agencee daemon is running.
 * - If already alive: logs and returns.
 * - If dead and binary exists in extensionPath/bin: spawns it detached and silently.
 * - If dead and binary missing (dev mode): logs a warning and returns without crashing.
 */
export async function ensureDaemonRunning(
  extensionPath: string,
  channel: vscode.OutputChannel,
): Promise<void> {
  const isAlive = await pingDaemon();
  if (isAlive) {
    channel.appendLine('[DAEMON] ✓ Already running');
    return;
  }

  channel.appendLine('[DAEMON] Not running — attempting auto-start...');

  const driver = await detectHardwareDriver();
  const suffix =
    driver === 'rocm' ? '_rocm' :
    driver === 'cuda' ? '_cuda' :
    driver === 'metal' ? '_metal' : '';
  const binaryName = `ai_agencee_cli${suffix}`;
  const cliPath = path.join(extensionPath, 'bin', binaryName);

  try {
    await fs.access(cliPath);
  } catch {
    channel.appendLine(
      `[DAEMON] ⚠ Binary not found at ${cliPath} — skipping auto-start (dev mode). ` +
      `Run manually: cargo run --bin ai-agencee-daemon`
    );
    return;
  }

  try {
    const logPath = '/tmp/ai_agencee_daemon.log';
    const logFd = await fs.open(logPath, 'w');
    const child = spawn(cliPath, ['daemon', 'start'], {
      stdio: ['ignore', logFd.fd, logFd.fd],
      detached: true,
    });
    child.unref();
    await logFd.close();
    channel.appendLine(`[DAEMON] ✓ Daemon spawned (PID: ${child.pid ?? 'unknown'}), logs → ${logPath}`);
    vscode.window.setStatusBarMessage('$(sync~spin) AI Agencee: Daemon starting...', 4000);
  } catch (err) {
    channel.appendLine(`[DAEMON] ✗ Failed to auto-start daemon: ${err instanceof Error ? err.message : String(err)}`);
  }
}

export async function guidedSetupWorkflow(
  workspaceRoot: string,
  extensionPath: string,
  channel: vscode.OutputChannel,
  context: vscode.ExtensionContext,
): Promise<void> {
  const selection = await vscode.window.showQuickPick(
    [
      { label: 'Local Only', description: 'Run model locally on ROCm/CUDA/Metal/CPU (No API keys needed)' },
      { label: 'Hybrid (Local + Cloud)', description: 'Local embeddings/indexing + Cloud API reasoning (BYOK)' },
      { label: 'Cloud Only', description: 'Fully managed cloud APIs reasoning/embeddings (BYOK)' }
    ],
    { placeHolder: 'Select your AI Agencee Workflow Configuration' }
  );

  if (!selection) return;

  channel.appendLine(`[BOOTSTRAP] Selected workflow: ${selection.label}`);
  await context.globalState.update('agencee.workflowType', selection.label);

  if (selection.label === 'Local Only' || selection.label === 'Hybrid (Local + Cloud)') {
    const driver = await detectHardwareDriver();
    channel.appendLine(`[BOOTSTRAP] Detected hardware driver capability: ${driver.toUpperCase()}`);
    vscode.window.showInformationMessage(`AI Agencee: Detected hardware platform: ${driver.toUpperCase()}`);

    const binDir = path.join(extensionPath, 'bin');
    let daemonBinary = 'ai-agencee-daemon';
    if (driver === 'rocm') daemonBinary = 'ai-agencee-daemon_rocm';
    else if (driver === 'cuda') daemonBinary = 'ai-agencee-daemon_cuda';
    else if (driver === 'metal') daemonBinary = 'ai-agencee-daemon_metal';

    try {
      await fs.access(path.join(binDir, daemonBinary));
      channel.appendLine(`[BOOTSTRAP] Binary verified: ${daemonBinary}`);
    } catch {
      channel.appendLine(`[BOOTSTRAP] ⚠ Binary missing in extension path: ${daemonBinary}`);
      vscode.window.showWarningMessage(`Local binary (${daemonBinary}) was not found in the extension. Falling back to default CPU binary.`);
    }

    const isDaemonAlive = await pingDaemon();
    if (!isDaemonAlive) {
      vscode.window.showInformationMessage('AI Agencee: Starting background daemon...');
      try {
        const cliPath = path.join(binDir, 'ai_agencee_cli');
        await execAsync(`"${cliPath}" daemon start`);
        channel.appendLine('[BOOTSTRAP] Daemon started successfully via CLI');
      } catch (err) {
        channel.appendLine(`[BOOTSTRAP] Failed to start daemon: ${err}`);
      }
    } else {
      channel.appendLine('[BOOTSTRAP] Daemon is already running');
    }
  }

  if (selection.label === 'Cloud Only' || selection.label === 'Hybrid (Local + Cloud)') {
    const keyChoice = await vscode.window.showQuickPick(
      ['OpenAI API Key', 'Anthropic API Key', 'OpenRouter API Key', 'Skip for now'],
      { placeHolder: 'Select a provider to add API Key (Bring Your Own Key)' }
    );

    if (keyChoice && keyChoice !== 'Skip for now') {
      const apiKey = await vscode.window.showInputBox({
        prompt: `Enter your API Key for ${keyChoice}`,
        password: true,
      });
      if (apiKey) {
        const secretKey = keyChoice.replace(/\s+/g, '').toLowerCase();
        await context.secrets.store(secretKey, apiKey);
        channel.appendLine(`[BOOTSTRAP] Successfully stored ${keyChoice} in SecretStorage`);
        vscode.window.showInformationMessage(`API Key for ${keyChoice} saved.`);
      }
    }
  }
}

export async function checkCodebaseFreshness(
  workspaceRoot: string,
  channel: vscode.OutputChannel,
): Promise<void> {
  const dbPath = path.join(workspaceRoot, '.agencee', 'ragtime.db');
  
  try {
    const dbStat = await fs.stat(dbPath);
    const dbMtime = dbStat.mtimeMs;

    const isStale = await checkFilesNewerThan(workspaceRoot, dbMtime);
    if (isStale) {
      channel.appendLine('[RAG-CHECK] Local files have been modified since last semantic indexing.');
      const answer = await vscode.window.showInformationMessage(
        'AI Agencee: Codebase edits detected since your last index. Refresh the index now?',
        'Refresh',
        'Not now'
      );
      if (answer === 'Refresh') {
        channel.appendLine('[RAG-CHECK] Refreshing index...');
        const terminal = vscode.window.createTerminal('AI Agencee Indexer');
        terminal.show();
        terminal.sendText('agencee code:index --path .');
      }
    } else {
      channel.appendLine('[RAG-CHECK] Semantic index is up-to-date.');
    }
  } catch {
    channel.appendLine('[RAG-CHECK] No index database found at .agencee/ragtime.db. Codebase is not indexed.');
  }
}

async function checkFilesNewerThan(dir: string, timestamp: number): Promise<boolean> {
  const ignoreDirs = ['node_modules', 'target', '.git', '.agencee', 'dist'];
  
  async function scan(currentDir: string): Promise<boolean> {
    try {
      const entries = await fs.readdir(currentDir, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.isDirectory()) {
          if (ignoreDirs.includes(entry.name)) continue;
          const res = await scan(path.join(currentDir, entry.name));
          if (res) return true;
        } else if (entry.isFile()) {
          const filePath = path.join(currentDir, entry.name);
          const stat = await fs.stat(filePath);
          if (stat.mtimeMs > timestamp) {
            return true;
          }
        }
      }
    } catch {
      // Ignored
    }
    return false;
  }

  return scan(dir);
}

