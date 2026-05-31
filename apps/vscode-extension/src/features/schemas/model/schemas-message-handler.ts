import * as vscode from 'vscode';
import type { McpClientInstance, McpTextContent } from '../../../shared/mcp/index';
import { callMcpTool } from '../../../shared/mcp/index';
import { SchemaCanvasPanelAPI } from '../canvas/schema-canvas-panel';
import type { SchemasMessage } from './schemas-message.types';

export const buildSchemasMessageHandler = function (
  context: vscode.ExtensionContext,
  getMcpClient: () => McpClientInstance | undefined,
  workspaceRoot: string,
  postMessage: (msg: unknown) => void,
) {
  return async (msg: SchemasMessage) => {
    const mcpClient = getMcpClient();
    if (!mcpClient) {
      if (msg.type === 'list') {
        // MCP not connected yet — send empty list so UI doesn't stay stuck at "Loading..."
        postMessage({ type: 'list-response', schemas: [] });
      } else {
        vscode.window.showErrorMessage(
          'AI Agencee: Erathos requires the MCP Server to be running. Please ensure the server is built (pnpm -r build) and connected.',
        );
        postMessage({ type: 'response', success: false, message: 'MCP Server not connected' });
      }
      return;
    }

    try {
      switch (msg.type) {
        case 'list': {
          const res = await callMcpTool(mcpClient, { name: 'schema-list' });
          const contentText = (res.content?.[0] as McpTextContent)?.text ?? '{}';
          const data = JSON.parse(contentText);
          postMessage({ type: 'list-response', schemas: data });
          break;
        }
        case 'create': {
          const schemaId = msg.id || 'map-' + Math.floor(1000 + Math.random() * 9000) + '.entity';

          try {
            await callMcpTool(mcpClient, {
              name: 'schema-create',
              arguments: { id: schemaId, data: msg.data || {} },
            });
            const res = await callMcpTool(mcpClient, { name: 'schema-list' });
            const contentText = (res.content?.[0] as any)?.text ?? '{}';
            postMessage({ type: 'list-response', schemas: JSON.parse(contentText) });
            vscode.window.showInformationMessage(`Schema ${schemaId} created`);

            // Auto-open the newly created schema canvas
            await SchemaCanvasPanelAPI.createOrShow(context, mcpClient, schemaId);
          } catch (createErr: unknown) {
            vscode.window.showErrorMessage(
              `Schema creation failed. Ensure MCP server supports "schema-create". Details: ${(createErr as Error).message}`,
            );
            postMessage({ type: 'response', success: false, message: String(createErr) });
          }
          break;
        }
        case 'delete': {
          const answer = await vscode.window.showWarningMessage(
            `Delete schema "${msg.id}"? This action cannot be undone.`,
            { modal: true },
            'Delete',
          );
          if (answer === 'Delete') {
            await callMcpTool(mcpClient, { name: 'schema-delete', arguments: { id: msg.id } });

            // Close any open canvas for this schema
            const { SchemaCanvasPanelAPI } = await import('../canvas/schema-canvas-panel.js');
            const panel = SchemaCanvasPanelAPI.getPanel(msg.id);
            if (panel) {
              panel.dispose();
            }

            const res = await callMcpTool(mcpClient, { name: 'schema-list' });
            const contentText = (res.content?.[0] as McpTextContent)?.text ?? '{}';
            postMessage({ type: 'list-response', schemas: JSON.parse(contentText) });
            vscode.window.showInformationMessage(`Schema "${msg.id}" deleted`);
          }
          break;
        }
        case 'rename': {
          await callMcpTool(mcpClient, {
            name: 'schema-rename',
            arguments: { id: msg.id, newName: msg.newName },
          });
          const res = await callMcpTool(mcpClient, { name: 'schema-list' });
          const contentText = (res.content?.[0] as McpTextContent)?.text ?? '{}';
          postMessage({ type: 'list-response', schemas: JSON.parse(contentText) });
          vscode.window.showInformationMessage(`Schema renamed to ${msg.newName}`);
          break;
        }
        case 'open': {
          // delegate to panel manager
          await SchemaCanvasPanelAPI.createOrShow(context, mcpClient, msg.id);
          break;
        }
      }
    } catch (err: unknown) {
      vscode.window.showErrorMessage(`Schema action failed: ${(err as Error).message}`);
      postMessage({ type: 'response', success: false, message: String(err) });
    }
  };
};
