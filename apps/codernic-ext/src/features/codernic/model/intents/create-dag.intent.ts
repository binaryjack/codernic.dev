import * as fs from 'fs/promises';
import * as path from 'path';
import * as vscode from 'vscode';
import type { CodernicMode } from '../codernic-mode.types';
import type { CodernicIntent } from '../intent-detector';
import type { IntentHandler } from '../types/intent-handler.types';
import type { MessageContext } from '../types/message-context.types';

export const CreateDagIntent = function (this: IntentHandler): void {};

CreateDagIntent.prototype.handle = async function (
  this: IntentHandler,
  intent: CodernicIntent,
  mode: CodernicMode,
  context: MessageContext,
  history?: { role: string; text: string }[],
  token?: vscode.CancellationToken,
): Promise<boolean> {
  const { workspaceRoot, reply, channel } = context;

  if (mode === 'plan') {
    const planText = `📋 **Plan Mode — Command Preview**\n\n**Detected command:** \`create-dag\`\n**Specification:** ${intent.spec || '(none)'}\n\n**What would happen in Agent mode:**\n1. Create new DAG workflow in \`.agencee/config/agents/\`\n2. Parse workflow name from: "${intent.spec}"\n3. Generate \`dag.json\` with empty lanes (you'll add agents manually)\n\n💡 **Switch to Agent mode** to execute commands.`;
    reply({ type: 'codernic:stream-chunk', payload: { chunk: planText, done: true } });
    return true;
  }

  const spec = intent.spec.trim() || 'my-workflow';
  const slug = spec
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  const agentsDir = path.join(workspaceRoot, '.agencee', 'config', 'agents');
  const destFile = path.join(agentsDir, `${slug}.dag.json`);

  try {
    await fs.access(destFile);
    reply({
      type: 'codernic:stream-chunk',
      payload: {
        chunk: `⚠️ DAG already exists: \`.agencee/config/agents/${slug}.dag.json\`\n\nDelete it first or choose a different name.`,
        done: true,
      },
    });
    return true;
  } catch {
    /* expected */
  }

  const dagJson = {
    $schema:
      'https://raw.githubusercontent.com/binaryjack/ai-agencee-ressources/main/schemas/dag.schema.json',
    name: spec,
    description: `Multi-agent workflow: ${spec}`,
    lanes: [
      {
        id: 'lane-1',
        agentFile: 'new-agent.agent.json',
        dependsOn: [],
        capabilities: ['default'],
      },
    ],
    budget: { maxUSD: 0.5 },
    modelRouterFile: 'model-router.json',
  };
  await fs.mkdir(agentsDir, { recursive: true });
  await fs.writeFile(destFile, JSON.stringify(dagJson, null, 2) + '\n', 'utf-8');
  channel.appendLine(`[Codernic] Created DAG: ${destFile}`);

  reply({
    type: 'codernic:stream-chunk',
    payload: {
      chunk:
        '✅ **DAG created:** `.agencee/config/agents/' +
        slug +
        '.dag.json`' +
        '\n\n' +
        '```json\n' +
        JSON.stringify(dagJson, null, 2) +
        '\n```\n\n' +
        '💡 Update `agentFile` in each lane to point to your agents. Then run with `/run-dag ' +
        slug +
        '`.',
      done: true,
    },
  });
  return true;
};
