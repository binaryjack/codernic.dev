import * as vscode from 'vscode';
import * as cp from 'child_process';
import * as readline from 'readline';
import * as path from 'path';
import { getCopilotProxyPort } from '../../../shared/api/copilot-http-proxy';

export class CliProcessManager implements vscode.Disposable {
  private child: cp.ChildProcess | null = null;
  private isDisposed = false;

  constructor(
    private readonly workspaceRoot: string,
    private readonly onEvent: (json: any) => void,
    private readonly onError: (err: string) => void,
    private readonly onExit: (code: number | null) => void,
  ) {}

  public spawn(args: string[]): void {
    if (this.isDisposed) return;
    if (this.child) {
      this.kill();
    }

    const proxyPort = getCopilotProxyPort();
    const env = {
      ...process.env,
      // Provide the local HTTP proxy endpoint for the CLI
      AGENCEE_LOCAL_PROXY_URL: proxyPort > 0 ? `http://127.0.0.1:${proxyPort}/v1` : '',
    };

    // Ensure we use the right binary extension on Windows
    const binExt = process.platform === 'win32' ? '.exe' : '';
    const binName = `ai_agencee_cli${binExt}`;
    // Prefer release if it exists, otherwise debug
    const releasePath = path.join(this.workspaceRoot, 'target', 'release', binName);
    const debugPath = path.join(this.workspaceRoot, 'target', 'debug', binName);
    
    // We import fs directly here to avoid async spawn if possible, but actually we can just check synchronously
    const fs = require('fs');
    const binPath = fs.existsSync(releasePath) ? releasePath : fs.existsSync(debugPath) ? debugPath : binName;

    const spawnArgs = ['chat'].concat(args.slice(1)); // Remove the first 'chat' if it's already in args, wait, no, just pass args as is
    console.log(`[CliProcessManager] Spawning: ${binPath} ${args.join(' ')}`);

    this.child = cp.spawn(binPath, args, {
      cwd: this.workspaceRoot,
      env,
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    if (!this.child.stdout || !this.child.stderr || !this.child.stdin) {
      this.onError('Failed to bind stdio pipes to child process');
      return;
    }

    // Parse NDJSON from stdout
    const rl = readline.createInterface({
      input: this.child.stdout,
      terminal: false,
    });

    rl.on('line', (line) => {
      if (this.isDisposed) return;
      try {
        const json = JSON.parse(line);
        this.onEvent(json);
      } catch (err) {
        // If it's not JSON, it might be raw rust tracing logs or compiler output (if cargo run is used)
        if (line.trim()) {
           console.log(`[CLI STDOUT RAW]: ${line}`);
        }
      }
    });

    this.child.stderr.on('data', (data) => {
      if (this.isDisposed) return;
      const str = data.toString().trim();
      if (!str) return;
      
      // If it's just compilation warnings from cargo, ignore. But we use binary now, so any stderr is real.
      // We will just log it. If we call onError, it will terminate the chat in the UI. 
      // Rust CLI might use stderr for info logs.
      console.log(`[CLI STDERR]: ${str}`);
      
      // Only trigger an actual UI chat error if the daemon connection explicitly fails
      if (str.includes("Erreur de connexion au démon") || str.includes("Impossible de se connecter")) {
         this.onError(str);
      }
    });

    this.child.on('close', (code) => {
      this.child = null;
      if (!this.isDisposed) {
        this.onExit(code);
      }
    });
    
    this.child.on('error', (err) => {
      if (!this.isDisposed) {
        this.onError(`Spawn error: ${err.message}`);
      }
    });
  }

  public write(payload: any): void {
    if (this.isDisposed || !this.child || !this.child.stdin) {
      console.warn('[CliProcessManager] Cannot write to dead child process');
      return;
    }
    const jsonString = JSON.stringify(payload) + '\n';
    this.child.stdin.write(jsonString);
  }

  public kill(): void {
    if (this.child) {
      try {
        this.child.kill('SIGTERM');
        // Give it a moment, then SIGKILL
        setTimeout(() => {
          if (this.child) {
            try { this.child.kill('SIGKILL'); } catch (e) {}
          }
        }, 2000);
      } catch (e) {
        console.error('[CliProcessManager] Failed to kill child:', e);
      }
      this.child = null;
    }
  }

  public dispose() {
    this.isDisposed = true;
    this.kill();
  }
}
