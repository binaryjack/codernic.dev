import * as vscode from 'vscode';
import type { CodernicMsg } from '../api/codernic-webview-provider';
import { createMessageRouter } from './create-message-router';
import type { MessageContext } from './types/message-context.types';

/** Build Codernic message handler — simplified chat-only (always injects context). */
export const buildCodernicMessageHandler = function (
  workspaceRoot: string,
  channel: { appendLine: (msg: string) => void },
  workspaceState?: {
    get: <T>(key: string) => T | undefined;
    update: (key: string, value: unknown) => Thenable<void>;
  },
  context?: vscode.ExtensionContext,
  extensionPath?: string,
  mcpManager?: import('../../../shared/mcp').McpConnectionManager,
) {
  const router = createMessageRouter();

  return async (msg: CodernicMsg, reply: (r: CodernicMsg) => void): Promise<void> => {
    const messageContext: MessageContext = {
      workspaceRoot,
      channel,
      workspaceState,
      context,
      extensionPath,
      mcpManager,
      reply,
    };

    await router.dispatch(msg.type, msg.payload, messageContext);
  };
};
