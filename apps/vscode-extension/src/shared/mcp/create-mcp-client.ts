/**
 * @file create-mcp-client.ts
 * @description Factory for creating MCP client instances with stdio transport
 */

import type {
  McpClientConfig,
  McpClientInstance,
  McpToolCallOptions,
  McpToolResult,
} from './mcp-client.types.js';
export type { McpClientInstance } from './mcp-client.types.js';

/**
 * Creates an MCP client connected to ai-kit-mcp server via stdio
 * @param config - Client configuration
 * @returns MCP client instance with dispose function
 */
export const createMcpClient = async function (
  config: McpClientConfig,
): Promise<McpClientInstance> {
  // Lazy-load the SDK so a missing module does NOT prevent extension activation
  const { Client } = await import('@modelcontextprotocol/sdk/client');
  const { StdioClientTransport } = await import('@modelcontextprotocol/sdk/client/stdio');
  const { LoggingMessageNotificationSchema } = await import('@modelcontextprotocol/sdk/types');

  const { serverPath, projectRoot } = config;

  // Strip debug flags to prevent identical port binding and remove Electron overrides
  const cleanEnv: Record<string, string | undefined> = {
    ...process.env,
    PROJECT_ROOT: projectRoot,
    TRUST_MODE: 'always', // 🛡️ Fix deadlock by ensuring Rust engine never awaits manual stdin approval in MCP mode
    TELEMETRY_PORT: '3001', // 📡 Standard telemetry port
    RAGTIME_PORT: '3000', // 🔍 Standard Ragtime search port
    TEST_COMMAND: 'npm test', // 🧪 Default test command (will be overridden by tech-registry if present)
  };
  delete cleanEnv['ELECTRON_RUN_AS_NODE'];
  if (cleanEnv['NODE_OPTIONS']) {
    cleanEnv['NODE_OPTIONS'] = cleanEnv['NODE_OPTIONS']
      .replace(/--inspect(?:-brk)?(?:=[^\s]+)?/g, '')
      .trim();
  }

  // Determine if we need to use 'node' or run the binary directly
  const isNodeScript =
    serverPath.endsWith('.js') || serverPath.endsWith('.cjs') || serverPath.endsWith('.mjs');
  const isRagtime = serverPath.endsWith('ragtime_cli') || serverPath.endsWith('ragtime_cli.exe');

  // Default arguments for Ragtime Rust Engine
  let spawnArgs = config.args || [];
  if (isRagtime && spawnArgs.length === 0) {
    spawnArgs = ['serve', '--mcp'];
  }

  // Create stdio transport to spawn the MCP server process
  const transport = new StdioClientTransport({
    command: isNodeScript ? 'node' : serverPath,
    args: isNodeScript ? [serverPath, ...spawnArgs] : spawnArgs,
    env: cleanEnv as Record<string, string>,
  });

  // Create client and connect
  const client = new Client(
    {
      name: 'codernic-ext',
      version: '0.2.7',
    },
    {
      capabilities: {
        sampling: {},
      },
    },
  );

  // Set a longer default timeout for requests (6 minutes)
  // as loading large LLM models into VRAM can take significant time
  (client as any)._requestTimeout = 360_000;

  await client.connect(transport);

  // Set up notification listener for logging
  client.setNotificationHandler(
    LoggingMessageNotificationSchema,
    (notification: { params: { logger?: string; data?: unknown; level?: string } }) => {
      const { params } = notification;
      if (params) {
        const loggerName = params.logger || 'System';
        const data = String(params.data || '');
        const level = params.level || 'info';

        if (config.logger) {
          config.logger.appendLine(`[${loggerName}] ${level.toUpperCase()}: ${data}`);
        }
      }
    },
  );

  const instance: McpClientInstance = {
    client,
    transport,
    dispose: async (): Promise<void> => {
      await client.close();
      await transport.close();
    },
  };

  // If transport closes unexpectedly, notify the instance
  transport.onclose = () => {
    if (instance.onClose) {
      instance.onClose();
    }
  };

  return instance;
};

/**
 * Calls an MCP tool and returns the result with a timeout
 * @param instance - MCP client instance
 * @param options - Tool call options
 * @returns Tool call result
 */
export const callMcpTool = async function (
  instance: McpClientInstance,
  options: McpToolCallOptions,
): Promise<McpToolResult> {
  const { client } = instance;
  const { name, arguments: args = {} } = options;

  // Add a 60s timeout to MCP tool calls to prevent hanging the chat
  const timeoutMs = 60000;

  const result = await Promise.race([
    client.callTool({
      name,
      arguments: args,
    }),
    new Promise<never>((_, reject) =>
      setTimeout(
        () => reject(new Error(`MCP tool call ${name} timed out after ${timeoutMs}ms`)),
        timeoutMs,
      ),
    ),
  ]);

  return result as McpToolResult;
};
