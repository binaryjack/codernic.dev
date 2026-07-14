import * as net from 'net';
import * as os from 'os';
import * as fs from 'fs';
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

export const activeChatManagers = new Map<string, CliProcessManager>();

export const ChatHandler = function (this: MessageHandler): void {};

ChatHandler.prototype.handle = async function (
  this: { intentRouter: unknown } & MessageHandler,
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

  const { llmId, history, mode, contextFiles, sessionId: payloadSessionId } = payload as {
    llmId: string;
    history: { role: string; text: string }[];
    mode: CodernicMode;
    contextFiles?: unknown[];
    sessionId?: string;
  };

  const routeProfile = workspaceState ? workspaceState.get<string>('agencee.routeProfile') || 'default' : 'default';

  const sessionId = payloadSessionId || workspaceRoot.split(path.sep).pop() || 'default-session';

  try {
    const sessionDirUri = vscode.Uri.file(path.join(workspaceRoot, '.codernic', 'sessions'));
    try {
      await vscode.workspace.fs.stat(sessionDirUri);
    } catch {
      await vscode.workspace.fs.createDirectory(sessionDirUri);
    }
    const sessionFileUri = vscode.Uri.joinPath(sessionDirUri, `${sessionId}.json`);
    try {
      await vscode.workspace.fs.stat(sessionFileUri);
    } catch {
      const now = new Date();
      const summary = history.find((h) => h.role === 'user')?.text.split(' ').slice(0, 5).join(' ') || 'New Session';
      const datePrefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      
      const sessionData = JSON.stringify({
        id: sessionId,
        name: `${datePrefix} - ${summary}`,
        status: 'idle',
        last_updated: Math.floor(Date.now() / 1000),
        history: [],
        current_mode: mode || 'brainstorm',
      }, null, 2);
      
      await vscode.workspace.fs.writeFile(sessionFileUri, new TextEncoder().encode(sessionData));
    }
  } catch (err) {
    console.error('Failed to pre-create session file:', err);
  }

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

    reply({ type: 'codernic:analyse-started', payload: { profile, sessionId } });
    reply({ type: 'codernic:session-status', payload: { sessionId, status: 'running' } });
    try {
      await runAnalysis({
        profile,
        llmId,
        workspaceRoot,
        extensionPath: extensionPath ?? '',
        onProgress: (p) => reply({ type: 'codernic:analyse-progress', payload: { ...p, sessionId } }),
        onLog: (l) => channel.appendLine(l),
      });
      reply({ type: 'codernic:session-status', payload: { sessionId, status: 'success' } });
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err);
      reply({
        type: 'codernic:analyse-progress',
        payload: {
          sessionId,
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
      reply({ type: 'codernic:session-status', payload: { sessionId, status: 'error' } });
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

  const useRag = (payload as { useRag?: boolean }).useRag ?? true;
  const isYolo = (payload as { yolo?: boolean }).yolo === true;

  // --- VS Code Native Interception (GitHub Copilot) ---
  if (!llmId.startsWith('custom:')) {
    reply({ type: 'codernic:stream-chunk', payload: { chunk: '🤖 Using GitHub Copilot (VS Code Native)...\n\n', sessionId } });
    reply({ type: 'codernic:session-status', payload: { sessionId, status: 'running' } });
    
    return new Promise<void>((resolve) => {
      (async () => {
        try {
          const models = await vscode.lm.selectChatModels();
          const targetModel = models.find(m => m.id === llmId) || models.find(m => m.vendor === 'copilot');
          
          if (!targetModel) {
            reply({ type: 'ac:chat-error', payload: { text: `GitHub Copilot model '${llmId}' not found in VS Code. Please ensure Copilot is installed and authenticated.` } });
            resolve();
            return;
          }

          const chatMessages = [
            vscode.LanguageModelChatMessage.User(`Tu es un assistant IA ultra-factuel intégré à Codernic. Réponds de manière claire et concise sans halluciner.`),
            ...history.map((h) =>
              h.role === 'user'
                ? vscode.LanguageModelChatMessage.User(h.text)
                : vscode.LanguageModelChatMessage.Assistant(h.text),
            ),
          ];
          
          const response = await models[0].sendRequest(chatMessages, {}, token);
          
          for await (const chunk of response.text) {
            reply({ type: 'ac:chat-token', payload: { chunk, sessionId } });
          }
          reply({ type: 'ac:chat-done', payload: { sessionId } });
          reply({ type: 'codernic:session-status', payload: { sessionId, status: 'success' } });
          resolve();
        } catch (err) {
          reply({ type: 'ac:chat-error', payload: { text: `Copilot error: ${err instanceof Error ? err.message : String(err)}`, sessionId } });
          reply({ type: 'codernic:session-status', payload: { sessionId, status: 'error' } });
          resolve();
        }
      })();
    });
  }

  return new Promise<void>((resolve, reject) => {
    let isDone = false;
    let cliManager: CliProcessManager | null = null;

    const cleanup = (status: 'success' | 'error' = 'success') => {
      if (!isDone) {
        isDone = true;
        reply({ type: 'ac:chat-done', payload: { sessionId } });
        reply({ type: 'codernic:session-status', payload: { sessionId, status } });
        resolve();
      }
      if (cliManager) {
        activeChatManagers.delete(sessionId);
        cliManager.dispose();
      }
    };

    reply({ type: 'codernic:session-status', payload: { sessionId, status: 'running' } });

    cliManager = new CliProcessManager(
      workspaceRoot,
      (response) => {
        activeChatManagers.set(sessionId, cliManager!);
        
        const injectSessionId = (res: Record<string, unknown> & { payload?: Record<string, unknown>, type?: string }) => {
          if (res.payload) {
            res.payload.sessionId = sessionId;
          } else {
            res.payload = { sessionId };
          }
          return res as Record<string, unknown> & { type: string, payload?: unknown };
        };

        if (response.type) {
          if (response.type === 'codernic:mode-transition') {
            const { from, to, reason } = response.payload;
            channel.appendLine(`[Codernic] Mode transition from backend: ${from} -> ${to}`);
            reply(injectSessionId(response));
            if (extensionContext) {
              saveSession(extensionContext, {
                timestamp: Date.now(),
                summary: lastUser.text.slice(0, 120),
                mode: to as CodernicMode,
              }).catch(() => {});
            }
          } else if (response.type === 'codernic:await-approval') {
            reply(injectSessionId(response));
          } else if (response.type === 'ac:chat-done') {
            cleanup('success');
          } else if (response.type === 'ac:chat-error') {
            reply(injectSessionId(response));
            cleanup('error');
          } else {
            reply(injectSessionId(response));
          }
        } else if (response.ModeTransition) {
          reply(injectSessionId({
            type: 'codernic:mode-transition',
            payload: {
              from: response.ModeTransition.from,
              to: response.ModeTransition.to,
              reason: response.ModeTransition.reason,
            },
          }));
        } else if (response.ToolCall) {
          reply(injectSessionId({
            type: 'codernic:tool-call',
            payload: {
              name: response.ToolCall.name,
              arguments: response.ToolCall.arguments,
            }
          }));
        } else if (response.ToolResponse) {
          reply(injectSessionId({
            type: 'tool-response',
            payload: {
              name: response.ToolResponse.name,
              result: response.ToolResponse.result,
            }
          }));
        } else if (response.RequestToolApproval) {
          reply(injectSessionId({
            type: 'codernic:await-approval',
            payload: {
              id: response.RequestToolApproval.request_id,
              prompt: `Codernic wants to use tool: ${response.RequestToolApproval.tool_name}`
            }
          }));
        } else if (response.Error) {
          reply(injectSessionId({
            type: 'ac:chat-error',
            payload: {
              text: response.Error,
            }
          }));
          cleanup('error');
        }
      },
      (err) => {
        reply({ type: 'ac:chat-error', payload: { text: `CLI Error: ${err}`, sessionId } });
        cleanup('error');
      },
      (code) => {
        if (!isDone) {
          reply({ type: 'ac:chat-error', payload: { text: `CLI Exited with code ${code}`, sessionId } });
          cleanup(code === 0 ? 'success' : 'error');
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
