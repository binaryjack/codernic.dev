import * as fs from 'fs/promises';
import * as path from 'path';
import type { MessageContext } from '../types/message-context.types';
import type { MessageHandler } from '../types/message-handler.types';
import { readAgents, readDags, resolveAgentsDir, resolveDagsDir } from '../../../tech-catalog/model/agent-store';
import { readPrompts, readRules, resolvePromptsDir, resolveRulesDir } from '../../../tech-catalog/model/rules-store';
import { readTechs, resolveTechsDir } from '../../../tech-catalog/model/tech-store';
import { ConfigPaths } from '../../../../shared/utils/config-paths';

export const RequestAssetsHandler = function() {} as unknown as {
  new(): MessageHandler;
};

RequestAssetsHandler.prototype.handle = async function(_payload: unknown, context: MessageContext): Promise<void> {
    const { workspaceRoot, reply, channel } = context;

    try {
      const agentsDir = resolveAgentsDir(workspaceRoot);
      const dagsDir = resolveDagsDir(workspaceRoot);
      const techsDir = resolveTechsDir(workspaceRoot);
      const rulesDir = resolveRulesDir(workspaceRoot);
      const promptsDir = resolvePromptsDir(workspaceRoot);
      const llmsDirs = ConfigPaths.resolveDirectories(workspaceRoot, 'llms');

      const agents = await readAgents(agentsDir);
      const dags = await readDags(dagsDir);
      const techs = await readTechs(techsDir);
      const rules = await readRules(rulesDir);
      const prompts = await readPrompts(promptsDir);

      channel.appendLine(`[RequestAssets] workspaceRoot: ${workspaceRoot}`);
      channel.appendLine(`[RequestAssets] agentsDir: ${agentsDir} -> ${agents.length} agents`);
      channel.appendLine(`[RequestAssets] dagsDir: ${dagsDir} -> ${dags.length} dags`);

      try {
        await fs.appendFile('/tmp/codernic_debug.log', `[RequestAssets] workspaceRoot: ${workspaceRoot}\n`);
        await fs.appendFile('/tmp/codernic_debug.log', `[RequestAssets] agentsDir: ${agentsDir} -> ${agents.length} agents\n`);
        await fs.appendFile('/tmp/codernic_debug.log', `[RequestAssets] dagsDir: ${dagsDir} -> ${dags.length} dags\n`);
      } catch (e) {}


      let providers: string[] = [];
      let routes: string[] = [];
      for (const dir of llmsDirs) {
        try {
          const files = await fs.readdir(dir);
          const dirProviders = files
            .filter((f) => f.endsWith('.provider.json'))
            .map((f) => f.replace('.provider.json', ''));
          providers.push(...dirProviders);

          const dirRoutes = files
            .filter((f) => f.endsWith('.route.json') || f === 'routes.json')
            .map((f) => (f === 'routes.json' ? 'default' : f.replace('.route.json', '')));
          routes.push(...dirRoutes);
        } catch {
          // Ignore missing dir
        }
      }
      providers = [...new Set(providers)];
      routes = [...new Set(routes)];

      reply({
        type: 'codernic:assets-payload',
        payload: {
          agents,
          dags,
          techs,
          rules,
          prompts,
          providers,
          routes,
        },
      });
    } catch (error) {
      const err = error as Error;
      channel.appendLine(`[RequestAssetsHandler] Failed to load assets: ${err.message}`);
    }
  };
