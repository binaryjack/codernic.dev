import * as os from 'os';
import * as net from 'net';
import type { MessageHandler } from '../types/message-handler.types';
import type { MessageContext } from '../types/message-context.types';

export const AddCloudModelHandler = function (this: MessageHandler): void {};

AddCloudModelHandler.prototype.handle = async function (
  this: MessageHandler,
  payload: unknown,
  context: MessageContext,
): Promise<void> {
  const { reply, channel } = context;
  const { providerId, model, transactionId } = payload as { providerId: string; model: any; transactionId?: string };
  
  if (!providerId || !model) {
    reply({ type: 'codernic:command-error', payload: { error: 'Missing providerId or model payload', transactionId } });
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
        if (res && res.AddCloudModelResult) {
          reply({ type: 'codernic:add-cloud-model-result', payload: { result: res.AddCloudModelResult, transactionId } });
          socket.end();
        } else if (res && res.Error) {
          reply({ type: 'codernic:command-error', payload: { error: res.Error, transactionId } });
          socket.end();
        }
      } catch (e) {
        channel.appendLine(`Error parsing add-cloud-model IPC: ${e}`);
      }
    }
  });

  socket.on('error', (err) => {
    reply({ type: 'codernic:command-error', payload: { error: `IPC Error: ${err.message}`, transactionId } });
  });

  socket.on('connect', () => {
    socket.write(JSON.stringify({ AddCloudModel: { provider_id: providerId, model: model } }) + '\n');
  });
};
