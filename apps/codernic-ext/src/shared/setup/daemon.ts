import * as fs from 'fs/promises';
import * as path from 'path';
import * as vscode from 'vscode';
import * as net from 'net';
import { exec, spawn } from 'child_process';
import { promisify } from 'util';
import { resolvePlatformBinaries } from '../../utils/binaries';

const execAsync = promisify(exec);

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

export async function getDaemonMetadata(socketPath: string = '/tmp/codernic.sock'): Promise<{ version: string, pid: number } | null> {
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
    const socketPath = '/tmp/codernic.sock';
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
  const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
  
  if (workspaceRoot) {
    const exe = process.platform === 'win32' ? '.exe' : '';
    const devBin = path.join(workspaceRoot, 'target', 'debug', `ai_agencee_daemon${exe}`);
    try {
      await fs.access(devBin);
      cliPath = devBin;
      channel.appendLine(`[DAEMON] Dev mode: Found local daemon binary at ${cliPath}`);
    } catch {
      const devCodernic = path.join(workspaceRoot, 'target', 'debug', `ai_agencee_codernic${exe}`);
      try {
        await fs.access(devCodernic);
        cliPath = devCodernic;
        channel.appendLine(`[DAEMON] Dev mode: Found fallback daemon binary at ${cliPath}`);
      } catch {
        // Both failed
      }
    }
  }

  if (!cliPath) {
    try {
      cliPath = resolvePlatformBinaries(extensionPath).daemonPath;
      channel.appendLine(`[DAEMON] Prod mode: Resolved bundled daemon at ${cliPath}`);
    } catch (err) {
      channel.appendLine(
        `[DAEMON] ⚠ Binary not found or unsupported architecture — skipping auto-start. ` +
        `Error: ${err instanceof Error ? err.message : String(err)}`
      );
      return;
    }
  }

  try {
    const logPath = '/tmp/ai_agencee_daemon.log';
    const logFd = await fs.open(logPath, 'w');
    const child = spawn(cliPath, [], {
      stdio: ['ignore', logFd.fd, logFd.fd],
      detached: true,
      env: {
        ...process.env,
        RUST_LOG: 'warn,ai_agencee_daemon=info,ai_agencee_engine_inference=info,ragtime=info,lance=warn,lance_io=warn,lance_encoding=warn,datafusion=warn,ignore=warn,globset=warn',
        BYPASS_LICENSE: '1',
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


export async function queryDaemonStatus(socketPath: string = '/tmp/codernic.sock'): Promise<any> {
  return new Promise((resolve) => {
    const socket = net.createConnection(socketPath);
    let data = '';
    socket.on('connect', () => {
      socket.write(JSON.stringify('GetStatus') + '\n');
    });
    socket.on('data', (chunk) => {
      data += chunk.toString();
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

