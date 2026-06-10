import * as net from 'net';
import * as os from 'os';
import * as path from 'path';
import * as readline from 'readline';
import * as vscode from 'vscode';
import { clearSteps, loadManifest, saveManifest, type AnalyseProfile } from '../analyse-manifest';
import { runAnalysis } from '../analyse-runner';
import type { CodernicMode } from '../codernic-mode.types';
import { executeCommand } from '../execute-command';
import { handleGalileusCommand } from '../galileus-handler';
import { detectIntent, getCommandHelp } from '../intent-detector';
import { handleJourneyChat, handleJourneyReset } from '../journey-handler';
import { saveSession } from '../session-memory';
import type { MessageContext } from '../types/message-context.types';
import type { MessageHandler } from '../types/message-handler.types';
import { CliProcessManager } from '../cli-process-manager';

export let activeChatManager: CliProcessManager | null = null;

export const ChatHandler = function (this: MessageHandler): void {};

ChatHandler.prototype.handle = async function (
  this: { intentRouter: any } & MessageHandler,
  payload: unknown,
  context: MessageContext,
): Promise<void> {
  const {
    workspaceRoot,
    reply,
    channel,
    workspaceState,
    extensionPath,
    context: extensionContext,
    mcpManager,
    token,
  } = context;
  if (!payload || typeof payload !== 'object') {
    reply({ type: 'codernic:error', payload: { message: 'Invalid or missing payload' } });
    return;
  }

  const { llmId, history, mode, contextFiles, routeProfile, sessionId: payloadSessionId } = payload as {
    llmId: string;
    history: { role: string; text: string }[];
    mode: CodernicMode;
    contextFiles?: any[];
    routeProfile?: string;
    sessionId?: string;
  };

  if (!history || !Array.isArray(history)) {
    reply({ type: 'codernic:error', payload: { message: 'Invalid or missing history' } });
    return;
  }

  const lastUser = [...history].reverse().find((h) => h.role === 'user');
  if (!lastUser) {
    reply({ type: 'codernic:error', payload: { message: 'No user message found' } });
    return;
  }
  const intent = detectIntent(lastUser.text, mode);

  if (intent?.type === 'read-project-memory' || intent?.type === 'write-project-memory') {
    reply({
      type: 'codernic:stream-chunk',
      payload: { chunk: '📂 Processing project memory…\n\n' },
    });
    const result = await executeCommand(
      mcpManager?.getClient() ?? null,
      intent,
      workspaceRoot,
      channel,
    );
    reply({ type: 'codernic:stream-chunk', payload: { chunk: result, done: true } });
    return;
  }

  if (intent?.type === 'index') {
    reply({ type: 'codernic:stream-chunk', payload: { chunk: '🔍 Indexing codebase…' } });
    await vscode.commands.executeCommand('ai-agencee.code.index');
    reply({
      type: 'codernic:stream-chunk',
      payload: { chunk: '✅ Index started — watch the status bar for progress.', done: true },
    });
    return;
  }

  if (intent?.type === 'journey') {
    if (!workspaceState || !extensionPath) {
      reply({
        type: 'codernic:stream-chunk',
        payload: {
          chunk: '⚠️ Journey mode requires workspace state. Please reload VS Code.',
          done: true,
        },
      });
      return;
    }
    reply({ type: 'codernic:journey-mode-start', payload: {} });
    return;
  }

  if (intent?.type === 'journey-reset') {
    if (workspaceState) {
      await handleJourneyReset(workspaceState as vscode.ExtensionContext['workspaceState'], (l) =>
        channel.appendLine(l),
      );
    }
    reply({
      type: 'codernic:stream-chunk',
      payload: {
        chunk: '🗺️ Journey state cleared. Start fresh with `/journey` or switch to Journey mode.',
        done: true,
      },
    });
    return;
  }

  if (intent?.type === 'galileus') {
    const mcpInstance = mcpManager?.getClient();
    if (!mcpInstance) {
      reply({
        type: 'codernic:stream-chunk',
        payload: {
          chunk:
            '⊙ **Galileus** — MCP server not connected.\n\nEnsure the AI Agencee MCP server is running and reload VS Code.',
          done: true,
        },
      });
      return;
    }
    await handleGalileusCommand(intent.spec, mcpInstance, reply, channel);
    return;
  }

  if (
    intent?.type === 'analyse' ||
    intent?.type === 'analyse-force' ||
    intent?.type === 'analyse-force-section'
  ) {
    const profileFlag = intent.spec.match(/--profile\s+(starter|standard|enterprise)/i);
    const profile: AnalyseProfile = (profileFlag?.[1] as AnalyseProfile) ?? 'standard';
    const force = intent.type === 'analyse-force';
    const forceSection = intent.type === 'analyse-force-section' ? intent.forceSection : undefined;

    if (force || forceSection) {
      const manifest = await loadManifest(workspaceRoot);
      let cleared;
      if (force) {
        cleared = clearSteps(manifest, 'all');
      } else if (forceSection === 'agents') {
        cleared = clearSteps(manifest, ['agent-generation']);
      } else if (forceSection === 'tech') {
        cleared = clearSteps(manifest, ['tech-identification']);
      } else if (forceSection === 'conventions') {
        cleared = clearSteps(manifest, ['convention-mining']);
      } else {
        cleared = manifest;
      }
      await saveManifest(workspaceRoot, cleared);
    }

    reply({ type: 'codernic:analyse-started', payload: { profile } });
    try {
      await runAnalysis({
        profile,
        llmId,
        workspaceRoot,
        extensionPath: extensionPath ?? '',
        onProgress: (p) => reply({ type: 'codernic:analyse-progress', payload: p }),
        onLog: (l) => channel.appendLine(l),
      });
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err);
      reply({
        type: 'codernic:analyse-progress',
        payload: {
          steps: {
            'tech-identification': 'error',
            'convention-mining': 'error',
            'agent-generation': 'error',
          },
          currentStep: null,
          totalCostUSD: 0,
          errorMessage: errMsg,
        },
      });
    }
    return;
  }

  if (intent?.type === 'help') {
    reply({
      type: 'codernic:stream-chunk',
      payload: { chunk: getCommandHelp(mode), done: true },
    });
    return;
  }

  // Journey mode check
  if (mode === 'journey') {
    if (!workspaceState || !extensionPath) {
      reply({
        type: 'codernic:error',
        payload: { message: 'Journey mode requires workspace state and extension path.' },
      });
      return;
    }
    await handleJourneyChat({
      llmId,
      workspaceRoot,
      workspaceState: workspaceState as vscode.ExtensionContext['workspaceState'],
      extensionPath,
      history,
      onEvent: (event) => {
        if (event.type === 'token')
          reply({ type: 'ac:chat-token', payload: { chunk: event.chunk } });
        else if (event.type === 'thinking')
          reply({
            type: 'codernic:thinking',
            payload: { phase: event.phase, detail: event.detail },
          });
        else if (event.type === 'phase-gate')
          reply({
            type: 'codernic:journey-phase-gate',
            payload: { phase: event.phase, summary: event.summary },
          });
        else if (event.type === 'done') reply({ type: 'ac:chat-done' });
        else if (event.type === 'error')
          reply({ type: 'ac:chat-error', payload: { text: event.message } });
      },
      onLog: (l) => channel.appendLine(l),
    });
    return;
  }

  // --- Backend-Driven Architecture ---
  // Forward Chat payload to the Rust CLI via CliProcessManager
  // The CLI handles mode transition, intent routing, state, and RAG.

  let sanitizedLlmId = llmId;
  const match = sanitizedLlmId.match(/^custom:[^:]+:(custom:.*)$/);
  if (match) {
    sanitizedLlmId = match[1];
  }

  const sessionId = payloadSessionId || workspaceRoot.split(path.sep).pop() || 'default-session';
  const useRag = (payload as any).useRag ?? true;
  const isYolo = (payload as any).yolo === true;

  return new Promise<void>((resolve, reject) => {
    let isDone = false;
    let cliManager: CliProcessManager | null = null;

    const cleanup = () => {
      if (!isDone) {
        isDone = true;
        reply({ type: 'ac:chat-done' });
        resolve();
      }
      if (cliManager) {
        cliManager.dispose();
      }
    };

    cliManager = new CliProcessManager(
      workspaceRoot,
      (response) => {
        activeChatManager = cliManager;
        // Here response can be an explicit `codernic:*` or `ac:*` type, or an inference chunk
        if (response.type) {
          if (response.type === 'codernic:mode-transition') {
            const { from, to, reason } = response.payload;
            channel.appendLine(`[Codernic] Mode transition from backend: ${from} -> ${to}`);
            reply(response);
            if (extensionContext) {
              saveSession(extensionContext, {
                timestamp: Date.now(),
                summary: lastUser.text.slice(0, 120),
                mode: to as CodernicMode,
              }).catch(() => {});
            }
          } else if (response.type === 'codernic:await-approval') {
            // Forward approval request to UI
            reply(response);
          } else if (response.type === 'ac:chat-done') {
            cleanup();
          } else if (response.type === 'ac:chat-error') {
            reply(response);
          } else {
            // Forward any other properly typed messages
            reply(response);
          }
        } else if (response.ModeTransition) {
          // Fallback parsing just in case
          reply({
            type: 'codernic:mode-transition',
            payload: {
              from: response.ModeTransition.from,
              to: response.ModeTransition.to,
              reason: response.ModeTransition.reason,
            },
          });
        } else if (response.RequestToolApproval) {
          reply({
            type: 'codernic:await-approval',
            payload: {
              id: response.RequestToolApproval.request_id,
              prompt: `Codernic wants to use tool: ${response.RequestToolApproval.tool_name}`
            }
          });
        }
      },
      (err) => {
        reply({ type: 'ac:chat-error', payload: { text: `CLI Error: ${err}` } });
      },
      (code) => {
        if (!isDone) {
          reply({ type: 'ac:chat-error', payload: { text: `CLI Exited with code ${code}` } });
          cleanup();
        }
      }
    );

    token?.onCancellationRequested(() => {
      cleanup();
      reject(new Error('Cancelled by user'));
    });

    const args = ['chat', '--session', sessionId, '--json-ipc'];
    if (mode) {
      args.push('--mode', mode);
    }
    if (sanitizedLlmId) {
      args.push('--llm-id', sanitizedLlmId);
    }
    if (routeProfile) {
      args.push('--route-profile', routeProfile);
    }
    if (!useRag) {
      args.push('--no-rag');
    }
    if (isYolo) {
      args.push('--yolo');
    }
    cliManager.spawn(args);

    // Provide the initial prompt via stdin JSON payload
    cliManager.write({ payload: lastUser.text });
  });
};
