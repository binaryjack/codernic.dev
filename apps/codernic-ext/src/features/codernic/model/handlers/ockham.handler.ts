import type { MessageHandler } from "../types/message-handler.types";
import type { MessageContext } from "../types/message-context.types";

export const createOckhamCompressContextHandler = (): MessageHandler => ({
  handle: async (payload: unknown, context: MessageContext) => {
    // not implemented
  }
});

export const createOckhamSyncCatalogHandler = (): MessageHandler => ({
  handle: async (payload: unknown, context: MessageContext) => {
    // not implemented
  }
});

export const createOckhamSearchModelsHandler = (): MessageHandler => ({
  handle: async (payload: unknown, context: MessageContext) => {
    // not implemented
  }
});
