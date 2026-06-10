// ── workspace-setup.ts — on-activation workspace scaffolding & package checks ─
// Run non-fatally in PHASE 1.5 of extension.ts (after workspace detection,
// before provider creation). All errors are caught and logged to channel only.

import * as fs from 'fs/promises';
import * as fsSync from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';
import * as net from 'net';
import { exec, spawn } from 'child_process';
import { promisify } from 'util';
import { notify, prompt } from '../shared/error-utils';
import { resolvePlatformBinaries } from '../utils/binaries';

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

function checkCommandTimeout(cmd: string, timeoutMs: number = 2000): Promise<void> {
  return new Promise((resolve, reject) => {
    let finished = false;
    const child = exec(cmd, (err) => {
      finished = true;
      if (err) reject(err);
      else resolve();
    });
    setTimeout(() => {
      if (!finished) {
        try { child.kill('SIGKILL'); } catch (e) {}
        reject(new Error(`Timeout executing ${cmd}`));
      }
    }, timeoutMs);
  });
}

export async function detectHardwareDriver(workspaceState?: vscode.Memento): Promise<'rocm' | 'cuda' | 'metal' | 'cpu'> {
  if (workspaceState) {
    const cached = workspaceState.get<'rocm' | 'cuda' | 'metal' | 'cpu'>('agencee.hardwareDriver');
    if (cached) return cached;
  }

  let result: 'rocm' | 'cuda' | 'metal' | 'cpu' = 'cpu';

  if (process.platform === 'darwin') {
    result = 'metal';
  } else if (process.platform === 'linux') {
    let hasRocm = false;
    try {
      await fs.access('/dev/kfd');
      await checkCommandTimeout('rocm-smi', 2000);
      result = 'rocm';
      hasRocm = true;
    } catch {
      hasRocm = false;
    }
    if (!hasRocm) {
      try {
        await checkCommandTimeout('nvidia-smi', 2000);
        result = 'cuda';
      } catch {
        // Fallback to CPU is default
      }
    }
  } else if (process.platform === 'win32') {
    try {
      await checkCommandTimeout('nvidia-smi', 2000);
      result = 'cuda';
    } catch {
      // Ignored
    }
  }

  if (workspaceState) {
    await workspaceState.update('agencee.hardwareDriver', result);
  }

  return result;
}

