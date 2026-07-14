import type { CodernicMode } from '../codernic-mode.types';
import type { MessageContext } from '../types/message-context.types';
import type { MessageHandler } from '../types/message-handler.types';

export const GetLastModeHandler = function (this: MessageHandler): void {};

GetLastModeHandler.prototype.handle = async function (
  this: MessageHandler,
  _payload: unknown,
  context: MessageContext,
): Promise<void> {
  const { workspaceState, reply } = context;
  const LAST_MODE_KEY = 'codernic.lastMode';
  const lastMode = workspaceState?.get<CodernicMode>(LAST_MODE_KEY) ?? 'brainstorm';
  reply({ type: 'codernic:last-mode', payload: { mode: lastMode } });
};
