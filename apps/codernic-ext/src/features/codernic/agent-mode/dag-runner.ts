/**
 * @file dag-runner.ts
 * @description Spawns `node ai-kit agent:run-stream` and forwards NDJSON events
 * to a caller-provided callback. Used by Codernic Agent mode live lane panel.
 */

import { spawn } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';
import * as vscode from 'vscode';
import { type McpClientInstance, callMcpTool } from '../../../shared/mcp/create-mcp-client';

// ─── Event types (mirror of run-dag-stream.ts NDJSON output) ─────────────────

export type DagRunEvent =
  | { type: 'run-start'; dagName: string; laneIds: string[]; runId: string }
  | { type: 'lane-start'; laneId: string; timestamp: string }
  | { type: 'lane-end'; laneId: string; status: string; durationMs: number; retries: number }
  | {
      type: 'checkpoint';
      laneId: string;
      checkpointId: string;
      verdict: string;
      retryCount: number;
      durationMs: number;
    }
  | { type: 'llm-cost'; laneId: string; estimatedCostUSD: number; runningTotalUSD: number }
  | { type: 'budget-exceeded'; limitUSD: number; actualUSD: number }
  | {
      type: 'run-end';
      status: string;
      durationMs: number;
      totalCostUSD: number;
      lanes: Array<{ id: string; status: string }>;
    }
  | { type: 'error'; message: string }
  | { type: 'step_start'; step_id: string; strategy: string; max_attempts: number }
  | { type: 'step_retry'; step_id: string; attempt: number; error_stderr: string }
  | { type: 'step_success'; step_id: string; attempts: number }
  | { type: 'step_failed'; step_id: string; final_error: string }
  | { type: 'vector_commit'; step_id: string; message: string }
  | { type: 'agent_message'; content: string }
  | { type: 'tool-call'; toolCall: any }
  | { type: 'tool-executed'; toolCall: any }
  | { type: 'codernic:await-approval'; id: string; prompt: string }
  | { type: 'galileus:reset-state' };

let activeProcess: import('child_process').ChildProcess | null = null;

export function abortExecution() {
  if (activeProcess) {
    activeProcess.kill();
    activeProcess = null;
  }
}

export function sendApprovalResponse(payload: any) {
  if (activeProcess && activeProcess.stdin) {
    activeProcess.stdin.write(JSON.stringify(payload) + '\n');
  }
}

function findAiKitBinary(
  workspaceRoot: string,
  extensionPath: string | undefined,
  channel: { appendLine: (m: string) => void },
): string {
  const candidates = [
    ...(extensionPath
      ? [
          path.join(extensionPath, 'bin', 'ai_agencee_cli'),
          path.join(extensionPath, 'bin', 'ai_agencee_cli.exe'),
          path.join(extensionPath, 'bin', 'ragtime_cli'),
          path.join(extensionPath, 'bin', 'ragtime_cli.exe'),
        ]
      : []),
    path.join(workspaceRoot, 'target', 'debug', 'ai_agencee_cli'),
    path.join(workspaceRoot, 'target', 'release', 'ai_agencee_cli'),
    path.join(workspaceRoot, 'target', 'debug', 'ragtime_cli'),
    path.join(workspaceRoot, 'target', 'release', 'ragtime_cli'),
    path.join(workspaceRoot, 'ragtime', 'target', 'debug', 'ragtime_cli'),
    path.join(workspaceRoot, 'ragtime', 'target', 'release', 'ragtime_cli'),
  ];
  for (const c of candidates) {
    if (fs.existsSync(c)) {
      channel.appendLine(`[DagRunner] Found binary at: \${c}`);
      return c;
    }
  }
  throw new Error('AI Agencee Engine binary not found.');
}

/**
 * Run a DAG file and stream events via onEvent callback.
 * Spawns: [ragtime_cli] agent run-stream <dagFile> --project <workspaceRoot>
 */
