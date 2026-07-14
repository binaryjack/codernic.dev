import * as fs from 'fs/promises';
import * as fsSync from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';
import { spawn } from 'child_process';
import { resolvePlatformBinaries } from '../../utils/binaries';
import { ExtensionStatusBar } from '../status/extension-status';

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
  extStatusBar?: ExtensionStatusBar,
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

    if (extStatusBar) extStatusBar.updateIndexStatus('indexing');

    if (broadcastToUI && child.stdout) {
      let buffer = '';
      child.stdout.on('data', (data: Buffer) => {
        buffer += data.toString();
        let newlineIdx;
        while ((newlineIdx = buffer.indexOf('\n')) !== -1) {
          const line = buffer.slice(0, newlineIdx).trim();
          buffer = buffer.slice(newlineIdx + 1);
          const match = line.match(/Progression : (\d+)\/(\d+) fichiers traités \((\d+)%\)/);
          if (match) {
            const filesIndexed = parseInt(match[1], 10);
            const totalFiles = parseInt(match[2], 10);
            const percentage = parseInt(match[3], 10);
            broadcastToUI({
              type: 'codernic:indexing-progress',
              payload: { filesIndexed, totalFiles, percentage },
            });
          }
        }
      });
    }

    child.unref();
    
    child.on('exit', () => {
      if (extStatusBar) extStatusBar.updateIndexStatus('fresh');
    });

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
  extStatusBar?: ExtensionStatusBar,
): Promise<void> {
  const dbPath = path.join(workspaceRoot, '.codernic', 'ragtime.db');

  try {
    const dbStat = await fs.stat(dbPath);
    const dbMtime = dbStat.mtimeMs;

    const isStale = await checkFilesNewerThan(workspaceRoot, dbMtime);
    if (isStale) {
      if (extStatusBar) extStatusBar.updateIndexStatus('stale');
      channel.appendLine('[RAG-CHECK] Local files have been modified since last semantic indexing.');
      const answer = await vscode.window.showInformationMessage(
        'AI Agencee: Codebase edits detected since your last index. Refresh the index now?',
        'Refresh',
        'Not now',
      );
      if (answer === 'Refresh') {
        channel.appendLine('[RAG-CHECK] Refreshing index in background...');
        await spawnIndexer(extensionPath, workspaceRoot, channel, broadcastToUI, extStatusBar);
      }
    } else {
      if (extStatusBar) extStatusBar.updateIndexStatus('fresh');
      channel.appendLine('[RAG-CHECK] Semantic index is up-to-date.');
    }
  } catch {
    // No ragtime.db found — first-time indexing
    if (extStatusBar) extStatusBar.updateIndexStatus('stale');
    channel.appendLine('[RAG-CHECK] No index database found at .codernic/ragtime.db — starting initial indexing...');
    await spawnIndexer(extensionPath, workspaceRoot, channel, broadcastToUI, extStatusBar);
  }
}

async function checkFilesNewerThan(_dir: string, timestamp: number): Promise<boolean> {
  try {
    const uris = await vscode.workspace.findFiles(
      '**/*',
      '{**/node_modules/**,**/target/**,**/.git/**,**/.codernic/**,**/.codernic/**,**/.next/**,**/.venv/**,**/vendor/**,**/build/**}'
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

