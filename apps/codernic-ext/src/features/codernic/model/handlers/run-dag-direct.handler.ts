import * as path from 'path';
import { RunDagIntent } from '../intents/run-dag.intent';
import type { MessageContext } from '../types/message-context.types';
import type { MessageHandler } from '../types/message-handler.types';
import { serializeAndValidateDagPlan } from '../utils/serialize-dag-plan';

export const RunDagDirectHandler = function (this: MessageHandler): void {};

RunDagDirectHandler.prototype.handle = async function (
  this: MessageHandler,
  payload: unknown,
  context: MessageContext,
): Promise<void> {
  const { workspaceRoot, reply, channel } = context;
  const { plan } = payload as { plan: string; task: string };

  try {
    const dagPath = path.join(workspaceRoot, '.agencee', 'config', 'agents', 'auto-plan.dag.json');
    await serializeAndValidateDagPlan(plan, dagPath, channel);
    channel.appendLine(`[Codernic] Auto-plan serialized to: ${dagPath}`);

    // IMMEDIATELY let the UI know the DAG was accepted and is spinning up
    reply({
      type: 'codernic:stream-chunk',
      payload: {
        chunk: '\n\n🚀 **Agent Mode Activated**\nExecuting generated implementation plan...',
        done: true,
      },
    });

    const runDagIntent = new (RunDagIntent as any)();
    await runDagIntent.handle(
      { type: 'run-dag', spec: '.agencee/config/agents/auto-plan.dag.json' },
      'agent',
      context,
    );
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : String(err);
    reply({ type: 'codernic:error', payload: { message: `Failed to apply plan: ${errMsg}` } });
  }
};
