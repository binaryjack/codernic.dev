import * as path from 'path';
import * as vscode from 'vscode';
import { streamChat } from '../../../../shared/api/llm-utils';
import type { CodernicMode } from '../codernic-mode.types';
import type { MessageContext } from '../types/message-context.types';
import type { MessageHandler } from '../types/message-handler.types';
import { loadSystemInstructions } from '../utils/load-system-instructions';
import { serializeAndValidateDagPlan } from '../utils/serialize-dag-plan';

export const GenerateHandler = function (this: MessageHandler): void {};

GenerateHandler.prototype.handle = async function (
  this: MessageHandler,
  payload: unknown,
  context: MessageContext,
): Promise<void> {
  const { workspaceRoot, channel, reply, context: extensionContext, mcpManager } = context;
  const { task, mode, llmId, contextFiles } = payload as {
    task: string;
    mode: CodernicMode;
    llmId?: string;
    contextFiles?: any[];
  };

  if (!llmId) {
    reply({
      type: 'codernic:stream-chunk',
      payload: {
        chunk: '❌ No LLM selected. Please select a model from the dropdown.',
        done: true,
      },
    });
    return;
  }

  channel.appendLine(
    `[Codernic] Generate plan (via streamChat): "${task.slice(0, 60)}" [LLM: ${llmId}]`,
  );
  reply({
    type: 'codernic:stream-chunk',
    payload: { chunk: '🔍 Analysing task and querying codebase…\n\n' },
  });

  let planText = '';
  const startTime = Date.now();
  const streamController = new vscode.CancellationTokenSource();

  const processAndSerializeDag = async (plan: string) => {
    try {
      const dagPath = path.join(
        workspaceRoot,
        '.agencee',
        'config',
        'agents',
        'auto-plan.dag.json',
      );
      await serializeAndValidateDagPlan(plan, dagPath, channel);
      channel.appendLine(`[STREAM-GUARD] Plan sérialisé avec succès : ${dagPath}`);
    } catch (err) {
      channel.appendLine(`[STREAM-GUARD] Erreur de sérialisation : ${String(err)}`);
    }
  };

  try {
    const systemContext = await loadSystemInstructions(workspaceRoot, 'plan');

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
              text: `Create a implementation plan for the following task based on the system instructions. DO NOT execute any changes, just describe them in markdown:\n\n${task}`,
            },
          ],
          mode: 'plan',
          contextFiles,
        },
      },
      (event: any) => {
        if (event.type === 'ac:chat-token') {
          const chunk = (event.payload as { chunk: string }).chunk;
          planText += chunk;

          const trimmedBuffer = planText.trim();

          // 🛡️ GARDE-FOU DUAL-FORMAT : Détection d'un bloc de code JSON encapsulé (```json ... ```)
          if (trimmedBuffer.includes('```json') && trimmedBuffer.endsWith('```')) {
            const match = trimmedBuffer.match(/```json([\s\S]*?)```/);

            if (match && match[1]) {
              try {
                // Nettoyage de sécurité avant parsing
                const testJson = match[1]
                  // eslint-disable-next-line no-control-regex
                  .replace(/[\u0000-\u001F\u007F-\u009F]/g, '')
                  .replace(/,(\s*[\]}])/g, '$1')
                  .trim();

                JSON.parse(testJson); // Test de validité structurelle

                channel.appendLine(
                  '[STREAM-GUARD] Bloc JSON valide détecté dans le Markdown. Coupure du flux.',
                );
                streamController.cancel();
                processAndSerializeDag(planText);
                return;
              } catch (e) {
                // Bloc encore incomplet (le LLM est en train d'écrire les backticks ou le JSON)
              }
            }
          }

          // 🛡️ FALLBACK : Au cas où le LLM recrache uniquement du JSON pur comme avant
          if (trimmedBuffer.startsWith('{') && trimmedBuffer.endsWith('}')) {
            try {
              JSON.parse(trimmedBuffer.replace(/,(\s*[\]}])/g, '$1'));
              channel.appendLine(
                '[STREAM-GUARD] JSON global complet détecté. Interruption propre du flux.',
              );
              streamController.cancel();
              processAndSerializeDag(planText);
              return;
            } catch (e) {
              // JSON incomplet
            }
          }

          reply({
            type: 'codernic:stream-chunk',
            payload: { chunk },
          });
        } else if (event.type === 'codernic:thinking') {
          reply(event as { type: string; payload?: unknown });
        }
      },
      workspaceRoot,
      undefined,
      extensionContext,
      channel,
      streamController,
      mcpManager,
    );

    const duration = Date.now() - startTime;

    if (!planText) {
      throw new Error('No plan returned from LLM.');
    }

    reply({
      type: 'codernic:cost-preview',
      payload: {
        task,
        plan: planText,
        cost: '$0.0000',
        duration: `${(duration / 1000).toFixed(1)}s`,
        mode,
      },
    });
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : String(err);
    reply({ type: 'codernic:stream-chunk', payload: { chunk: `❌ ${errMsg}`, done: true } });
  }
};
