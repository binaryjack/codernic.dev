import { broadcastLlms, broadcastRouteProfiles } from '../../../../shared/api/llm-utils';
import type { MessageContext } from '../types/message-context.types';
import type { MessageHandler } from '../types/message-handler.types';

export const RequestLlmsHandler = function (this: MessageHandler): void {};

RequestLlmsHandler.prototype.handle = async function (
  this: MessageHandler,
  _payload: unknown,
  context: MessageContext,
): Promise<void> {
  const { reply, context: extensionContext, workspaceRoot } = context;
  await broadcastLlms(
    reply as (r: { type: string; payload?: unknown }) => void,
    extensionContext,
    workspaceRoot,
  );
  await broadcastRouteProfiles(
    reply as (r: { type: string; payload?: unknown }) => void,
    workspaceRoot,
  );
};
