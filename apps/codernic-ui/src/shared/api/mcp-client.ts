import { getErathosMcpUrl } from '../../shared/config';

export async function callMcpTool(method: string, params: any): Promise<any> {
  return new Promise((resolve, reject) => {
    // Determine the WS url: replace http with ws if needed, ensure /ws
    let url = getErathosMcpUrl();
    if (!url.endsWith('/ws')) url += '/ws';
    url = url.replace('http://', 'ws://').replace('https://', 'wss://');
    
    const ws = new WebSocket(url);
    const id = Date.now().toString();

    ws.onopen = () => {
      ws.send(JSON.stringify({
        jsonrpc: "2.0",
        method: "tools/call",
        params: {
          name: method,
          arguments: params
        },
        id: id
      }));
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.id === id) {
          ws.close();
          if (data.error) {
            reject(new Error(data.error.message || 'MCP Tool Error'));
          } else {
            resolve(data.result);
          }
        }
      } catch(e) {
        // ignore parsing errors
      }
    };

    ws.onerror = (err) => {
      ws.close();
      reject(err);
    };
  });
}
