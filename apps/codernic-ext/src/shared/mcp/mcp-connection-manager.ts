import type { McpClientInstance } from './mcp-client.types';

export type McpConnectionState = 'disconnected' | 'connecting' | 'connected' | 'failed';

export type McpConnectionManager = {
  getState(): McpConnectionState;
  getClient(): McpClientInstance | null;
  connect(
    createClient: () => Promise<McpClientInstance>,
    timeoutMs: number,
  ): Promise<McpClientInstance | null>;
  disconnect(): Promise<void>;
};

/**
 * Creates an MCP connection manager with proper resource lifecycle management.
 * Uses AbortController to ensure timeout doesn't leave zombie processes.
 */
export const createMcpConnectionManager = (): McpConnectionManager => {
  let state: McpConnectionState = 'disconnected';
  let client: McpClientInstance | null = null;
  let abortController: AbortController | null = null;

  return {
    getState: () => state,
    getClient: () => client,

    connect: async (createClient, timeoutMs) => {
      // Prevent concurrent connections
      if (state === 'connecting') {
        return null;
      }

      // Cleanup existing connection if any
      if (client || abortController) {
        await disconnect();
      }

      state = 'connecting';
      abortController = new AbortController();
      const signal = abortController.signal;

      try {
        const timeoutPromise = new Promise<never>((_, reject) => {
          const timeoutId = setTimeout(() => {
            reject(new Error(`MCP connection timeout after ${timeoutMs}ms`));
          }, timeoutMs);

          // Clear timeout if connection is aborted
          signal.addEventListener('abort', () => clearTimeout(timeoutId));
        });

        const connectionPromise = createClient();

        // Race between connection and timeout
        client = await Promise.race([connectionPromise, timeoutPromise]);

        // If we got here and signal is aborted, connection was cancelled
        if (signal.aborted) {
          throw new Error('MCP connection aborted');
        }

        state = 'connected';
        return client;
      } catch (err) {
        state = 'failed';

        // Cleanup on failure
        if (abortController) {
          abortController.abort();
          abortController = null;
        }
        client = null;

        throw err;
      }
    },

    disconnect: async () => {
      return disconnect();
    },
  };

  async function disconnect(): Promise<void> {
    // Abort any pending connection
    if (abortController) {
      abortController.abort();
      abortController = null;
    }

    // Disconnect client if connected
    if (client) {
      try {
        await client.dispose();
      } catch {
        // Ignore errors during cleanup
      }
      client = null;
    }

    state = 'disconnected';
  }
};
