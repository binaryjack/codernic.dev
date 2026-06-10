import * as fs from 'fs/promises';
import * as path from 'path';
import type { MessageContext } from '../types/message-context.types';
import type { MessageHandler } from '../types/message-handler.types';
import { readAgents, readDags, resolveAgentsDir } from '../../../tech-catalog/model/agent-store';
import { readPrompts, readRules, resolvePromptsDir, resolveRulesDir } from '../../../tech-catalog/model/rules-store';
import { readTechs, resolveTechsDir } from '../../../tech-catalog/model/tech-store';

export class RequestAssetsHandler implements MessageHandler {
  async handle(_payload: unknown, context: MessageContext): Promise<void> {
    const { workspaceRoot, reply, channel } = context;

    try {
      const agentsDir = resolveAgentsDir(workspaceRoot);
      const techsDir = resolveTechsDir(workspaceRoot);
      const rulesDir = resolveRulesDir(workspaceRoot);
      const promptsDir = resolvePromptsDir(workspaceRoot);
      const llmsDir = path.join(workspaceRoot, '.agencee', 'config', 'llms');

      const agents = await readAgents(agentsDir);
      const dags = await readDags(agentsDir);
      const techs = await readTechs(techsDir);
      const rules = await readRules(rulesDir);
      const prompts = await readPrompts(promptsDir);

      let providers: string[] = [];
      try {
        const files = await fs.readdir(llmsDir);
        providers = files
          .filter((f) => f.endsWith('.provider.json'))
          .map((f) => f.replace('.provider.json', ''));
      } catch {
        // Ignore missing llms dir
      }

      reply({
        type: 'codernic:assets-payload',
        payload: {
          agents,
          dags,
          techs,
          rules,
          prompts,
          providers,
        },
      });
    } catch (error) {
      const err = error as Error;
      channel.appendLine(`[RequestAssetsHandler] Failed to load assets: ${err.message}`);
    }
  }
}