export async function getDaemonMetadata(socketPath: string = '/tmp/ai_agencee.sock'): Promise<{ version: string, pid: number } | null> {
  return new Promise((resolve) => {
    const socket = net.createConnection(socketPath);
    let rawRes = '';
    socket.on('data', (d) => { rawRes += d.toString(); });
    socket.on('end', () => {
      try {
        const res = JSON.parse(rawRes.trim());
        if (res && res.Version) {
          resolve({ version: res.Version.version, pid: res.Version.pid });
          return;
        }
      } catch (e) {
        // parsing failed
      }
      resolve(null);
    });
    socket.on('error', () => {
      resolve(null);
    });
    socket.on('connect', () => {
      socket.write('"GetVersion"\n');
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
  _workspaceState?: vscode.Memento,
): Promise<void> {
  const metadata = await getDaemonMetadata();
  let extensionVersion = '0.0.0';
  try {
    const pkg = JSON.parse(await fs.readFile(path.join(extensionPath, 'package.json'), 'utf-8'));
    extensionVersion = pkg.version;
  } catch (e) {}

  if (metadata) {
    if (metadata.version !== extensionVersion) {
      channel.appendLine(`[DAEMON] ⚠ Version mismatch (Daemon: ${metadata.version}, Extension: ${extensionVersion}). Killing daemon PID ${metadata.pid}...`);
      try {
        process.kill(metadata.pid, 'SIGTERM');
        // Give it a moment to exit
        await new Promise((r) => setTimeout(r, 500));
      } catch (e) {
        channel.appendLine(`[DAEMON] Failed to kill PID ${metadata.pid}: ${e}`);
      }
    } else {
      channel.appendLine(`[DAEMON] ✓ Already running (Version: ${metadata.version})`);
      return;
    }
  }

  if (process.platform !== 'win32') {
    const socketPath = '/tmp/ai_agencee.sock';
    try {
      await fs.access(socketPath);
      await fs.unlink(socketPath);
      channel.appendLine(`[DAEMON] Removed zombie UNIX socket: ${socketPath}`);
    } catch {
      // Socket does not exist, nothing to do
    }
  }

  channel.appendLine('[DAEMON] Not running — attempting auto-start...');

  let cliPath = '';
  try {
    cliPath = resolvePlatformBinaries(extensionPath).daemonPath;
  } catch (err) {
    channel.appendLine(
      `[DAEMON] ⚠ Binary not found or unsupported architecture — skipping auto-start (dev mode). ` +
      `Error: ${err instanceof Error ? err.message : String(err)}`
    );
    return;
  }

  try {
    const logPath = '/tmp/ai_agencee_daemon.log';
    const logFd = await fs.open(logPath, 'w');
    const child = spawn(cliPath, ['daemon', 'start'], {
      stdio: ['ignore', logFd.fd, logFd.fd],
      detached: true,
      env: {
        ...process.env,
        RUST_LOG: 'warn,ai_agencee_daemon=info,ai_agencee_engine_inference=info,ragtime=info,lance=warn,lance_io=warn,lance_encoding=warn,datafusion=warn,ignore=warn,globset=warn',
      },
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
  _workspaceRoot: string,
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
    const driver = await detectHardwareDriver(context.workspaceState);
    channel.appendLine(`[BOOTSTRAP] Detected hardware driver capability: ${driver.toUpperCase()}`);
    vscode.window.showInformationMessage(`AI Agencee: Detected hardware platform: ${driver.toUpperCase()}`);

    let resolvedBinaries;
    try {
      resolvedBinaries = resolvePlatformBinaries(extensionPath);
      channel.appendLine(`[BOOTSTRAP] Binaries verified via resolvePlatformBinaries`);
    } catch (err) {
      channel.appendLine(`[BOOTSTRAP] ⚠ Binary resolution failed: ${err}`);
      vscode.window.showWarningMessage(`Local binaries were not found in the extension distribution.`);
      return;
    }

    const isDaemonAlive = (await getDaemonMetadata()) !== null;
    if (!isDaemonAlive) {
      vscode.window.showInformationMessage('AI Agencee: Starting background daemon...');
      try {
        const cliPath = resolvedBinaries.cliPath;
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

/**
 * Spawns `ai_agencee_cli code:index --path <root>` detached so it runs in the
 * background without blocking the extension activation or opening a terminal.
 * Logs are streamed to /tmp/ai_agencee_indexer.log.
 */
async function spawnIndexer(
  extensionPath: string,
  workspaceRoot: string,
  channel: vscode.OutputChannel,
  broadcastToUI?: (msg: any) => void,
): Promise<void> {
  // Fallback to dev target binaries when the extension bin is absent
  let binPath = '';
  try {
    binPath = resolvePlatformBinaries(extensionPath).cliPath;
  } catch {
    const exe = process.platform === 'win32' ? '.exe' : '';
    const devBin = path.join(workspaceRoot, 'target', 'debug', `ai_agencee_cli${exe}`);
    try {
      await fs.access(devBin);
      binPath = devBin;
    } catch {
      channel.appendLine('[RAG-INDEX] ✗ ai_agencee_cli not found — cannot start indexer.');
      return;
    }
  }

  const logPath = '/tmp/ai_agencee_indexer.log';
  try {
    const logFd = await fs.open(logPath, 'w');
    const child = spawn(binPath, ['code:index', '--path', workspaceRoot], {
      stdio: ['ignore', 'pipe', logFd.fd],
      detached: true,
      env: {
        ...process.env,
        RUST_LOG: 'warn,ai_agencee_daemon=info,ai_agencee_engine_inference=info,ragtime=info,lance=warn,lance_io=warn,lance_encoding=warn,datafusion=warn,ignore=warn,globset=warn',
      },
    });

    if (broadcastToUI && child.stdout) {
      child.stdout.on('data', (data: Buffer) => {
        const output = data.toString();
        const match = output.match(/Progression : (\d+)\/(\d+) fichiers traités \((\d+)%\)/);
        if (match) {
          const filesIndexed = parseInt(match[1], 10);
          const totalFiles = parseInt(match[2], 10);
          const percentage = parseInt(match[3], 10);
          broadcastToUI({
            type: 'codernic:indexing-progress',
            payload: { filesIndexed, totalFiles, percentage },
          });
        }
      });
    }

    child.unref();
    await logFd.close();
    channel.appendLine(
      `[RAG-INDEX] ✓ Indexer spawned (PID: ${child.pid ?? 'unknown'}), logs → ${logPath}`,
    );
    vscode.window.setStatusBarMessage('$(sync~spin) AI Agencee: Indexing codebase...', 8000);
  } catch (err) {
    channel.appendLine(
      `[RAG-INDEX] ✗ Failed to spawn indexer: ${err instanceof Error ? err.message : String(err)}`,
    );
  }
}

export async function checkCodebaseFreshness(
  workspaceRoot: string,
  extensionPath: string,
  channel: vscode.OutputChannel,
  broadcastToUI?: (msg: any) => void,
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
        'Not now',
      );
      if (answer === 'Refresh') {
        channel.appendLine('[RAG-CHECK] Refreshing index in background...');
        await spawnIndexer(extensionPath, workspaceRoot, channel, broadcastToUI);
      }
    } else {
      channel.appendLine('[RAG-CHECK] Semantic index is up-to-date.');
    }
  } catch {
    // No ragtime.db found — first-time indexing
    channel.appendLine('[RAG-CHECK] No index database found at .agencee/ragtime.db — starting initial indexing...');
    await spawnIndexer(extensionPath, workspaceRoot, channel, broadcastToUI);
  }
}

async function checkFilesNewerThan(_dir: string, timestamp: number): Promise<boolean> {
  try {
    const uris = await vscode.workspace.findFiles(
      '**/*',
      '{**/node_modules/**,**/target/**,**/.git/**,**/.agencee/**,**/.next/**,**/.venv/**,**/vendor/**,**/build/**}'
    );

    const batchSize = 100;
    for (let i = 0; i < uris.length; i += batchSize) {
      const batch = uris.slice(i, i + batchSize);
      const stats = await Promise.all(
        batch.map(async (uri) => {
          try {
            const st = await fs.stat(uri.fsPath);
            return st.mtimeMs;
          } catch {
            return 0;
          }
        })
      );

      if (stats.some(mtime => mtime > timestamp)) {
        return true;
      }
    }
  } catch {
    // Ignored
  }
  return false;
}

export function tailFile(filePath: string, onLine: (line: string) => void): fsSync.FSWatcher {
  let size = 0;
  try {
    size = fsSync.statSync(filePath).size;
  } catch (e) {
    // File might not exist yet
  }

  const watcher = fsSync.watch(filePath, (event) => {
    if (event === 'change') {
      try {
        const stats = fsSync.statSync(filePath);
        if (stats.size < size) {
          // File was truncated
          size = 0;
        }
        if (stats.size > size) {
          const stream = fsSync.createReadStream(filePath, { start: size, end: stats.size });
          let buffer = '';
          stream.on('data', (chunk) => {
            buffer += chunk.toString();
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';
            for (const line of lines) {
              if (line.trim()) {
                onLine(line);
              }
            }
          });
          stream.on('end', () => {
            size = stats.size;
          });
        }
      } catch (e) {
        // ignore
      }
    }
  });

  return watcher;
}

export async function queryDaemonStatus(socketPath: string = '/tmp/ai_agencee.sock'): Promise<any> {
  return new Promise((resolve) => {
    const socket = net.createConnection(socketPath);
    let data = '';
    socket.on('connect', () => {
      socket.write(JSON.stringify('GetStatus') + '\n');
    });
    socket.on('data', (chunk) => {
      data += chunk.toString();
      if (data.includes('\n')) {
        socket.end();
      }
    });
    socket.on('end', () => {
      try {
        const response = JSON.parse(data.trim());
        resolve(response);
      } catch (e) {
        resolve(null);
      }
    });
    socket.on('error', () => {
      resolve(null);
    });
  });
}

