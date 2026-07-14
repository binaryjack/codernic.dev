import * as fs from 'fs/promises';
import * as path from 'path';
import { ConfigPaths } from '../../../../shared/utils/config-paths';
import * as vscode from 'vscode';
import type { CodernicMode } from '../codernic-mode.types';
import type { CodernicIntent } from '../intent-detector';
import type { IntentHandler } from '../types/intent-handler.types';
import type { MessageContext } from '../types/message-context.types';

export const ListAgentsIntent = function (this: IntentHandler): void {};

ListAgentsIntent.prototype.handle = async function (
  this: IntentHandler,
  intent: CodernicIntent,
  mode: CodernicMode,
  context: MessageContext,
  history?: { role: string; text: string }[],
  token?: vscode.CancellationToken,
): Promise<boolean> {
  const { workspaceRoot, reply } = context;

  if (mode === 'plan') {
    const planText = `📋 **Plan Mode — Command Preview**\n\n**Detected command:** \`list-agents\`\n**Specification:** (none)\n\n**What would happen in Agent mode:**\n1. Read \`Config folder/\` directory\n2. Return list of \`.agent.json\` files with name and description\n\n💡 **Switch to Agent mode** to execute commands.`;
    reply({ type: 'codernic:stream-chunk', payload: { chunk: planText, done: true } });
    return true;
  }

  const agentsDir = path.join(ConfigPaths.getPrimaryWritePath(workspaceRoot), 'config', 'agents');
  try {
    const files = (await fs.readdir(agentsDir)).filter((f) => f.endsWith('.agent.json'));
    if (files.length === 0) {
      reply({
        type: 'codernic:stream-chunk',
        payload: {
          chunk:
            '📭 No agents found in `Config folder/`.\n\nCreate one with `/create-agent <name>`.',
          done: true,
        },
      });
    } else {
      const rows = await Promise.all(
        files.map(async (f) => {
          try {
            const data = JSON.parse(await fs.readFile(path.join(agentsDir, f), 'utf-8')) as Record<
              string,
              unknown
            >;
            const name = (data['name'] as string | undefined) ?? f.replace(/\.agent\.json$/, '');
            const desc = (data['description'] as string | undefined) ?? '';
            return `- **${name}** — \`${f}\`${desc ? `\n  ${desc}` : ''}`;
          } catch {
            return `- \`${f}\``;
          }
        }),
      );
      reply({
        type: 'codernic:stream-chunk',
        payload: {
          chunk: '📋 **Agents (' + files.length + ')**\n\n' + rows.join('\n'),
          done: true,
        },
      });
    }
  } catch {
    reply({
      type: 'codernic:stream-chunk',
      payload: {
        chunk: '📭 No `Config folder/` directory found. Run `/init` first.',
        done: true,
      },
    });
  }
  return true;
};
