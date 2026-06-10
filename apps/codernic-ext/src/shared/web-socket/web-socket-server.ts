import { buildCodernicMessageHandler } from 'src/features/codernic';
import * as vscode from 'vscode';
import { WebSocket, WebSocketServer } from 'ws';
import * as net from 'net';
import * as os from 'os';
import { broadcastLlms, broadcastRouteProfiles } from '../api/llm-utils';
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

  // --- HTTP SERVER & WEBSOCKET BRIDGE ---
  const http = require('http');
  const path = require('path');
  const fs = require('fs');

  const server = http.createServer((req: any, res: any) => {
    // Serve Artifacts via HTTP GET /api/artifacts/:name
    if (req.method === 'GET' && req.url && req.url.startsWith('/api/artifacts/')) {
      const artifactName = req.url.split('/').pop();
      const artifactPath = path.join(workspaceRoot, '.agencee', 'artifacts', artifactName);
      
      if (fs.existsSync(artifactPath)) {
        res.writeHead(200, { 'Content-Type': 'text/markdown', 'Access-Control-Allow-Origin': '*' });
        fs.createReadStream(artifactPath).pipe(res);
      } else {
        res.writeHead(404, { 'Access-Control-Allow-Origin': '*' });
        res.end('Artifact not found');
      }
      return;
    }
    
    res.writeHead(404);
    res.end();
  });

  const wss = new WebSocketServer({
    server
  });

  server.listen(portNumber, () => {
    channel.appendLine(`[SVR HTTP/WS] Mission Control Gateway listening on port ${portNumber}`);
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

    // Envoi immédiat du statut système et de l'architecture
    (async () => {
      try {
        const { detectHardwareDriver, queryDaemonStatus } = require('../workspace-setup');
        const driver = await detectHardwareDriver();
        const status = await queryDaemonStatus();
        const isAlive = status !== null;
        let vramUsageVal = null;
        if (isAlive && status) {
           vramUsageVal = status.vram_used_gb;
        }
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({
            type: 'codernic:system-status',
            payload: {
              daemonStatus: isAlive ? 'running' : 'stopped',
              vramUsage: vramUsageVal,
              gpuTarget: driver.toUpperCase(),
            }
          }));
        }
      } catch (e) {
        channel.appendLine(`[SVR WS] Error sending initial system-status: ${e}`);
      }
    })();

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
    broadcastRouteProfiles(
      (msg) => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify(msg));
        }
      },
      workspaceRoot,
    );

    // Quand l'UI envoie un message (ex: /run-dag)
    ws.on('message', async (data: unknown) => {
      try {
        const rawText = data ? data.toString() : '';
        const isTelemetry = rawText.includes('galileus:get-state') || rawText.includes('galileus:state');
        
        const msg = rawText ? JSON.parse(rawText) : null;

        if (!isTelemetry) {
          // 1. LOG INCOMING MESSAGE IMMEDIATELY
          let debugMsgStr = rawText;
          try {
            debugMsgStr = JSON.stringify(msg).slice(0, 150) + '...';
          } catch (e) {
            channel.appendLine(`[SVR WS] IN: ${e}`);
          }
          channel.appendLine(`[SVR WS] IN: ${debugMsgStr}`);
        }

        // Intercept abort task message and write directly to IPC socket
        if (msg && msg.type === 'codernic:abort-task') {
          const taskId = msg.payload?.task_id;
          channel.appendLine(`[SVR WS] Intercepted abort task: ${taskId}`);
          if (taskId) {
            const ipcPath = os.platform() === 'win32' ? '\\\\.\\pipe\\ai_agencee' : '/tmp/ai_agencee.sock';
            const socket = net.createConnection(ipcPath);
            socket.on('error', (err) => {
              channel.appendLine(`[SVR WS] Abort socket connection error: ${err.message}`);
            });
            socket.on('connect', () => {
              socket.write(JSON.stringify({ Abort: { task_id: taskId } }) + '\n');
              socket.end();
            });
          }
          return;
        }
        
        if (msg && msg.type === 'codernic:hfd') {
          try {
            const name = msg.payload?.name || '';
            const path = require('path');
            const fs = require('fs');
            const binExt = process.platform === 'win32' ? '.exe' : '';
            const binName = `ai_agencee_cli${binExt}`;
            const releasePath = path.join(workspaceRoot, 'target', 'release', binName);
            const debugPath = path.join(workspaceRoot, 'target', 'debug', binName);
            const binPath = fs.existsSync(releasePath) ? releasePath : fs.existsSync(debugPath) ? debugPath : binName;

            const providerPath = path.join(workspaceRoot, '.agencee', 'config', 'llms', 'gguf-local.provider.json');
            
            channel.appendLine(`[HFD] Opening terminal to download ${name}...`);
            const terminal = vscode.window.createTerminal(`Download ${name.split('/').pop()}`);
            terminal.show();
            terminal.sendText(`"${binPath}" hfd -p "${providerPath}" -v "${name}"`);
          } catch (e) {
            channel.appendLine(`[HFD ERROR] Failed to create terminal: ${e}`);
          }
          return;
        }

        if (msg && msg.type === 'codernic:hfs') {
          const query = msg.payload?.query || '';
          const match = msg.payload?.match || 'c';
          const type = msg.payload?.type || 'gguf';
          
          const cp = require('child_process');
          const path = require('path');
          const fs = require('fs');
          const binExt = process.platform === 'win32' ? '.exe' : '';
          const binName = `ai_agencee_cli${binExt}`;
          const releasePath = path.join(workspaceRoot, 'target', 'release', binName);
          const debugPath = path.join(workspaceRoot, 'target', 'debug', binName);
          const binPath = fs.existsSync(releasePath) ? releasePath : fs.existsSync(debugPath) ? debugPath : binName;

          cp.exec(`"${binPath}" hfs "${query}" -m "${match}" -t "${type}" --json-ipc`, (err: any, stdout: string, stderr: string) => {
            if (err) {
              channel.appendLine(`[HFS Error] ${stderr}`);
              if (ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({ type: 'codernic:hfs-error', payload: stderr }));
              }
              return;
            }
            try {
              const res = JSON.parse(stdout);
              if (ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({ type: 'codernic:hfs-result', payload: res }));
              }
            } catch (e) {
              channel.appendLine(`[HFS Parse Error] ${e}: ${stdout}`);
            }
          });
          return;
        }

        if (msg && ['codernic:get-sessions', 'codernic:load-session', 'codernic:rename-session', 'codernic:delete-session', 'codernic:rebuild-index'].includes(msg.type)) {
          const ipcPath = os.platform() === 'win32' ? '\\\\.\\pipe\\ai_agencee' : '/tmp/ai_agencee.sock';
          const socket = net.createConnection(ipcPath);
          let rawRes = '';
          socket.on('data', (d) => { rawRes += d.toString(); });
          socket.on('end', () => {
            try {
              if (rawRes.trim().length > 0) {
                for (const line of rawRes.trim().split('\n')) {
                  const res = JSON.parse(line);
                  if (res && res.SessionsList) {
                    if (ws.readyState === WebSocket.OPEN) {
                      ws.send(JSON.stringify({ type: 'codernic:get-sessions-result', payload: res.SessionsList.sessions }));
                    }
                  } else if (res && res.SessionLoaded) {
                    if (ws.readyState === WebSocket.OPEN) {
                      ws.send(JSON.stringify({ type: 'codernic:load-session-result', payload: res.SessionLoaded }));
                    }
                  } else if (res && res.Done) {
                    // Send a ping to refresh sessions
                    const refreshSocket = net.createConnection(ipcPath);
                    let refreshRes = '';
                    refreshSocket.on('data', (d) => { refreshRes += d.toString(); });
                    refreshSocket.on('end', () => {
                      try {
                        for (const l of refreshRes.trim().split('\n')) {
                          const parsed = JSON.parse(l);
                          if (parsed && parsed.SessionsList && ws.readyState === WebSocket.OPEN) {
                            ws.send(JSON.stringify({ type: 'codernic:get-sessions-result', payload: parsed.SessionsList.sessions }));
                          }
                        }
                      } catch(e) {}
                    });
                    refreshSocket.on('error', () => {});
                    refreshSocket.on('connect', () => {
                      refreshSocket.write(JSON.stringify({ GetSessions: { project_root: workspaceRoot } }) + '\n');
                    });
                  }
                }
              }
            } catch (e) {
               channel.appendLine(`[SVR WS] Error parsing session IPC response: ${e}`);
            }
          });
          socket.on('error', (err) => {
            channel.appendLine(`[SVR WS] Session IPC error: ${err}`);
          });
          socket.on('connect', () => {
            let req = null;
            if (msg.type === 'codernic:get-sessions') {
              req = { GetSessions: { project_root: workspaceRoot } };
            } else if (msg.type === 'codernic:load-session') {
              req = { LoadSession: { id: msg.payload.id, project_root: workspaceRoot } };
            } else if (msg.type === 'codernic:rename-session') {
              req = { RenameSession: { id: msg.payload.id, new_name: msg.payload.newName, project_root: workspaceRoot } };
            } else if (msg.type === 'codernic:delete-session') {
              req = { DeleteSession: { id: msg.payload.id, project_root: workspaceRoot } };
            } else if (msg.type === 'codernic:rebuild-index') {
              req = { StartIndexing: { config: { root_path: workspaceRoot, pooling_strategy: "Mean", model_type: "AllMiniLML6V2", languages: null, exclude_patterns: null } } };
            }
            if (req) {
              socket.write(JSON.stringify(req) + '\n');
            } else {
              socket.end();
            }
          });
          return;
        }

        // Intercept active diagnostic request
        if (msg && msg.type === 'codernic:request-full-diagnostic') {
          const ipcPath = os.platform() === 'win32' ? '\\\\.\\pipe\\ai_agencee' : '/tmp/ai_agencee.sock';
          const socket = net.createConnection(ipcPath);
          let rawRes = '';
          socket.on('data', (d) => { rawRes += d.toString(); });
          socket.on('end', () => {
            try {
              const res = JSON.parse(rawRes.trim());
              if (res && res.Health) {
                const health = res.Health;
                const activeHandles = (process as any)._getActiveHandles ? (process as any)._getActiveHandles().length : 0;
                const payload = {
                  hardware: {
                    vramUsedGb: health.vram_used_gb,
                    memoryLockLimit: health.memory_lock_limit,
                  },
                  backend: {
                    ragInitialized: health.rag_initialized,
                    indexedChunksCount: health.indexed_chunks_count,
                    activeMcpBridges: mcpManager.getState() === 'connected' ? ['structura'] : [],
                  },
                  frontend: {
                    activeWatchers: activeHandles,
                  }
                };
                if (ws.readyState === WebSocket.OPEN) {
                  ws.send(JSON.stringify({ type: 'codernic:health-telemetry', payload }));
                }
              }
            } catch (e) {
               // ignore parse errors
            }
          });
          socket.on('error', () => {});
          socket.on('connect', () => {
             socket.write('"GetHealth"\n');
          });
          return;
        }

        // 2. Pass message to existing router
        await onCodernicMessage(msg, (replyMsg) => {
          if (ws.readyState === WebSocket.OPEN) {
            let serialized = '';
            try {
              serialized = JSON.stringify(replyMsg);
            } catch {
              serialized = String(replyMsg);
            }
            const isOutTelemetry = serialized.includes('galileus:get-state') || serialized.includes('galileus:state');
            if (!isOutTelemetry) {
              const debugReplyStr = serialized.length > 150 ? serialized.slice(0, 150) + '...' : serialized;
              channel.appendLine(`[SVR WS] OUT: ${debugReplyStr}`);
            }
            ws.send(serialized);
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

  // Passive Heartbeat (10s)
  const heartbeatInterval = setInterval(async () => {
    try {
      const { queryDaemonStatus } = require('../workspace-setup');
      const status = await queryDaemonStatus();
      broadcastToUI({ type: 'codernic:heartbeat', payload: { status: status !== null ? 'ok' : 'down' } });
    } catch (e) {
       // ignore
    }
  }, 10000);
  context.subscriptions.push({ dispose: () => clearInterval(heartbeatInterval) });

  // Nettoyage du serveur à la fermeture de l'extension
  context.subscriptions.push({ dispose: () => wss.close() });
  // ----------------------------------------------------------------

  return [broadcastToUI, mcpManager];
};