export async function runDagStream(
  dagFile: string,
  workspaceRoot: string,
  extensionPath: string | undefined,
  onEvent: (event: DagRunEvent) => void,
  mcpClient: McpClientInstance | undefined,
  opts: {
    provider?: string;
    budget?: string;
    routeProfile?: string;
    history?: { role: string; text?: string; content?: string }[];
    token?: vscode.CancellationToken;
  } = {},
  channel?: { appendLine: (m: string) => void },
): Promise<void> {
  const log = channel ?? { appendLine: () => {} };
  let aiKitPath: string;
  try {
    aiKitPath = findAiKitBinary(workspaceRoot, extensionPath, log);
  } catch (err) {
    onEvent({ type: 'error', message: String(err) });
    return;
  }

  // Use `agent --run` for Rust CLI
  const args = ['agent', '--run', dagFile, '--json-ipc'];
  if (opts.routeProfile) {
    args.push('--route-profile', opts.routeProfile);
  }

  if (opts.history && opts.history.length > 0) {
    const historyPath = path.join(workspaceRoot, '.agencee', '.chat_history.json');
    try {
      if (!fs.existsSync(path.join(workspaceRoot, '.agencee'))) {
        fs.mkdirSync(path.join(workspaceRoot, '.agencee'), { recursive: true });
      }
      // Map 'text' or 'content' to 'content' to match Rust Message struct
      const mappedHistory = opts.history.map((h) => ({
        role: h.role,
        content: h.content || h.text,
      }));
      fs.writeFileSync(historyPath, JSON.stringify(mappedHistory, null, 2));
      // Note: We do not push --history-file to the Rust CLI as it is unsupported
    } catch (err) {
      log.appendLine(`[DagRunner] Failed to write history file: ${err}`);
    }
  }
  log.appendLine(`[DagRunner] spawn: ${aiKitPath} ${args.join(' ')}`);

  return new Promise<void>((resolve) => {
    const proc = spawn(aiKitPath, args, { cwd: workspaceRoot });
    activeProcess = proc;

    if (opts.token) {
      opts.token.onCancellationRequested(() => {
        log.appendLine('[DagRunner] Cancellation requested by user.');
        proc.kill('SIGTERM');
      });
    }

    // 1. Surveillance de la fermeture ou du crash du processus
    proc.on('exit', (code, signal) => {
      if ((code !== 0 && code !== null) || signal) {
        const circuitBreakerMsg = `[CRITICAL CIRCUIT BREAKER] Processus interrompu (Code: ${code}, Signal: ${signal})`;
        process.stderr.write(circuitBreakerMsg + '\n');
        log.appendLine(circuitBreakerMsg);

        // Signal cleanup of volatile cache to UI
        onEvent({ type: 'galileus:reset-state' } as any);

        onEvent({
          type: 'error',
          message: `CRITICAL CIRCUIT BREAKER: Le moteur d'exécution s'est arrêté subitement (Code: ${code}, Signal: ${signal}). Indexation RAG absente ou binaire invalide.`,
        });

        // Exception bloquante pour stopper toute génération à l'aveugle
        throw new Error(`Systemic failure detected: code ${code}`);
      }
    });

    // 2. Surveillance des erreurs système directes (ex: binaire introuvable, permissions)
    proc.on('error', (err) => {
      const circuitBreakerMsg = `[CRITICAL CIRCUIT BREAKER] Erreur fatale: ${err.message}`;
      process.stderr.write(circuitBreakerMsg + '\n');
      log.appendLine(circuitBreakerMsg);

      onEvent({ type: 'galileus:reset-state' } as any);
      onEvent({
        type: 'error',
        message: `Erreur d'infrastructure d'exécution : ${err.message}`,
      });
      throw new Error(`Infrastructure failure: ${err.message}`);
    });

    let heartbeatTimeout: NodeJS.Timeout | undefined;
    const TIMEOUT_DUREE = 45000; // 45 secondes de tolérance sans token

    const resetHeartbeat = () => {
      if (heartbeatTimeout) clearTimeout(heartbeatTimeout);
      heartbeatTimeout = setTimeout(() => {
        log.appendLine('[DagRunner] Watchdog : Aucun token reçu depuis 45s. Kill du processus.');
        proc.kill('SIGKILL'); // Force la fermeture du binaire bloqué
        onEvent({
          type: 'error',
          message:
            'Le modèle local ne répond plus (Timeout de garde de 45s atteint). Inférence interrompue.',
        });
      }, TIMEOUT_DUREE);
    };

    const rl = readline.createInterface({
      input: proc.stdout,
      terminal: false,
    });

    rl.on('line', (line) => {
      resetHeartbeat();
      const trimmed = line.trim();
      if (!trimmed) return;
      try {
        const event = JSON.parse(trimmed) as any;
        if (event && event.type === 'codernic:await-approval') {
          onEvent({
            type: 'codernic:await-approval',
            id: event.payload.id,
            prompt: event.payload.prompt,
          } as any);
        } else {
          onEvent(event);
        }

        // Relay to Atomos Structura MCP for visual progress
        if (
          event.type === 'lane-start' ||
          event.type === 'lane-end' ||
          (event.type as string) === 'agent-thinking-stream'
        ) {
          let status: 'pending' | 'running' | 'success' | 'failed' = 'running';

          if (event.type === 'lane-end') {
            status = event.status === 'success' ? 'success' : 'failed';
          }

          if (mcpClient) {
            callMcpTool(mcpClient, {
              name: 'atomos-structura/report-progress',
              arguments: {
                schema_id: 'codernic-execution-graph',
                node_id: (event as any).laneId,
                status: status,
                log_stream: (event as any).delta || '',
              },
            }).catch((err: any) => {
              log.appendLine(`[DagRunner] Failed to report progress to MCP: \${err}`);
            });
          }
        }
      } catch {
        log.appendLine(`[DagRunner] Unparseable: ${trimmed}`);
      }
    });

    proc.stderr.on('data', (chunk: Buffer) => {
      log.appendLine(`[DagRunner] stderr: ${chunk.toString().trim()}`);
    });

    proc.on('close', () => {
      if (heartbeatTimeout) clearTimeout(heartbeatTimeout);
      if (activeProcess === proc) activeProcess = null;
      resolve();
    });

    proc.on('error', (err) => {
      if (heartbeatTimeout) clearTimeout(heartbeatTimeout);
      if (activeProcess === proc) activeProcess = null;
      onEvent({ type: 'error', message: err.message });
      resolve();
    });
  });
}

/** Resolve a dag file path relative to the workspace */
export function resolveDagFile(spec: string | undefined, workspaceRoot: string): string {
  if (!spec) return path.join(workspaceRoot, '.agencee', 'config', 'agents', 'dag.json');
  // If spec looks like an absolute path use it as-is
  if (path.isAbsolute(spec)) return spec;
  // Relative to workspace root
  return path.join(workspaceRoot, spec);
}
