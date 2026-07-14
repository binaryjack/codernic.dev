import type { MessageContext } from './message-context.types';

export interface MessageHandler {
  handle: (payload: unknown, context: MessageContext) => Promise<void>;
}
