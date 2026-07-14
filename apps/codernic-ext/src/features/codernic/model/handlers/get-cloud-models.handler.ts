import * as os from 'os';
import * as net from 'net';
import type { MessageHandler } from '../types/message-handler.types';
import type { MessageContext } from '../types/message-context.types';

export const GetCloudModelsHandler = function (this: MessageHandler): void {};

GetCloudModelsHandler.prototype.handle = async function (
  this: MessageHandler,
  payload: unknown,
  context: MessageContext,
): Promise<void> {
  const { reply, channel } = context;
  
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
        if (res && res.CloudModelsResult) {
          reply({ type: 'codernic:cloud-models-result', payload: res.CloudModelsResult });
          socket.end();
        } else if (res && res.Error) {
          reply({ type: 'codernic:cloud-models-error', payload: { error: res.Error } });
          socket.end();
        }
      } catch (e) {
        channel.appendLine(`Error parsing get-cloud-models IPC: ${e}`);
      }
    }
  });

  socket.on('error', (err) => {
    reply({ type: 'codernic:cloud-models-error', payload: { error: `IPC Error: ${err.message}` } });
  });

  socket.on('connect', () => {
    socket.write(JSON.stringify('GetCloudModels') + '\n');
  });
};
