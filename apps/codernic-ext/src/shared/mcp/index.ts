/**
 * @file index.ts
 * @description MCP client module exports
 */

export { callMcpTool, createMcpClient } from './create-mcp-client.js';
export { findMcpBinary } from './find-mcp-binary.js';
export type {
  McpClientConfig,
  McpClientInstance,
  McpContent,
  McpTextContent,
  McpToolCallOptions,
  McpToolResult,
} from './mcp-client.types.js';
export {
  createMcpConnectionManager,
  type McpConnectionManager,
  type McpConnectionState,
} from './mcp-connection-manager.js';
