import type { CodernicMode } from '../codernic-mode.types';
import type { MessageContext } from '../types/message-context.types';
import type { MessageHandler } from '../types/message-handler.types';

export const SetLastModeHandler = function (this: MessageHandler): void {};

SetLastModeHandler.prototype.handle = async function (
  this: MessageHandler,
  payload: unknown,
  context: MessageContext,
): Promise<void> {
  const { workspaceState, channel } = context;
  const { mode } = payload as { mode: CodernicMode };
  const LAST_MODE_KEY = 'codernic.lastMode';

  if (workspaceState && mode) {
    await workspaceState.update(LAST_MODE_KEY, mode);
    channel.appendLine(`[Codernic] Saved mode: ${mode}`);
  }
};
