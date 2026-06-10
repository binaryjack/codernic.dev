import * as fs from 'fs/promises';
import * as path from 'path';
import { gatherCodeContext } from '../../../../shared/api/context-gatherer';
import { streamChat } from '../../../../shared/api/llm-utils';
import { callMcpTool } from '../../../../shared/mcp';
import type { CodernicMode } from '../codernic-mode.types';
import type { MessageContext } from '../types/message-context.types';
import type { MessageHandler } from '../types/message-handler.types';
import { loadSystemInstructions } from '../utils/load-system-instructions';
import { serializeAndValidateDagPlan } from '../utils/serialize-dag-plan';

class PlanGenerationLifecycle {
  private state: 'IDLE' | 'GENERATING' | 'RESOLVING' | 'COMPLETED' | 'FAILED' = 'IDLE';
  private static transitionLock: Promise<void> = Promise.resolve();

  constructor(private broadcast: (event: any) => void) {}

  public async transition(nextState: typeof this.state): Promise<void> {
    this.state = nextState;
    await this.syncUI();
  }

  public getState() {
    return this.state;
  }

  private syncUI(): Promise<void> {
    return new Promise((resolve) => {
      PlanGenerationLifecycle.transitionLock = PlanGenerationLifecycle.transitionLock.then(async () => {
        try {
          this.broadcast({ type: "codernic:state-update", payload: { state: this.state } });
          // Slight delay to ensure atomic processing in UI and avoid concurrent burst races
          await new Promise(r => setTimeout(r, 10));
        } finally {
          resolve();
        }
      });
    });
  }
}

export const GenerateHandler = function (this: MessageHandler): void {};

