import * as fs from 'fs';
import * as path from 'path';
import { createServer } from 'http';
import { VbsMcpServer } from '@atomos-web/structura-mcp';
import { PhaseActivator, BootstrapContext } from './types';
import { initMcpLifecycle } from '../shared/mcp/lifecycle';
import { CopilotHttpProxy } from '../shared/api/copilot-http-proxy';

export class InfrastructurePhase implements PhaseActivator {
  name = 'Infrastructure Phase';

  async activate(ctx: BootstrapContext): Promise<void> {
    const { vscodeContext, channel, workspaceRoot, mcpManager, networkConfig, extStatusBar } = ctx;

    const copilotProxy = new CopilotHttpProxy();
    vscodeContext.subscriptions.push(copilotProxy);
    copilotProxy.start().catch(err => {
      channel.appendLine(`[CopilotProxy] Failed to start local proxy: ${err}`);
    });

    if (workspaceRoot) {
      initMcpLifecycle(vscodeContext, mcpManager, workspaceRoot, extStatusBar, channel);
    }

    try {
      const atomosMcpServer = new (VbsMcpServer as unknown as new () => { connect: (transport: unknown) => Promise<void>, handleSSE: (req: unknown, res: unknown) => void, handleRequest: (req: unknown, res: unknown) => void })();
      const httpServer = createServer((req, res) => {
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
        
        if (req.method === 'OPTIONS') {
          res.writeHead(200);
          res.end();
          return;
        }

        if (req.method === 'GET' && req.url === '/events') {
          atomosMcpServer.handleSSE(req, res);
          return;
        }
        
        atomosMcpServer.handleRequest(req, res);
      });

      httpServer.listen(networkConfig.atomos_mcp_port, '127.0.0.1', () => {
        channel.appendLine(`[MCP] Atomos Structura MCP Server running on port ${networkConfig.atomos_mcp_port}`);
        
        if (workspaceRoot) {
          const codernicDir = path.join(workspaceRoot, '.codernic');
          if (fs.existsSync(codernicDir)) {
            const mcpJsonPath = path.join(codernicDir, 'mcp.json');
            const mcpConfig = {
              type: "sse",
              url: `http://127.0.0.1:${networkConfig.atomos_mcp_port}/events`
            };
            
            try {
              let existingConfig: { mcpServers?: Record<string, unknown> } = { mcpServers: {} };
              if (fs.existsSync(mcpJsonPath)) {
                try {
                  existingConfig = JSON.parse(fs.readFileSync(mcpJsonPath, 'utf8'));
                  if (!existingConfig.mcpServers) existingConfig.mcpServers = {};
                } catch (e) {}
              }
              existingConfig.mcpServers!["atomos-structura"] = mcpConfig;
              fs.writeFileSync(mcpJsonPath, JSON.stringify(existingConfig, null, 2), 'utf8');
              channel.appendLine(`[MCP] Registered atomos-structura in .codernic/mcp.json`);
            } catch (writeErr) {
              channel.appendLine(`[MCP] Failed to write mcp.json: ${writeErr}`);
            }
          }
        }
      });

      vscodeContext.subscriptions.push({
        dispose: () => httpServer.close()
      });
    } catch (err) {
      channel.appendLine(`[MCP] Failed to start Atomos Structura MCP Server: ${err}`);
    }
  }
}
