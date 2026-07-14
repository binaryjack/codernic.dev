import * as vscode from 'vscode';
import type { LlmAdapter, StreamEvent } from './llm-adapter.interface';
import { extractJsonFromMarkdown } from './utils';

/**
 * Base interface for adapters that require the orchestrator to handle their tool loop.
 */
export interface SingleShotLlmAdapter {
  readonly id: string;
  streamChatSingle(
    messages: { role: string; content: string; tool_calls?: any[]; tool_call_id?: string; name?: string }[],
    options: { tools?: vscode.LanguageModelChatTool[]; uiMode?: 'ask' | 'plan' | 'agent' },
    onEvent: (event: StreamEvent) => void,
    cancellationToken: vscode.CancellationToken,
  ): Promise<{ assistantContent: string; toolCalls: { id: string; name: string; args: string; thought_signature?: string }[] }>;
}

/**
 * Wraps a SingleShotLlmAdapter to provide the recursive Tool Calling loop (up to MAX_TOOL_ITERATIONS).
 */
export class ToolOrchestrator implements LlmAdapter {
  public readonly id: string;

  private readonly innerAdapter: SingleShotLlmAdapter;

  constructor(innerAdapter: SingleShotLlmAdapter) {
    this.innerAdapter = innerAdapter;
    this.id = innerAdapter.id;
  }

  async streamChat(
    messages: { role: string; content: string; tool_calls?: any[]; tool_call_id?: string; name?: string }[],
    options: { tools?: vscode.LanguageModelChatTool[]; uiMode?: 'ask' | 'plan' | 'agent' },
    onEvent: (event: StreamEvent) => void,
    cancellationToken: vscode.CancellationToken,
    executeTool?: (name: string, args: Record<string, unknown>) => Promise<string>,
  ): Promise<void> {
    const currentMessages = [...messages];
    let iteration = 0;
    const MAX_TOOL_ITERATIONS = 40;

    while (iteration < MAX_TOOL_ITERATIONS) {
      iteration++;

      if (cancellationToken.isCancellationRequested) {
        break;
      }

      const { assistantContent, toolCalls } = await this.innerAdapter.streamChatSingle(
        currentMessages,
        options,
        onEvent,
        cancellationToken
      );

      if (toolCalls.length === 0) {
        // No tool calls, generation is complete
        break;
      }

      // Add assistant message with all tool calls
      const assistantMsg = {
        role: 'assistant',
        content: assistantContent || '',
        tool_calls: toolCalls.map((tc) => ({
          id: tc.id,
          type: 'function',
          function: { 
            name: tc.name, 
            arguments: tc.args,
            ...(tc.thought_signature ? { thought_signature: tc.thought_signature } : {})
          },
        })),
      };
      currentMessages.push(assistantMsg);

      if (executeTool) {
        for (const tc of toolCalls) {
          let argsObj = {};
          try {
            argsObj = extractJsonFromMarkdown(tc.args);
          } catch {
            /* Bad JSON */
          }

          onEvent({
            type: 'tool-call',
            toolCall: { name: tc.name, args: argsObj as Record<string, unknown> },
          });
          onEvent({
            type: 'tool-executed',
            toolCall: { name: tc.name, args: argsObj as Record<string, unknown> },
          });

          // Add timeout to tool execution
          const resultText = await Promise.race([
            executeTool(tc.name, argsObj as Record<string, unknown>),
            new Promise<string>((_, reject) =>
              setTimeout(() => reject(new Error(`Tool ${tc.name} timed out after 60s`)), 60000),
            ),
          ]).catch((err) => `Error: ${err instanceof Error ? err.message : String(err)}`);

          const toolResponse = {
            role: 'tool',
            tool_call_id: tc.id,
            name: tc.name,
            content: resultText,
          };
          currentMessages.push(toolResponse);
        }
      } else {
        break; // cannot execute tool, stop loop
      }
    }

    onEvent({ type: 'done' });
  }
}
