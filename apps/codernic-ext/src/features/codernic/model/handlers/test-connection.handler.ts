import type { MessageContext } from '../types/message-context.types';
import type { MessageHandler } from '../types/message-handler.types';

export const TestConnectionHandler = function (this: MessageHandler): void {};

TestConnectionHandler.prototype.handle = async function (
  this: MessageHandler,
  payload: any,
  context: MessageContext,
): Promise<void> {
  const { reply } = context;
  const { provider, model, reqId } = payload;

  try {
    if (provider.apiKey && typeof provider.apiKey === 'string' && provider.apiKey.startsWith('vault://')) {
        reply({ type: 'codernic:test-connection-result', payload: { reqId, status: '✅ Configured (Vault Secret)' } });
        return;
    }

    const isOllama = provider.type === 'local-ollama';
    const endpoint = isOllama ? '/api/tags' : '/models';
    let baseUrl = provider.baseUrl || '';
    
    if (provider.type === 'local-managed-llama') {
        const host = provider.host || '127.0.0.1';
        const port = model?.port || 8080;
        baseUrl = `http://${host}:${port}/v1`;
    }

    const cleanBaseUrl = isOllama ? baseUrl.replace(/\/v1\/?$/, '') : baseUrl;
    const finalUrl = `${cleanBaseUrl.replace(/\/chat\/completions$/, '')}${endpoint}`;

    const res = await fetch(finalUrl, {
      headers: { Authorization: `Bearer ${provider.apiKey || 'test'}` },
    });

    if (res.ok) {
        reply({ type: 'codernic:test-connection-result', payload: { reqId, status: '✅ Connected' } });
    } else {
        reply({ type: 'codernic:test-connection-result', payload: { reqId, status: `❌ Error: ${res.status}` } });
    }
  } catch (err: unknown) {
    reply({ type: 'codernic:test-connection-result', payload: { reqId, status: `❌ Unreachable` } });
  }
};
