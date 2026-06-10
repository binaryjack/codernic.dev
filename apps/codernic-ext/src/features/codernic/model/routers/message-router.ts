import type { MessageContext } from '../types/message-context.types';
import type { MessageHandler } from '../types/message-handler.types';

export const MessageRouter = function (this: {
  handlers: Map<string, MessageHandler>;
  register: (type: string, handler: MessageHandler) => void;
  dispatch: (type: string, payload: unknown, context: MessageContext) => Promise<void>;
}): void {
  const handlers = new Map<string, MessageHandler>();

  Object.defineProperty(this, 'handlers', {
    value: handlers,
    enumerable: false,
    writable: false,
  });
};

MessageRouter.prototype.register = function (
  this: { handlers: Map<string, MessageHandler> },
  type: string,
  handler: MessageHandler,
): void {
  this.handlers.set(type, handler);
};

MessageRouter.prototype.dispatch = async function (
  this: { handlers: Map<string, MessageHandler> },
  type: string,
  payload: unknown,
  context: MessageContext,
): Promise<void> {
  const handler = this.handlers.get(type);
  if (handler) {
    await handler.handle(payload, context);
  } else {
    context.channel.appendLine(`[MessageRouter] No handler registered for: ${type}`);
  }
};
