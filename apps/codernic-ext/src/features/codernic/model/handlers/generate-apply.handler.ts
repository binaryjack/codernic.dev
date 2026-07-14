import { streamChat } from '../../../../shared/api/llm-utils';
import { AGENT_TOOLS } from '../../../../shared/api/workspace-tools';
import type { CodernicMode } from '../codernic-mode.types';
import type { MessageContext } from '../types/message-context.types';
import type { MessageHandler } from '../types/message-handler.types';
import { loadSystemInstructions } from '../utils/load-system-instructions';

export const GenerateApplyHandler = function (this: MessageHandler): void {};

GenerateApplyHandler.prototype.handle = async function (
  this: MessageHandler,
  payload: unknown,
  context: MessageContext,
): Promise<void> {
  const { workspaceRoot, reply, channel, context: extensionContext } = context;
  const { task, mode, llmId } = payload as { task: string; mode: CodernicMode; llmId?: string };

  if (!llmId) {
    reply({
      type: 'codernic:stream-chunk',
      payload: { chunk: '❌ No LLM selected.', done: true },
    });
    return;
  }

  channel.appendLine(
    `[Codernic] Applying changes (via streamChat Agent): "${task.slice(0, 60)}" [LLM: ${llmId}]`,
  );
  reply({
    type: 'codernic:stream-chunk',
    payload: { chunk: '⚙️ Executing implementation...' },
  });

  const startTime = Date.now();

  try {
    const systemContext = await loadSystemInstructions(workspaceRoot, 'agent');

    await streamChat(
      {
        type: 'codernic:chat',
        payload: {
          llmId,
          systemContext,
          history: [
            {
              role: 'user',
              text: `Execute the following task by applying changes to the codebase based on the system instructions. Use tools to create or modify files:\n\n${task}`,
            },
          ],
          mode: 'agent',
        },
      },
      (event) => {
        if (event.type === 'ac:chat-token') {
          reply({
            type: 'codernic:stream-chunk',
            payload: {
              chunk: (event.payload as { chunk: string }).chunk,
              taskId: (event.payload as Record<string, unknown>).taskId
            },
          });
        } else if (event.type === 'codernic:task-ready') {
          reply(event);
        } else if (event.type === 'codernic:thinking') {
          reply(event as { type: string; payload?: unknown });
        } else if (event.type === 'ac:chat-done') {
          const duration = Date.now() - startTime;
          reply({
            type: 'codernic:stream-chunk',
            payload: {
              chunk: `\n\n✅ **Changes Applied** (Duration: ${(duration / 1000).toFixed(1)}s)`,
              done: true,
            },
          });
        } else if (event.type === 'ac:chat-error') {
          reply({
            type: 'codernic:stream-chunk',
            payload: { chunk: `❌ Error: ${(event.payload as { text: string }).text}`, done: true },
          });
        }
      },
      workspaceRoot,
      AGENT_TOOLS,
      extensionContext,
      channel as any,
    );
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : String(err);
    reply({ type: 'codernic:stream-chunk', payload: { chunk: `❌ ${errMsg}`, done: true } });
  }
};