GenerateHandler.prototype.handle = async function (
  this: MessageHandler,
  payload: unknown,
  context: MessageContext,
): Promise<void> {
  const { workspaceRoot, channel, reply, context: extensionContext, mcpManager } = context;
  let { task, mode, llmId, contextFiles } = payload as {
    task: string;
    mode: CodernicMode;
    llmId?: string;
    contextFiles?: any[];
  };

  task = task.replace(/^@codernic\s+/i, '').trim();
  
  if (task.startsWith('/plan ') || task === '/plan') {
    mode = 'plan';
    task = task.replace(/^\/plan\s*/i, '').trim();
  } else if (task.startsWith('/ask ') || task === '/ask') {
    mode = 'ask';
    task = task.replace(/^\/ask\s*/i, '').trim();
  } else if (task.startsWith('/agent ') || task === '/agent') {
    mode = 'agent';
    task = task.replace(/^\/agent\s*/i, '').trim();
  }

  if (!llmId) {
    reply({
      type: 'codernic:stream-chunk',
      payload: { chunk: '❌ No LLM selected. Please select a model from the dropdown.', done: true },
    });
    return;
  }

  channel.appendLine(
    `[Codernic] Generate plan: "${task.slice(0, 60)}" [LLM: ${llmId}]`,
  );

  // Opening status token — this starts the pending assistant message in the feed
  reply({
    type: 'codernic:stream-chunk',
    payload: { chunk: '🔍 Analysing task and querying codebase…\n\n' },
  });

  const lifecycle = new PlanGenerationLifecycle(reply);
  await lifecycle.transition('GENERATING');

  let planText = '';
  const startTime = Date.now();

  /** Algorithme d'extraction par accolades (Bracket Counter) */
  const extractFirstValidDagJson = (text: string): string | null => {
    let bracketCount = 0;
    let startIndex = -1;
    let inString = false;
    let escapeNext = false;

    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      if (escapeNext) {
        escapeNext = false;
        continue;
      }
      if (char === '\\') {
        escapeNext = true;
        continue;
      }
      if (char === '"') {
        inString = !inString;
        continue;
      }

      if (!inString) {
        if (char === '{') {
          if (bracketCount === 0) {
            startIndex = i;
          }
          bracketCount++;
        } else if (char === '}') {
          bracketCount--;
          if (bracketCount === 0 && startIndex !== -1) {
            const candidate = text.substring(startIndex, i + 1);
            if (candidate.includes('"lanes"') || candidate.includes('"capabilityRegistry"')) {
              return candidate;
            }
            // Reset for the next potential object
            startIndex = -1;
          }
        }
      }
    }
    return null;
  };

  try {
    // **IMPORTANT**: Gather codebase context via Ragtime RAG Engine BEFORE calling streamChat
    const topK = 100; // Plan mode default
    const searchQuery = task;
    let codeContext = '';
    const mcpInstance = mcpManager?.getClient();

    if (mcpInstance) {
      try {
        channel.appendLine(`[Codernic Webview Generate] Using MCP code-search-context for Ragtime RAG with query: "${searchQuery.slice(0, 50)}"`);
        const result = await callMcpTool(mcpInstance, {
          name: 'code-search-context',
          arguments: {
            query: searchQuery,
            conversationContext: '',
            projectRoot: workspaceRoot,
            topK,
          },
        });
        const textContent = (result.content || [])
          .filter((c: any) => c.type === 'text' && typeof c.text === 'string')
          .map((c: any) => c.text)
          .join('\n\n');
        codeContext = textContent;
      } catch (err) {
        const errMsg = err instanceof Error ? err.message : String(err);
        channel.appendLine(`[Codernic Webview Generate] Ragtime MCP failed: ${errMsg}, using VS Code fallback`);
        codeContext = await gatherCodeContext(searchQuery, '');
      }
    } else {
      channel.appendLine(`[Codernic Webview Generate] MCP not available, using VS Code fallback`);
      codeContext = await gatherCodeContext(searchQuery, '');
    }

    const systemInstructions = await loadSystemInstructions(workspaceRoot, 'plan');
    const systemContext = `${systemInstructions}\n\n` + 
      (codeContext
        ? `# Codebase Context (Ragtime Engine)\n\n${codeContext}\n\n---\n\n`
        : '⚠️ No codebase context available. Recommend running /index command first.\n\n');

    let currentTaskId: string | undefined;
    const streamChatFn: any = streamChat;
    await streamChatFn(
      {
        type: 'codernic:chat',
        payload: {
          llmId,
          systemContext,
          history: [
            {
              role: 'user',
              text: `Create a detailed implementation plan for the following task based on the system instructions. DO NOT execute any changes — describe them in structured markdown. If a DAG execution spec is needed, include it as a JSON code block.\n\n${task}`,
            },
          ],
          mode: 'plan',
          contextFiles,
        },
      },
      (event: any) => {
        if (event.type === 'ac:chat-token') {
          const chunk = (event.payload as { chunk: string }).chunk;
          const taskId = (event.payload as any).taskId;
          if (taskId) currentTaskId = taskId;
          planText += chunk;
          // Forward every token directly to the chat feed — no cutting, no filtering
          reply({ type: 'codernic:stream-chunk', payload: { chunk, taskId } });
        } else if (event.type === 'codernic:task-ready') {
          reply(event);
        } else if (event.type === 'codernic:thinking') {
          reply(event as { type: string; payload?: unknown });
        }
      },
      workspaceRoot,
      undefined,
      extensionContext,
      channel,
      undefined, // no external CTS — don't cut the stream early
      mcpManager,
    );

    if (!planText) {
      throw new Error('No plan returned from LLM.');
    }

    const duration = Date.now() - startTime;
    const isPlanMode = mode === 'plan' || task.includes('/plan');

    let extractedLanesCount = 1;
    await lifecycle.transition('RESOLVING');
    
    try {
      const candidate = extractFirstValidDagJson(planText);
      if (!candidate) {
        throw new Error('No valid DAG JSON found in the output using Bracket Counter.');
      }
      
      const cleanCandidate = candidate
        // eslint-disable-next-line no-control-regex
        .replace(/[\u0000-\u001F\u007F-\u009F]/g, '')
        .replace(/\/\/.*$/gm, '')
        .replace(/,(\s*[\]}])/g, '$1');

      const parsedDag = JSON.parse(cleanCandidate);

      if (parsedDag.globalBarriers && Array.isArray(parsedDag.globalBarriers)) {
        parsedDag.globalBarriers.forEach((barrier: any) => {
          if (!barrier.syncsLanes || !Array.isArray(barrier.syncsLanes)) {
            throw new Error("Validation failed: syncsLanes missing or invalid in globalBarrier");
          }
        });
      }

      if (!parsedDag.name) parsedDag.name = "Plan d'exécution automatique";
      extractedLanesCount = Array.isArray(parsedDag.lanes) ? parsedDag.lanes.length : 1;
      
      const dagPath = path.join(workspaceRoot, '.agencee', 'active-plan.dag.json');
      await fs.mkdir(path.dirname(dagPath), { recursive: true });
      await fs.writeFile(dagPath, JSON.stringify(parsedDag, null, 2), 'utf-8');
      
      await lifecycle.transition('COMPLETED');
    } catch (e) {
      channel.appendLine(`[GenerateHandler] DAG totally missing or error parsing: ${String(e)}, emitting fallback`);
      const fallbackDagPath = path.join(workspaceRoot, '.agencee', 'fallback-plan.dag.json');
      try {
        const fallbackDag = {
          name: "Plan de secours",
          description: "DAG généré automatiquement suite à un échec de parsing",
          lanes: [{ id: "default-lane", agentFile: "generic-agent.agent.json", dependsOn: [], capabilities: [] }],
          globalBarriers: [],
          capabilityRegistry: {}
        };
        extractedLanesCount = 1;
        await fs.mkdir(path.dirname(fallbackDagPath), { recursive: true });
        await fs.writeFile(fallbackDagPath, JSON.stringify(fallbackDag, null, 2), 'utf-8');
      } catch (fallbackErr) {
        channel.appendLine(`[GenerateHandler] Could not write fallback DAG: ${String(fallbackErr)}`);
      }
      lifecycle.transition('FAILED'); // Not awaiting here to avoid blocking fallback
    } finally {
      if (lifecycle.getState() !== 'COMPLETED' && lifecycle.getState() !== 'FAILED') {
        await lifecycle.transition('FAILED');
      }
      
      console.log("[DEBUG] Déclenchement de la trame cost-preview");
      reply({
        type: 'codernic:cost-preview',
        payload: {
          task,
          plan: planText || 'Plan généré avec structure dégradée',
          cost: '$0.0000',
          duration: `${(duration / 1000).toFixed(1)}s`,
          mode,
          laneCount: extractedLanesCount,
          taskId: currentTaskId || "task_fallback",
        },
      });

      reply({ type: 'ac:ui-unlock' });
      reply({ type: 'ac:chat-done' });
    }

  } catch (err) {
    if (lifecycle.getState() !== 'FAILED') {
      await lifecycle.transition('FAILED');
    }
    const errMsg = err instanceof Error ? err.message : String(err);
    reply({ type: 'ac:chat-done' });
    reply({ type: 'codernic:stream-chunk', payload: { chunk: `\n\n❌ ${errMsg}`, done: true } });
  }
};
