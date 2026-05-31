import * as fs from 'fs/promises';
import * as path from 'path';
import * as vscode from 'vscode';
import type { CodernicMode } from '../codernic-mode.types';
import type { CodernicIntent } from '../intent-detector';
import type { IntentHandler } from '../types/intent-handler.types';
import type { MessageContext } from '../types/message-context.types';

export const CreateAgentIntent = function (this: IntentHandler): void {};

CreateAgentIntent.prototype.handle = async function (
  this: IntentHandler,
  intent: CodernicIntent,
  mode: CodernicMode,
  context: MessageContext,
  history?: { role: string; text: string }[],
  token?: vscode.CancellationToken,
): Promise<boolean> {
  const { workspaceRoot, reply, channel } = context;

  if (mode === 'plan') {
    const planText = `📋 **Plan Mode — Command Preview**\n\n**Detected command:** \`create-agent\`\n**Specification:** ${intent.spec || '(none)'}\n\n**What would happen in Agent mode:**\n1. Create new agent configuration in \`.agents/\` directory\n2. Parse agent name and role from: "${intent.spec}"\n3. Generate \`.agent.json\` file with checks array\n\n💡 **Switch to Agent mode** to execute commands.`;
    reply({ type: 'codernic:stream-chunk', payload: { chunk: planText, done: true } });
    return true;
  }

  const spec = intent.spec.trim() || 'my-agent';
  const slug = spec
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  const agentsDir = path.join(workspaceRoot, '.agencee', 'config', 'agents');
  const destFile = path.join(agentsDir, `${slug}.agent.json`);

  try {
    await fs.access(destFile);
    reply({
      type: 'codernic:stream-chunk',
      payload: {
        chunk: `⚠️ Agent already exists: \`.agencee/config/agents/${slug}.agent.json\`\n\nDelete it first or choose a different name.`,
        done: true,
      },
    });
    return true;
  } catch {
    /* expected */
  }

  const agentJson = {
    $schema:
      'https://raw.githubusercontent.com/binaryjack/ai-agencee-ressources/main/schemas/agent.schema.json',
    name: spec,
    description: `AI agent: ${spec}`,
    icon: '🤖',
    role: `You are a ${spec}. Analyse the provided context and produce high-quality output.`,
    taskType: 'code-generation',
    maxRetries: 2,
    checks: [],
  };
  await fs.mkdir(agentsDir, { recursive: true });
  await fs.writeFile(destFile, JSON.stringify(agentJson, null, 2) + '\n', 'utf-8');
  channel.appendLine(`[Codernic] Created agent: ${destFile}`);

  reply({
    type: 'codernic:stream-chunk',
    payload: {
      chunk:
        '✅ **Agent created:** `.agencee/config/agents/' +
        slug +
        '.agent.json`' +
        '\n\n' +
        '```json\n' +
        JSON.stringify(agentJson, null, 2) +
        '\n```\n\n' +
        '💡 Edit `role` and `checks` to customise behaviour. Then `/create-dag` to wire it into a workflow.',
      done: true,
    },
  });
  return true;
};
