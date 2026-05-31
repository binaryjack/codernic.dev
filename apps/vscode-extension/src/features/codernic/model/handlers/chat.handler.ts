import * as vscode from 'vscode';
import { streamChat } from '../../../../shared/api/llm-utils';
import { AGENT_TOOLS } from '../../../../shared/api/workspace-tools';
import { clearSteps, loadManifest, saveManifest, type AnalyseProfile } from '../analyse-manifest';
import { runAnalysis } from '../analyse-runner';
import type { CodernicMode } from '../codernic-mode.types';
import { handleGalileusCommand } from '../galileus-handler';
import { detectIntent, getCommandHelp } from '../intent-detector';
import { CreateAgentIntent } from '../intents/create-agent.intent';
import { CreateDagIntent } from '../intents/create-dag.intent';
import { ListAgentsIntent } from '../intents/list-agents.intent';
import { RunDagIntent } from '../intents/run-dag.intent';
import { handleJourneyChat, handleJourneyReset } from '../journey-handler';
import { IntentRouter } from '../routers/intent-router';
import { saveSession } from '../session-memory';
import type { MessageContext } from '../types/message-context.types';
import type { MessageHandler } from '../types/message-handler.types';
import { loadSystemInstructions } from '../utils/load-system-instructions';

export const ChatHandler = function (this: MessageHandler): void {
  const intentRouter = new (IntentRouter as any)();
  intentRouter.register('create-agent', new (CreateAgentIntent as any)());
  intentRouter.register('create-dag', new (CreateDagIntent as any)());
  intentRouter.register('run-dag', new (RunDagIntent as any)());
  intentRouter.register('list-agents', new (ListAgentsIntent as any)());

  Object.defineProperty(this, 'intentRouter', {
    value: intentRouter,
    enumerable: false,
    writable: false,
  });
};

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
  const { llmId, history, mode, contextFiles } = payload as {
    llmId: string;
    history: { role: string; text: string }[];
    mode: CodernicMode;
    contextFiles?: any[];
  };

  const lastUser = [...history].reverse().find((h) => h.role === 'user');
  if (!lastUser) {
    reply({ type: 'codernic:error', payload: { message: 'No user message found' } });
    return;
  }

  const intent = detectIntent(lastUser.text, mode);

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

  if (intent) {
    if (intent.type === 'help') {
      reply({
        type: 'codernic:stream-chunk',
        payload: { chunk: getCommandHelp(mode), done: true },
      });
      return;
    }

    const handled = await this.intentRouter.dispatch(intent, mode, context, history, token);
    if (handled) return;
  }

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

  const systemInstructions = await loadSystemInstructions(workspaceRoot, mode);
  await streamChat(
    {
      type: 'codernic:chat',
      payload: { llmId, history, mode, systemContext: systemInstructions, contextFiles },
    },
    (event) => {
      if (event.type === 'ac:chat-token') {
        reply({
          type: 'codernic:stream-chunk',
          payload: { chunk: (event.payload as { chunk: string }).chunk },
        });
      } else {
        reply(event as { type: string; payload?: unknown });
      }
    },
    workspaceRoot,
    mode === 'agent' ? AGENT_TOOLS : undefined,
    extensionContext,
    channel as unknown as vscode.OutputChannel,
    undefined,
    mcpManager,
  );

  if (extensionContext) {
    saveSession(extensionContext, {
      timestamp: Date.now(),
      summary: lastUser.text.slice(0, 120),
      mode,
    }).catch(() => {});
  }
};
