/**
 * @file mcp-client.types.ts
 * @description Type definitions for MCP client
 */

import type { Client } from '@modelcontextprotocol/sdk/client';
import type { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio';
import type { CallToolResult } from '@modelcontextprotocol/sdk/types';

/**
 * MCP content block base interface
 */
export interface McpContent {
  type: string;
  [key: string]: unknown;
}

/**
 * MCP text content block
 */
export interface McpTextContent extends McpContent {
  type: 'text';
  text: string;
}

/**
 * MCP client configuration
 */
export interface McpClientConfig {
  /** Path to the MCP server binary (ragtime_cli) */
  readonly serverPath: string;
  /** Project root directory to pass as cwd */
  readonly projectRoot: string;
  /** Optional arguments to pass to the server binary */
  readonly args?: string[];
  /** Optional logger for notifications */
  readonly logger?: { appendLine: (msg: string) => void };
}

/**
 * MCP client instance with transport
 */
export interface McpClientInstance {
  /** The MCP client instance */
  readonly client: Client;
  /** The stdio transport */
  readonly transport: StdioClientTransport;
  /** Cleanup function to close client and transport */
  readonly dispose: () => Promise<void>;
  /** Callback for when the connection is lost */
  onClose?: () => void;
}

/**
 * Tool call result from MCP server (use SDK type directly)
 */
export type McpToolResult = CallToolResult;

/**
 * Tool call options
 */
export interface McpToolCallOptions {
  /** Tool name to invoke */
  readonly name: string;
  /** Tool arguments as key-value pairs */
  readonly arguments?: Record<string, unknown>;
}
