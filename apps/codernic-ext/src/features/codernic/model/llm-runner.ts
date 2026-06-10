/** llm-runner.ts — Executes LLM requests with automated tool-call loops using LlmAdapters. */

import * as vscode from 'vscode';
import { executeWorkspaceTool, WORKSPACE_TOOLS } from '../../../shared/api/workspace-tools';
import type { McpConnectionManager } from '../../../shared/mcp';
import type { LlmAdapter } from './adapters';
import { LlmAdapterFactory } from './adapters';
import { LlmConfigRepository } from './llm-repository';

export interface LlmResponse {
  text: string;
  costHint: number;
}

let globalContext: vscode.ExtensionContext | undefined;
let globalMcpManager: McpConnectionManager | undefined;

/**
 * Initializes the LLM runner with context and MCP manager references
 */
export function initLlmRunner(context: vscode.ExtensionContext, mcpManager: McpConnectionManager) {
  globalContext = context;
  globalMcpManager = mcpManager;
}

/**
 * Executes a structured LLM request with tool support using the appropriate adapter.
 */
export async function callLlm(
  llmId: string,
  systemPrompt: string,
  userMessage: string,
  workspaceRoot: string,
  onLog: (line: string) => void,
): Promise<LlmResponse> {
  const cts = new vscode.CancellationTokenSource();
  try {
    let adapter: LlmAdapter;

    // Resolve the appropriate LlmAdapter based on provider settings
    if (llmId.startsWith('custom:')) {
      const [, providerId, modelId] = llmId.split(':');
      if (!workspaceRoot) throw new Error('Workspace root required for custom models');
      const providers = await LlmConfigRepository.loadAllProviders(workspaceRoot);
      const provider = providers.find((p) => p.id === providerId);
      if (!provider) throw new Error(`Provider ${providerId} not found`);

      if (provider.type === 'openai-compatible' || provider.type === 'local-ollama') {
         if (globalContext && !provider.parameters?.apiKey) {
            const secretKey = await globalContext.secrets.get(`agencee.provider.${providerId}.key`);
            if (secretKey) {
                provider.parameters = { ...provider.parameters, apiKey: secretKey };
            }
         }
      }

      adapter = LlmAdapterFactory.createAdapter(
          llmId,
          provider.type,
          modelId,
          provider,
          globalMcpManager,
          workspaceRoot
      );
    } else {
      adapter = LlmAdapterFactory.createAdapter(llmId, 'copilot', undefined, undefined, undefined, workspaceRoot);
    }

    const chatMessages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userMessage },
    ];

    let text = '';

    onLog(`[llm-runner] Starting completion via adapter: ${adapter.id}`);

    await adapter.streamChat(
      chatMessages,
      { tools: WORKSPACE_TOOLS },
      (event) => {
        if (event.type === 'token' && event.chunk) {
          text += event.chunk;
        } else if (event.type === 'tool-call' && event.toolCall) {
          onLog(`[llm-runner] tool call: ${event.toolCall.name}(${JSON.stringify(event.toolCall.args).slice(0, 80)})`);
        } else if (event.type === 'error' && event.error) {
          onLog(`[llm-runner] adapter error: ${event.error}`);
        }
      },
      cts.token,
      async (name, args) => {
        const mcpClient = globalMcpManager?.getClient() ?? undefined;
        onLog(`[llm-runner] executing tool: ${name}`);
        const result = await executeWorkspaceTool(name, args, workspaceRoot, mcpClient, cts.token);
        onLog(`[llm-runner] tool result size: ${result.length} chars`);
        return result;
      },
    );

    const costHint = (text.length / 4 / 1_000_000) * 3;
    return { text, costHint };
  } finally {
    cts.dispose();
  }
}
