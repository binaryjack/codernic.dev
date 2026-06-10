import * as vscode from 'vscode';
import type { CodernicMode } from '../codernic-mode.types';
import type { CodernicIntent } from '../intent-detector';
import type { IntentHandler } from '../types/intent-handler.types';
import type { MessageContext } from '../types/message-context.types';

export const IntentRouter = function (this: {
  handlers: Map<string, IntentHandler>;
  register: (type: string, handler: IntentHandler) => void;
  dispatch: (
    intent: CodernicIntent,
    mode: CodernicMode,
    context: MessageContext,
    history?: { role: string; text: string }[],
    token?: vscode.CancellationToken,
  ) => Promise<boolean>;
}): void {
  const handlers = new Map<string, IntentHandler>();

  Object.defineProperty(this, 'handlers', {
    value: handlers,
    enumerable: false,
    writable: false,
  });
};

IntentRouter.prototype.register = function (
  this: { handlers: Map<string, IntentHandler> },
  type: string,
  handler: IntentHandler,
): void {
  this.handlers.set(type, handler);
};

IntentRouter.prototype.dispatch = async function (
  this: { handlers: Map<string, IntentHandler> },
  intent: CodernicIntent,
  mode: CodernicMode,
  context: MessageContext,
  history?: { role: string; text: string }[],
  token?: vscode.CancellationToken,
): Promise<boolean> {
  const handler = this.handlers.get(intent.type);
  if (handler) {
    return await handler.handle(intent, mode, context, history, token);
  }
  return false;
};
