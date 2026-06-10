import * as vscode from 'vscode';
import type { LlmAdapter, StreamEvent } from '../llm-adapter.interface';

const EXECUTION_PLAN_SCHEMA = JSON.stringify({
  type: "object",
  properties: {
    project_root: { type: "string" },
    steps: {
      type: "array",
      items: {
        type: "object",
        properties: {
          id: { type: "string" },
          depends_on: { type: "array", items: { type: "string" } },
          strategy: { type: "string" },
          parameters: { type: "object" },
          validation: {
            type: "object",
            properties: {
              strategy: { type: "string" },
              parameters: { type: "object" }
            },
            required: ["strategy", "parameters"]
          },
          retry_policy: {
            type: "object",
            properties: {
              max_attempts: { type: "integer" }
            },
            required: ["max_attempts"]
          }
        },
        required: ["id", "depends_on", "strategy", "parameters", "validation", "retry_policy"]
      }
    }
  },
  required: ["project_root", "steps"]
});

export class McpInferenceAdapter implements LlmAdapter {
  public readonly id: string;
  private mcpManager: import('../../../../../shared/mcp').McpConnectionManager;
  private readonly modelInfo?: any;

  constructor(
    id: string,
    mcpManager: import('../../../../../shared/mcp').McpConnectionManager,
    modelInfo?: any
  ) {
    this.id = id;
    this.mcpManager = mcpManager;
    this.modelInfo = modelInfo;
  }

  async streamChat(
    messages: { role: string; content: string }[],
    options: { tools?: vscode.LanguageModelChatTool[]; uiMode?: 'ask' | 'plan' | 'agent' },
    onEvent: (event: StreamEvent) => void,
    cancellationToken: vscode.CancellationToken,
    _executeTool?: (name: string, args: Record<string, unknown>) => Promise<string>,
  ): Promise<void> {
    const client = this.mcpManager.getClient()?.client;
    if (!client) {
      throw new Error('MCP Client not connected');
    }

    try {
      const parts = this.id.split(':');
      const modelId = parts.length > 2 ? parts.slice(2).join(':') : parts[parts.length - 1];
      const providerId = parts.length > 1 ? parts[1] : undefined;

      if (providerId) {
        client.callTool({
          name: 'manage_llm',
          arguments: { providerId, modelId, action: 'start' },
        }).catch(() => { /* ignore */ });
      }

      let attempts = 0;
      const MAX_ATTEMPTS = 120;
      const POLL_INTERVAL_MS = 5000;
      const startTime = Date.now();
      
      const temperature = this.modelInfo?.parameters?.temperature ?? 0.0;

      while (attempts < MAX_ATTEMPTS) {
        if (cancellationToken.isCancellationRequested) {
          throw new Error('Cancelled by user');
        }

        try {
          const jsonSchema = options.uiMode === 'plan' ? EXECUTION_PLAN_SCHEMA : undefined;
          const result = await client.callTool(
            {
              name: 'generate_completion',
              arguments: {
                modelId,
                messages: messages.map((m) => ({ role: m.role, content: m.content })),
                temperature,
                jsonSchema,
              },
            },
            undefined,
            { timeout: 360000 },
          );

          const content = (result as any)?.content;
          const text = Array.isArray(content) ? content[0]?.text : '';

          if (text) {
            onEvent({ type: 'token', chunk: text });
          }
          onEvent({ type: 'done' });
          return;
        } catch (e) {
          const errorMsg = String(e);
          if (errorMsg.includes('still loading') || errorMsg.includes('still loading')) {
            attempts++;
            const elapsedSec = Math.round((Date.now() - startTime) / 1000);
            const elapsedMin = Math.floor(elapsedSec / 60);
            const elapsedRemSec = elapsedSec % 60;
            const elapsedLabel = elapsedMin > 0
              ? `${elapsedMin}m ${elapsedRemSec}s`
              : `${elapsedSec}s`;
            onEvent({
              type: 'thinking',
              payload: {
                phase: 'loading',
                detail: `Loading model into VRAM... (${elapsedLabel} elapsed — large models may take several minutes)`,
              },
            } as any);
            await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
            continue;
          }
          throw e;
        }
      }
      throw new Error('Model loading timed out after 10 minutes.');
    } catch (e) {
      throw new Error(`MCP Inference failed: ${e}`);
    }
  }
}
