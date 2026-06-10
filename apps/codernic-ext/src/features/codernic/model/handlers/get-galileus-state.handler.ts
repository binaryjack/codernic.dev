import { callMcpTool, type McpTextContent } from '../../../../shared/mcp';
import { safeParseText } from '../galileus-handler';
import type { MessageContext } from '../types/message-context.types';

export class GetGalileusStateHandler {
  async handle(_payload: unknown, context: MessageContext): Promise<void> {
    const { mcpManager, reply, channel } = context;

    if (!mcpManager) {
      reply({
        type: 'galileus:state',
        payload: { error: 'MCP manager is not initialized.' },
      });
      return;
    }

    const currentMode = context.workspaceState?.get<string>('codernic.lastMode');
    if (currentMode === 'ask') {
      // En mode ask, on bloque silencieusement le polling pour éviter
      // la saturation de l'Event Loop et libérer la WebSocket.
      return;
    }

    try {
      const mcpInstance = mcpManager.getClient();
      if (!mcpInstance) {
        reply({
          type: 'galileus:state',
          payload: { error: 'Galileus MCP server is not running.' },
        });
        return;
      }

      const result = await callMcpTool(mcpInstance, {
        name: 'galileus_get_workspace_state',
        arguments: {},
      });
      const firstItem = result.content?.[0] as McpTextContent | undefined;
      const text = firstItem ? firstItem.text : JSON.stringify(result);
      const parsed = safeParseText(text) as any;

      if (parsed?.error) {
        reply({
          type: 'galileus:state',
          payload: { error: parsed.error },
        });
        return;
      }

      reply({
        type: 'galileus:state',
        payload: parsed,
      });
    } catch (e) {
      const errMsg = e instanceof Error ? e.message : String(e);
      channel.appendLine(`[Codernic] Get Galileus State error: ${errMsg}`);
      reply({
        type: 'galileus:state',
        payload: { error: errMsg },
      });
    }
  }
}
