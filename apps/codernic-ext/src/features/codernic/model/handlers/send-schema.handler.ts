import { MessageHandler } from '../types/message-handler.types';
import { MessageContext } from '../types/message-context.types';
import { callMcpTool } from '../../../../shared/mcp';

export const SendSchemaHandler = function (this: MessageHandler): void {};

SendSchemaHandler.prototype.handle = async function (
  this: MessageHandler,
  payload: unknown,
  context: MessageContext,
): Promise<void> {
  const { channel, mcpManager, reply } = context;
  const state = (payload as Record<string, unknown>)?.state;

  if (!state) {
    channel.appendLine('[SendSchemaHandler] Error: No state provided');
    return;
  }

  const mcpInstance = mcpManager?.getClient();
  if (!mcpInstance) {
    channel.appendLine('[SendSchemaHandler] MCP not available, cannot vectorize schema');
    return;
  }

  try {
    channel.appendLine('[SendSchemaHandler] Calling AtomosStructuraVectorizeSchema MCP Tool');
    
    // We pass a dummy schemaId since Erathos local may not have one generated
    const schemaId = (state as any).workspace?.active_canvas_id || "schema-session";
    
    const result = await callMcpTool(mcpInstance, {
      name: 'atomos-structura/vectorize-schema',
      arguments: {
        schemaId,
        workspace: state
      },
    });
    
    let warningMsg = '';
    if (result && result.content && result.content.length > 0 && result.content[0].type === 'text') {
      try {
        const payload = JSON.parse(result.content[0].text);
        if (payload.warning) {
          warningMsg = ` (Warning: ${payload.warning})`;
        }
      } catch (e) {
        // Not JSON, ignore
      }
    }
    
    channel.appendLine(`[SendSchemaHandler] Schema successfully sent${warningMsg}`);
    reply({ type: 'codernic:schema-vectorized', payload: { success: true } });
  } catch (err) {
    channel.appendLine(`[SendSchemaHandler] Failed to vectorize schema: ${err}`);
  }
};
