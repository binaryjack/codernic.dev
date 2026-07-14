import * as http from 'http';
import * as vscode from 'vscode';

let globalProxyPort = 0;

export function getCopilotProxyPort(): number {
  return globalProxyPort;
}

export class CopilotHttpProxy implements vscode.Disposable {
  private server: http.Server | null = null;
  public port: number = 0;

  constructor() {}

  public async start(): Promise<number> {
    return new Promise((resolve, reject) => {
      this.server = http.createServer((req, res) => this.handleRequest(req, res));
      
      this.server.on('error', (err) => {
        console.error('[CopilotHttpProxy] Server error:', err);
        reject(err);
      });

      // Bind to any available random port on localhost
      this.server.listen(0, '127.0.0.1', () => {
        const address = this.server?.address();
        if (address && typeof address === 'object') {
          this.port = address.port;
          globalProxyPort = this.port;
          console.log(`[CopilotHttpProxy] Started on http://127.0.0.1:${this.port}`);
          resolve(this.port);
        } else {
          reject(new Error('Failed to bind CopilotHttpProxy'));
        }
      });
    });
  }

  private async handleRequest(req: http.IncomingMessage, res: http.ServerResponse) {
    if (req.method === 'POST' && req.url === '/v1/chat/completions') {
      let body = '';
      req.on('data', chunk => { body += chunk.toString(); });
      req.on('end', async () => {
        try {
          const payload = JSON.parse(body);
          await this.streamCopilotCompletion(payload, res);
        } catch (err) {
          console.error('[CopilotHttpProxy] Error processing request:', err);
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: String(err) }));
        }
      });
    } else {
      res.writeHead(404);
      res.end('Not Found');
    }
  }

  private async streamCopilotCompletion(payload: any, res: http.ServerResponse) {
    // Determine the requested Copilot model (fallback to whatever is available if not strictly matching)
    const allModels = await vscode.lm.selectChatModels();
    let model = allModels.find(m => m.id === payload.model || m.name === payload.model);
    if (!model) {
      // Default to the first copilot model
      model = allModels.find(m => m.vendor === 'copilot' || m.id.startsWith('copilot'));
    }

    if (!model) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'No GitHub Copilot model available. Ensure you are signed in.' }));
      return;
    }

    // Convert OpenAI messages format to VS Code LM LanguageModelChatMessage
    const messages = (payload.messages || []).map((m: any) => {
      if (m.role === 'system') return vscode.LanguageModelChatMessage.User(m.content); // VS Code LM treats system as user sometimes, but we can use generic or just use User. Wait, VS Code does have system role sometimes, but LanguageModelChatMessage.User or Assistant is standard. Let's use User and Assistant.
      if (m.role === 'assistant') return vscode.LanguageModelChatMessage.Assistant(m.content);
      return vscode.LanguageModelChatMessage.User(m.content);
    });

    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive'
    });

    try {
      const cts = new vscode.CancellationTokenSource();
      const response = await model.sendRequest(messages, {}, cts.token);

      for await (const chunk of response.text) {
        // Construct OpenAI SSE chunk
        const sseChunk = {
          id: 'chatcmpl-copilot',
          object: 'chat.completion.chunk',
          created: Math.floor(Date.now() / 1000),
          model: model.id,
          choices: [{
            index: 0,
            delta: { content: chunk },
            finish_reason: null
          }]
        };
        res.write(`data: ${JSON.stringify(sseChunk)}\n\n`);
      }

      // Send the finish reason chunk
      const endChunk = {
        id: 'chatcmpl-copilot',
        object: 'chat.completion.chunk',
        created: Math.floor(Date.now() / 1000),
        model: model.id,
        choices: [{
          index: 0,
          delta: {},
          finish_reason: 'stop'
        }]
      };
      res.write(`data: ${JSON.stringify(endChunk)}\n\n`);
      res.write(`data: [DONE]\n\n`);
      res.end();
    } catch (err) {
      console.error('[CopilotHttpProxy] Streaming error:', err);
      // We can't change HTTP status since we already sent 200 OK headers.
      res.end();
    }
  }

  public dispose() {
    if (this.server) {
      this.server.close();
      this.server = null;
    }
  }
}
