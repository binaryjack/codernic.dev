import * as os from 'os';
import * as net from 'net';
import type { MessageHandler } from '../types/message-handler.types';
import type { MessageContext } from '../types/message-context.types';

export const GetModelBenchmarksHandler = function (this: MessageHandler): void {};

GetModelBenchmarksHandler.prototype.handle = async function (
  this: MessageHandler,
  payload: unknown,
  context: MessageContext,
): Promise<void> {
  const { workspaceRoot, reply, channel } = context;
  const { models } = payload as { models: string[] };
  
  if (!workspaceRoot) {
    reply({ type: 'codernic:command-error', payload: { error: 'No workspace root' } });
    return;
  }

  const ipcPath = os.platform() === 'win32' ? '\\\\.\\pipe\\codernic_pipe' : '/tmp/codernic.sock';
  const socket = net.createConnection(ipcPath);
  let rawRes = '';

  socket.on('data', (d) => {
    rawRes += d.toString();
    let newlineIdx;
    while ((newlineIdx = rawRes.indexOf('\n')) !== -1) {
      const line = rawRes.slice(0, newlineIdx).trim();
      rawRes = rawRes.slice(newlineIdx + 1);
      if (!line) continue;
      
      try {
        const res = JSON.parse(line);
        if (res && res.ModelBenchmarks) {
          reply({ type: 'codernic:model-benchmarks-result', payload: res.ModelBenchmarks });
          socket.end();
        } else if (res && res.Error) {
          reply({ type: 'codernic:command-error', payload: { error: res.Error } });
          socket.end();
        }
      } catch (e) {
        channel.appendLine(`Error parsing benchmarks IPC: ${e}`);
      }
    }
  });

  socket.on('error', (err) => {
    reply({ type: 'codernic:command-error', payload: { error: `IPC Error: ${err.message}` } });
  });

  socket.on('connect', () => {
    socket.write(JSON.stringify({ GetModelBenchmarks: { models, project_root: workspaceRoot } }) + '\n');
  });
};
