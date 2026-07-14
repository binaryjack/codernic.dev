import * as vscode from 'vscode';
import type { MessageContext } from '../types/message-context.types';
import type { MessageHandler } from '../types/message-handler.types';

export const ManagedLlmCommandHandler = function (this: MessageHandler): void {};

ManagedLlmCommandHandler.prototype.handle = async function (
  this: MessageHandler,
  payload: unknown,
  context: MessageContext,
): Promise<void> {
  const { mcpManager, reply } = context;
  const { providerId, modelId, action } = payload as {
    providerId?: string;
    modelId?: string;
    action: string;
  };

  if (mcpManager) {
    try {
      const client = mcpManager.getClient()?.client;
      if (!client) {
        throw new Error('MCP Client not connected');
      }

      const result = await client.callTool({
        name: 'manage_llm',
        arguments: { providerId, modelId, action },
      });

      const content = (result as Record<string, unknown>)?.content;
      const dataPayload = Array.isArray(content)
        ? (content[0] as { type: string; text: string })
        : null;
      const data =
        dataPayload && dataPayload.text ? JSON.parse(dataPayload.text) : { status: 'unknown' };

      if (data.status === 'error') {
        const actions = data.diagnostic ? ['Show Diagnostic'] : [];
        vscode.window
          .showErrorMessage(`LLM Start Failed: ${data.error || 'Unknown error'}`, ...actions)
          .then((selection) => {
            if (selection === 'Show Diagnostic') {
              const diagText =
                typeof data.diagnostic === 'object'
                  ? JSON.stringify(data.diagnostic, null, 2)
                  : String(data.diagnostic);
              vscode.window.showInformationMessage(`Diagnostic Information:\n${diagText}`);
            }
          });
      }

      reply({
        type: 'codernic:managed-llm-status',
        payload: { providerId, modelId, status: data.status, error: data.error },
      });
    } catch (e) {
      const errorMsg = String(e);
      vscode.window.showErrorMessage(`MCP Error: ${errorMsg}`);
      reply({
        type: 'codernic:managed-llm-status',
        payload: { providerId, modelId, status: 'error', error: errorMsg },
      });
    }
  }
};
