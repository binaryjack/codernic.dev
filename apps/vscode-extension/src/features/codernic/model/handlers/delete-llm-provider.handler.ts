import { LlmConfigRepository } from '../llm-repository';
import type { MessageContext } from '../types/message-context.types';
import type { MessageHandler } from '../types/message-handler.types';

export const DeleteLlmProviderHandler = function (this: MessageHandler): void {};

DeleteLlmProviderHandler.prototype.handle = async function (
  this: MessageHandler,
  payload: unknown,
  context: MessageContext,
): Promise<void> {
  const { workspaceRoot, context: extensionContext, mcpManager, reply } = context;
  const { providerId } = payload as { providerId: string };

  await LlmConfigRepository.deleteProvider(workspaceRoot, providerId);
  if (extensionContext) {
    await extensionContext.secrets.delete(`agencee.provider.${providerId}.key`);
  }

  await mcpManager?.getClient()?.client.callTool({ name: 'reload_llm_config', arguments: {} });
  reply({ type: 'codernic:llm-provider-deleted' });
};
