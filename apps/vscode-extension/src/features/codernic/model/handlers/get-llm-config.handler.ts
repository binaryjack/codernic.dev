import { LlmConfigRepository } from '../llm-repository';
import type { MessageContext } from '../types/message-context.types';
import type { MessageHandler } from '../types/message-handler.types';

export const GetLlmConfigHandler = function (this: MessageHandler): void {};

GetLlmConfigHandler.prototype.handle = async function (
  this: MessageHandler,
  _payload: unknown,
  context: MessageContext,
): Promise<void> {
  const { workspaceRoot, reply } = context;
  const providers = await LlmConfigRepository.loadAllProviders(workspaceRoot);
  reply({ type: 'codernic:llm-config', payload: { providers } });
};
