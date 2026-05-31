import { LlmConfigRepository, type ProviderConfigFile } from '../llm-repository';
import type { MessageContext } from '../types/message-context.types';
import type { MessageHandler } from '../types/message-handler.types';

export const SaveLlmProviderHandler = function (this: MessageHandler): void {};

SaveLlmProviderHandler.prototype.handle = async function (
  this: MessageHandler,
  payload: unknown,
  context: MessageContext,
): Promise<void> {
  const { workspaceRoot, context: extensionContext, mcpManager, reply } = context;
  const { provider, apiKey } = payload as { provider: ProviderConfigFile; apiKey?: string };

  await LlmConfigRepository.saveProvider(workspaceRoot, provider);
  if (apiKey && extensionContext) {
    await extensionContext.secrets.store(`agencee.provider.${provider.id}.key`, apiKey);
  }

  await mcpManager?.getClient()?.client.callTool({ name: 'reload_llm_config', arguments: {} });
  reply({ type: 'codernic:llm-provider-saved' });
};
