import type { MessageContext } from '../types/message-context.types';
import type { MessageHandler } from '../types/message-handler.types';

export const SetRouteProfileHandler = function (this: MessageHandler): void {};

SetRouteProfileHandler.prototype.handle = async function (
  this: MessageHandler,
  payload: unknown,
  context: MessageContext,
): Promise<void> {
  const { workspaceState, channel } = context;
  const { profile } = payload as { profile: string };
  const PROFILE_KEY = 'agencee.routeProfile';

  if (workspaceState && profile) {
    await workspaceState.update(PROFILE_KEY, profile);
    channel.appendLine(`[Codernic] Saved route profile: ${profile}`);
  }
};
