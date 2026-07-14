import { buildCodernicMessageHandler } from 'src/features/codernic';
import * as vscode from 'vscode';
import { WebSocket, WebSocketServer } from 'ws';
import * as net from 'net';
import * as os from 'os';
import { broadcastLlms, broadcastRouteProfiles } from '../api/llm-utils';
import { McpConnectionManager } from '../mcp';

import { ExtensionStatusBar } from '../status/extension-status';
import { ConfigPaths } from '../utils/config-paths';

export const registerWebSocketAndGetBroadcastAndMcp = (
  context: vscode.ExtensionContext,
  mcpManager: McpConnectionManager,
  workspaceRoot: string,
  channel: vscode.OutputChannel,
  extStatusBar?: ExtensionStatusBar,
) => {
  const onCodernicMessage = buildCodernicMessageHandler(
    workspaceRoot,
    channel,
    context.workspaceState,
    context,
    context.extensionPath,
    mcpManager,
  );

  const http = require('http');
  const path = require('path');
  const fs = require('fs');

  const engineConfig = ConfigPaths.getEngineConfig();
  let wsPort = engineConfig.network.daemon_ws_port;
  const portNumber = (Number(process.env.VITE_CODERNIC_PORT) || wsPort) + 1000;

  // --- HTTP SERVER & WEBSOCKET BRIDGE ---
  const server = http.createServer((req: any, res: any) => {
    // Serve Artifacts List via HTTP GET /api/artifacts
    if (req.method === 'GET' && req.url === '/api/artifacts') {
      const dirPath = path.join(workspaceRoot, '.codernic', 'artifacts');
      if (fs.existsSync(dirPath)) {
        const files = fs.readdirSync(dirPath).filter((f: string) => f.endsWith('.md'));
        res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
        res.end(JSON.stringify(files));
      } else {
        res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
        res.end(JSON.stringify([]));
      }
      return;
    }

    // Serve Artifacts via HTTP GET /api/artifacts/:name
    if (req.method === 'GET' && req.url && req.url.startsWith('/api/artifacts/')) {
      const artifactName = req.url.split('/').pop();
      const artifactPath = path.join(workspaceRoot, '.codernic', 'artifacts', artifactName);
      
      if (fs.existsSync(artifactPath)) {
        res.writeHead(200, { 'Content-Type': 'text/markdown', 'Access-Control-Allow-Origin': '*' });
        fs.createReadStream(artifactPath).pipe(res);
      } else {
        res.writeHead(404, { 'Access-Control-Allow-Origin': '*' });
        res.end('Artifact not found');
      }
      return;
    }
    if (req.method === 'GET' && req.url === '/api/schemas') {
      const engineConfig = ConfigPaths.getEngineConfig();
      const schemasPath = engineConfig.systemPaths.system_schemas;
      const schemas: Record<string, any> = {};
      
      try {
        if (fs.existsSync(schemasPath)) {
          const files = fs.readdirSync(schemasPath);
          for (const file of files) {
            if (file.endsWith('.form.schema.json')) {
              const content = fs.readFileSync(path.join(schemasPath, file), 'utf8');
              try {
                const parsed = JSON.parse(content);
                // Map filename to expected keys
                if (file === 'agents.form.schema.json') schemas['agents'] = parsed;
                else if (file === 'dags.form.schema.json') schemas['dags'] = parsed;
                else if (file === 'techs.form.schema.json') schemas['techs'] = parsed;
                else if (file === 'providers.form.schema.json') schemas['config/llms/providers'] = parsed;
                else if (file === 'routes.form.schema.json') schemas['config/llms/routes'] = parsed;
              } catch (e) {
                console.error(`Failed to parse schema ${file}`, e);
              }
            }
          }
        }
      } catch (e) {
        console.error('Failed to read schemas directory', e);
      }

      res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
      res.end(JSON.stringify(schemas));
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
  
  server.on('error', (err: any) => {
    channel.appendLine(`[SVR HTTP/WS] Gateway Server Error: ${err.message}`);
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
        let vramTotalVal = null;
        let totalRamVal = null;
        let cpuUsageVal = null;
        if (isAlive && status) {
           vramUsageVal = status.vram_used_gb;
           vramTotalVal = status.vram_total_gb;
           totalRamVal = status.total_ram_gb;
           cpuUsageVal = status.cpu_usage_pct;
        }
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({
            type: 'codernic:system-status',
            payload: {
              daemonStatus: isAlive ? 'running' : 'stopped',
              vramUsage: vramUsageVal,
              vramTotal: vramTotalVal,
              totalRam: totalRamVal,
              cpuUsage: cpuUsageVal,
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
          const logMsg = `[SVR WS] IN: ${debugMsgStr}`;
          channel.appendLine(logMsg);
          broadcastToUI({
            type: 'codernic:system-log-batch',
            payload: {
              logs: [{ timestamp: new Date().toISOString(), message: logMsg }]
            }
          });
        }

        // Intercept abort task message and write directly to IPC socket
        if (msg && msg.type === 'codernic:abort-task') {
          const taskId = msg.payload?.task_id;
          channel.appendLine(`[SVR WS] Intercepted abort task: ${taskId}`);
          if (taskId) {
            const ipcPath = os.platform() === 'win32' ? '\\\\.\\pipe\\codernic_pipe' : '/tmp/codernic.sock';
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

        // Intercept open global config
        if (msg && msg.type === 'codernic:open-global-config') {
          const configPath = ConfigPaths.getGlobalInstallationPath();
          vscode.env.openExternal(vscode.Uri.file(configPath));
          return;
        }
        
        if (msg && (msg.type === 'codernic:hfd' || msg.type === 'codernic:hfd-redownload')) {
          try {
            const name = msg.payload?.name || '';
            let providerName = msg.payload?.providerName || 'gguf-local';
            if (!providerName.endsWith('.provider.json')) {
              providerName = `${providerName}.provider.json`;
            }
            const path = require('path');
            const fs = require('fs');
            const engineConfig = ConfigPaths.getEngineConfig();
            const providerPath = path.join(engineConfig.systemPaths.system_providers_dir, providerName);
            
            if (msg.type === 'codernic:hfd-redownload') {
              try {
                const parts = name.split('/');
                const fileName = parts.length > 1 ? parts.pop() : name;
                if (fs.existsSync(providerPath)) {
                  let providerData = JSON.parse(fs.readFileSync(providerPath, 'utf8'));
                  let removedAny = false;
                  
                  const filterModels = (models: any[]) => {
                    return models.filter((m: any) => {
                      if (m.modelPath && m.modelPath.endsWith(fileName)) {
                        try { fs.unlinkSync(m.modelPath); } catch(e){}
                        if (m.mmprojPath) {
                          try { fs.unlinkSync(m.mmprojPath); } catch(e){}
                        }
                        removedAny = true;
                        return false;
                      }
                      return true;
                    });
                  };

                  if (Array.isArray(providerData.models)) {
                    providerData.models = filterModels(providerData.models);
                  } else if (providerData.type && providerData[providerData.type]?.models) {
                    providerData[providerData.type].models = filterModels(providerData[providerData.type].models);
                  }
                  
                  if (removedAny) {
                    fs.writeFileSync(providerPath, JSON.stringify(providerData, null, 2) + '\n', 'utf8');
                  }
                }
              } catch (e) {
                channel.appendLine(`[HFD Redownload] Error purging old config/files: ${e}`);
              }
            }
            
            const ipcPath = os.platform() === 'win32' ? '\\\\.\\pipe\\codernic_pipe' : '/tmp/codernic.sock';
            const socket = net.createConnection(ipcPath);
            let rawBuffer = '';
            
            socket.on('data', (d) => {
              rawBuffer += d.toString();
              const lines = rawBuffer.split('\n');
              rawBuffer = lines.pop() || '';
              
              for (const line of lines) {
                if (!line.trim()) continue;
                try {
                  const res = JSON.parse(line);
                  if (res && res.HfdProgress) {
                    const payload = { ...res.HfdProgress, id: name };
                    broadcastToUI({ type: 'codernic:hfd-progress', payload });
                  } else if (res === 'HfdDone' || (res && res.HfdDone)) {
                    broadcastToUI({ type: 'codernic:hfd-done', payload: { id: name } });
                  } else if (res && res.HfdError) {
                    broadcastToUI({ type: 'codernic:hfd-error', payload: { id: name, error: res.HfdError } });
                  } else if (res === 'Done' || (res && res.Done)) {
                    socket.end();
                  }
                } catch (e) {
                  channel.appendLine(`[HFD IPC Parse Error] ${e}: ${line}`);
                }
              }
            });
            
            socket.on('error', (err) => {
              channel.appendLine(`[HFD IPC ERROR] ${err}`);
              broadcastToUI({ type: 'codernic:hfd-error', payload: { id: name, error: `Daemon IPC error: ${err.message}` } });
            });
            
            socket.on('connect', () => {
              const req = { DownloadModel: { name, provider: providerPath } };
              socket.write(JSON.stringify(req) + '\n');
            });
          } catch (e) {
            channel.appendLine(`[HFD ERROR] Failed to spawn child process: ${e}`);
          }
          return;
        }

        if (msg && msg.type === 'codernic:request-llms') {
          // The UI is asking to refresh the models list
          broadcastLlms(
            (resp) => {
              if (ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify(resp));
              }
            },
            context,
            workspaceRoot,
          );
          broadcastRouteProfiles(
            (resp) => {
              if (ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify(resp));
              }
            },
            workspaceRoot,
          );
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

        if (msg && msg.type === 'codernic:generate-local-config') {
          const { modelId, file } = msg.payload || {};
          if (!file) return;
          
          const path = require('path');
          const fs = require('fs');
          
          const engineConfig = ConfigPaths.getEngineConfig();
          const providerPath = path.join(engineConfig.systemPaths.system_providers_dir, `${modelId}.provider.json`);
          const modelPath = path.join(engineConfig.systemPaths.system_models_download_dir, file);
          
          const fileName = path.basename(file);
          const folderName = path.dirname(file).split(path.sep).pop() || path.dirname(file);
          const displayName = modelId;

          const config = {
            id: `local-${modelId}`,
            type: "local-managed-llama",
            "local-managed-llama": {
              host: "127.0.0.1",
              port: 0,
              models: [
                {
                  id: modelId,
                  displayName: displayName,
                  fileName: fileName,
                  folderName: folderName,
                  contextWindow: 8192
                }
              ]
            }
          };

          try {
            if (!fs.existsSync(path.dirname(providerPath))) {
              fs.mkdirSync(path.dirname(providerPath), { recursive: true });
            }
            fs.writeFileSync(providerPath, JSON.stringify(config, null, 2), 'utf8');
            
            // Broadcast the update so UI refreshes LLM lists
            broadcastLlms(
              (resp) => {
                if (ws.readyState === WebSocket.OPEN) {
                  ws.send(JSON.stringify(resp));
                }
              },
              context,
              workspaceRoot,
            );
            
            // Send back a success message
            if (ws.readyState === WebSocket.OPEN) {
              ws.send(JSON.stringify({ type: 'codernic:local-config-generated', payload: { success: true } }));
            }
          } catch (e) {
            channel.appendLine(`[Local Models] Error generating config: ${e}`);
          }
          return;
        }

        if (msg && ['codernic:get-sessions', 'codernic:load-session', 'codernic:rename-session', 'codernic:delete-session', 'codernic:rebuild-index', 'codernic:update-session-schema', 'codernic:update-session-config'].includes(msg.type)) {
          const ipcPath = os.platform() === 'win32' ? '\\\\.\\pipe\\codernic_pipe' : '/tmp/codernic.sock';
          const socket = net.createConnection(ipcPath);
          let rawRes = '';
          socket.on('data', (d) => { 
            rawRes += d.toString(); 
            let newlineIdx;
            while ((newlineIdx = rawRes.indexOf('\n')) !== -1) {
              const line = rawRes.slice(0, newlineIdx).trim();
              rawRes = rawRes.slice(newlineIdx + 1);
              if (line.length === 0) continue;
              
              try {
                const res = JSON.parse(line);
                if (res && res.SessionsList) {
                  if (ws.readyState === WebSocket.OPEN) {
                    ws.send(JSON.stringify({ type: 'codernic:get-sessions-result', payload: res.SessionsList.sessions }));
                  }
                } else if (res && res.SessionLoaded) {
                  if (ws.readyState === WebSocket.OPEN) {
                    ws.send(JSON.stringify({ type: 'codernic:load-session-result', payload: res.SessionLoaded }));
                  }
                } else if (res && res.IndexingProgress) {
                  if (extStatusBar) {
                    extStatusBar.updateIndexStatus('indexing');
                  }
                  if (ws.readyState === WebSocket.OPEN) {
                    ws.send(JSON.stringify({ 
                      type: 'codernic:indexing-progress', 
                      payload: {
                        filesIndexed: res.IndexingProgress.files_indexed,
                        totalFiles: res.IndexingProgress.total_files,
                        percentage: res.IndexingProgress.percentage
                      }
                    }));
                  }
                } else if (res === 'Done' || (res && res.Done)) {
                  if (msg.type === 'codernic:rebuild-index' && extStatusBar) {
                    extStatusBar.updateIndexStatus('fresh');
                  }
                  if (msg.type !== 'codernic:rebuild-index') {
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
              } catch (e) {
                channel.appendLine(`[SVR WS] Error parsing session IPC response: ${e} line: ${line}`);
              }
            }
          });
          socket.on('end', () => {});
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
              req = { StartIndexing: { config: { root_path: workspaceRoot, pooling_strategy: "Mean", model_type: "AllMiniLML6V2", languages: null, exclude_patterns: null, respect_gitignore: true, json_output: true, max_concurrency: null } } };
            } else if (msg.type === 'codernic:update-session-schema') {
              req = { UpdateSessionSchema: { session_id: msg.payload.sessionId, schema: msg.payload.schema, project_root: workspaceRoot } };
            } else if (msg.type === 'codernic:update-session-config') {
              req = { UpdateSessionConfig: { 
                session_id: msg.payload.sessionId, 
                project_root: workspaceRoot,
                llm_id: msg.payload.llmId,
                use_rag: msg.payload.useRag,
                auto_pilot: msg.payload.autoPilot,
                current_mode: msg.payload.currentMode,
                erathos_schema: msg.payload.erathosSchema
              }};
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
          const ipcPath = os.platform() === 'win32' ? '\\\\.\\pipe\\codernic_pipe' : '/tmp/codernic.sock';
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
                    totalRamGb: health.total_ram_gb,
                    cpuCores: health.cpu_cores,
                    hasCuda: health.has_cuda,
                    hasRocm: health.has_rocm,
                    hasMetal: health.has_metal,
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
              const logMsg = `[SVR WS] OUT: ${debugReplyStr}`;
              channel.appendLine(logMsg);
              
              // We must send it directly over `ws` since `broadcastToUI` loops all clients
              // But it's fine to just use `ws.send` directly for the log message.
              ws.send(JSON.stringify({
                type: 'codernic:system-log-batch',
                payload: {
                  logs: [{ timestamp: new Date().toISOString(), message: logMsg }]
                }
              }));
            }
            ws.send(serialized);
          }
          
          const msgType = msg?.payload?.assetType || msg?.payload?.type;
          if (replyMsg && (replyMsg as any).type === 'codernic:asset-saved' && (msgType === 'config/llms' || msgType === 'llms')) {
            broadcastLlms(broadcastToUI, context, workspaceRoot);
            broadcastRouteProfiles(broadcastToUI, workspaceRoot);
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

  // Passive Heartbeat (5s)
  const heartbeatInterval = setInterval(async () => {
    try {
      const { queryDaemonStatus } = require('../workspace-setup');
      const status = await queryDaemonStatus();
      const isAlive = status !== null;
      broadcastToUI({ type: 'codernic:heartbeat', payload: { status: isAlive ? 'ok' : 'down' } });
      
      broadcastToUI({
        type: 'codernic:system-status',
        payload: {
          daemonStatus: isAlive ? 'running' : 'stopped',
          vramUsage: isAlive ? status.vram_used_gb : null,
          vramTotal: isAlive ? status.vram_total_gb : null,
          totalRam: isAlive ? status.total_ram_gb : null,
          cpuUsage: isAlive ? status.cpu_usage_pct : null,
        }
      });
    } catch (e) {
       // ignore
    }
  }, 5000);
  context.subscriptions.push({ dispose: () => clearInterval(heartbeatInterval) });

  // Nettoyage du serveur à la fermeture de l'extension
  context.subscriptions.push({ dispose: () => {
    try {
      wss.close();
      server.close();
    } catch (e) {
      // ignore
    }
  }});
  // ----------------------------------------------------------------

  return [broadcastToUI, mcpManager];
};
