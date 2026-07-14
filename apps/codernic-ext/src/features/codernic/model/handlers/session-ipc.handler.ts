import * as os from 'os';
import * as net from 'net';
import { MessageHandler } from '../types/message-handler.types';
import { MessageContext } from '../types/message-context.types';

export const SessionIpcHandler = function (this: MessageHandler, type: string): void {
  (this as any).type = type;
};

SessionIpcHandler.prototype.handle = async function (
  this: MessageHandler & { type: string },
  payload: unknown,
  context: MessageContext,
): Promise<void> {
  const { channel, workspaceRoot, reply } = context;
  const msgType = this.type;
  const msgPayload = payload as Record<string, any>;

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
          reply({ type: 'codernic:get-sessions-result', payload: res.SessionsList.sessions });
        } else if (res && res.SessionLoaded) {
          reply({ type: 'codernic:load-session-result', payload: res.SessionLoaded });
        } else if (res && res.IndexingProgress) {
          reply({ 
            type: 'codernic:indexing-progress', 
            payload: {
              filesIndexed: res.IndexingProgress.files_indexed,
              totalFiles: res.IndexingProgress.total_files,
              percentage: res.IndexingProgress.percentage
            }
          });
        } else if (res && res.SessionDeleted) {
          reply({ type: 'codernic:session-deleted', payload: res.SessionDeleted });
        } else if (res === 'Done' || (res && res.Done)) {
          if (msgType !== 'codernic:rebuild-index') {
            // Send a ping to refresh sessions
            const refreshSocket = net.createConnection(ipcPath);
            let refreshRes = '';
            refreshSocket.on('data', (d) => { refreshRes += d.toString(); });
            refreshSocket.on('end', () => {
              try {
                for (const l of refreshRes.trim().split('\n')) {
                  if (l.length === 0) continue;
                  const parsed = JSON.parse(l);
                  if (parsed && parsed.SessionsList) {
                    reply({ type: 'codernic:get-sessions-result', payload: parsed.SessionsList.sessions });
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
        channel.appendLine(`[SessionIpcHandler] Error parsing session IPC response: ${e} line: ${line}`);
      }
    }
  });
  
  socket.on('end', () => {});
  socket.on('error', (err) => {
    channel.appendLine(`[SessionIpcHandler] Session IPC error: ${err}`);
  });
  
  socket.on('connect', () => {
    let req = null;
    if (msgType === 'codernic:get-sessions') {
      req = { GetSessions: { project_root: workspaceRoot } };
    } else if (msgType === 'codernic:load-session') {
      req = { LoadSession: { id: msgPayload.id, project_root: workspaceRoot } };
    } else if (msgType === 'codernic:rename-session') {
      req = { RenameSession: { id: msgPayload.id, new_name: msgPayload.newName, project_root: workspaceRoot } };
    } else if (msgType === 'codernic:delete-session') {
      req = { DeleteSession: { id: msgPayload.id, project_root: workspaceRoot } };
    } else if (msgType === 'codernic:rebuild-index') {
      req = { StartIndexing: { config: { root_path: workspaceRoot, pooling_strategy: "Mean", model_type: "AllMiniLML6V2", languages: null, exclude_patterns: null, respect_gitignore: true, json_output: true, max_concurrency: null } } };
    } else if (msgType === 'codernic:update-session-schema') {
      req = { UpdateSessionSchema: { session_id: msgPayload.sessionId, schema: msgPayload.schema, project_root: workspaceRoot } };
    } else if (msgType === 'codernic:update-session-config') {
      req = { UpdateSessionConfig: { 
        session_id: msgPayload.sessionId, 
        project_root: workspaceRoot,
        llm_id: msgPayload.llmId,
        use_rag: msgPayload.useRag,
        auto_pilot: msgPayload.autoPilot,
        current_mode: msgPayload.currentMode,
        erathos_schema: msgPayload.erathosSchema
      }};
    }
    
    if (req) {
      socket.write(JSON.stringify(req) + '\n');
    } else {
      socket.end();
    }
  });
};
