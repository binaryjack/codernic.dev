import * as fs from 'fs/promises';
import * as path from 'path';
import { ConfigPaths } from '../../../../shared/utils/config-paths';
import { getRemoteSchemasUrl } from '../engine-config';
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
    const planText = `📋 **Plan Mode — Command Preview**\n\n**Detected command:** \`create-dag\`\n**Specification:** ${intent.spec || '(none)'}\n\n**What would happen in Agent mode:**\n1. Create new dag configuration in \`.dags/\` directory\n2. Parse dag name from: "${intent.spec}"\n3. Generate \`.dag.json\` file\n\n💡 **Switch to Agent mode** to execute commands.`;
    reply({ type: 'codernic:stream-chunk', payload: { chunk: planText, done: true } });
    return true;
  }

  const spec = intent.spec.trim() || 'my-workflow';
  const slug = spec
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  const dagsDir = path.join(ConfigPaths.getPrimaryWritePath(workspaceRoot), 'dags');
  const destFile = path.join(dagsDir, `${slug}.dag.json`);

  try {
    await fs.access(destFile);
    reply({
      type: 'codernic:stream-chunk',
      payload: {
        chunk: `⚠️ DAG already exists: \`Config folder/${slug}.dag.json\`\n\nDelete it first or choose a different name.`,
        done: true,
      },
    });
    return true;
  } catch {
    /* expected */
  }

  const remoteSchemasUrl = getRemoteSchemasUrl(workspaceRoot);

  const dagJson = {
    $schema: remoteSchemasUrl ? `${remoteSchemasUrl}dags.form.schema.json` : `https://raw.githubusercontent.com/codernic-dev/ai-agencee/main/schemas/dags.form.schema.json`,
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
  await fs.mkdir(dagsDir, { recursive: true });
  await fs.writeFile(destFile, JSON.stringify(dagJson, null, 2) + '\n', 'utf-8');
  channel.appendLine(`[Codernic] Created DAG: ${destFile}`);

  reply({
    type: 'codernic:stream-chunk',
    payload: {
      chunk:
        '✅ **DAG created:** `Config folder/' +
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
