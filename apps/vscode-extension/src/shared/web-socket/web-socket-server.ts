import { buildCodernicMessageHandler } from 'src/features/codernic';
import * as vscode from 'vscode';
import { WebSocket, WebSocketServer } from 'ws';
import { broadcastLlms } from '../api/llm-utils';
import { McpConnectionManager } from '../mcp';

export const registerWebSocketAndGetBroadcastAndMcp = (
  context: vscode.ExtensionContext,
  mcpManager: McpConnectionManager,
  workspaceRoot: string,
  channel: vscode.OutputChannel,
) => {
  const onCodernicMessage = buildCodernicMessageHandler(
    workspaceRoot,
    channel,
    context.workspaceState,
    context,
    context.extensionPath,
    mcpManager,
  );

  const portNumber = Number(process.env.VITE_CODERNIC_PORT) || 47321;

  // --- NOUVEAU PONT WEBSOCKET (Remplace CodernicWebviewProvider) ---
  const wss = new WebSocketServer({
    port: portNumber,
  });
  let connectedClients: WebSocket[] = [];

  const broadcastToUI = (payload: unknown) => {
    const data = JSON.stringify(payload);
    connectedClients.forEach((ws) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(data);
      }
    });
  };

  wss.on('connection', (ws: WebSocket) => {
    channel.appendLine(`[SVR WS] Mission Control (PWA) connecté on port ${portNumber}`);
    connectedClients.push(ws);

    // INJECTION : Envoi immédiat de l'état LLM au client entrant
    broadcastLlms(
      (msg) => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify(msg));
        }
      },
      context,
      workspaceRoot,
    );

    // Quand l'UI envoie un message (ex: /run-dag)
    ws.on('message', async (data: unknown) => {
      try {
        const msg = data && JSON.parse(data.toString());

        // 1. LOG INCOMING MESSAGE IMMEDIATELY
        let debugMsgStr = String(data);
        try {
          debugMsgStr = JSON.stringify(msg).slice(0, 150) + '...';
        } catch (e) {
          channel.appendLine(`[SVR WS] IN: ${e}`);
        }
        channel.appendLine(`[SVR WS] IN: ${debugMsgStr}`);

        // 2. Pass message to existing router
        await onCodernicMessage(msg, (replyMsg) => {
          if (ws.readyState === WebSocket.OPEN) {
            let debugReplyStr = String(replyMsg);
            try {
              debugReplyStr = JSON.stringify(replyMsg).slice(0, 150) + '...';
            } catch (e) {
              debugReplyStr = String(replyMsg);
            }
            channel.appendLine(`[SVR WS] OUT: ${debugReplyStr}`);
            ws.send(JSON.stringify(replyMsg));
          }
        });
      } catch (e) {
        channel.appendLine(`[SVR WS] Erreur parsing message: ${e}`);
      }
    });

    ws.on('close', () => {
      connectedClients = connectedClients.filter((client) => client !== ws);
      channel.appendLine('[SVR WS] Mission Control déconnecté');
    });
  });

  // Nettoyage du serveur à la fermeture de l'extension
  context.subscriptions.push({ dispose: () => wss.close() });
  // ----------------------------------------------------------------

  return [broadcastToUI, mcpManager];
};
