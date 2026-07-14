import type { MessageContext } from '../types/message-context.types';
import type { MessageHandler } from '../types/message-handler.types';

export const GetRouteProfileHandler = function (this: MessageHandler): void {};

GetRouteProfileHandler.prototype.handle = async function (
  this: MessageHandler,
  payload: unknown,
  context: MessageContext,
): Promise<void> {
  const { workspaceState, reply } = context;
  const PROFILE_KEY = 'agencee.routeProfile';

  let profile = 'default';
  if (workspaceState) {
    profile = workspaceState.get<string>(PROFILE_KEY) || 'default';
  }

  reply({
    type: 'codernic:route-profile',
    payload: { profile },
  });
};
