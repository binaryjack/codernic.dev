import * as vscode from 'vscode';
import type { LlmAdapter, LlmMessage, StreamEvent } from './custom-llm.types';

/**
 * Extrait un objet JSON valide même s'il est noyé dans du Markdown.
 */
export function extractJsonFromMarkdown<T>(rawLlmResponse: string): T {
  // 1. Nettoyage des balises Markdown (```json ... ``` ou ``` ... ```)
  const jsonBlockRegex = /```(?:json|JSON)?\s*([\s\S]*?)\s*```/i;
  const match = rawLlmResponse.match(jsonBlockRegex);

  const jsonString = match ? match[1] : rawLlmResponse;

  try {
    return JSON.parse(jsonString.trim()) as T;
  } catch (error) {
    // 2. Fallback aggressif : extraction de tout ce qui ressemble à un objet/tableau
    const fallbackRegex = /(\{[\s\S]*\}|\[[\s\S]*\])/;
    const fallbackMatch = jsonString.match(fallbackRegex);
    if (fallbackMatch) {
      return JSON.parse(fallbackMatch[0]) as T;
    }
    throw error;
  }
}

export class CopilotAdapter implements LlmAdapter {
  constructor(
    public readonly id: string,
    private readonly overrideMode: 'manual' | 'auto' | null = null,
  ) {}

  async streamChat(
    messages: { role: string; content: string }[],
    options: { tools?: vscode.LanguageModelChatTool[] },
    onEvent: (event: StreamEvent) => void,
    cancellationToken: vscode.CancellationToken,
    executeTool?: (name: string, args: Record<string, unknown>) => Promise<string>,
  ): Promise<void> {
    let models: vscode.LanguageModelChat[] = [];
    if (this.overrideMode === 'manual' && this.id === 'manual-model-id') {
      // Placeholder for manual model selection logic
      models = await vscode.lm.selectChatModels({ id: this.id });
    } else {
      models = await vscode.lm.selectChatModels({ id: this.id });
    }

    const model = models[0];

    if (!model) {
      throw new Error(`Model "${this.id}" is not available.`);
    }

    const supportsTools = (model as unknown as { toolCalling: boolean }).toolCalling !== false;
    const activeTools = options.tools ?? [];

    const chatMessages: vscode.LanguageModelChatMessage[] = messages.map((h) =>
      h.role === 'user' || h.role === 'system'
        ? vscode.LanguageModelChatMessage.User(h.content)
        : vscode.LanguageModelChatMessage.Assistant(h.content),
    );

    let iteration = 0;
    const MAX_TOOL_ITERATIONS = 10;

    while (iteration < MAX_TOOL_ITERATIONS) {
      iteration++;
      const reqOptions: vscode.LanguageModelChatRequestOptions =
        supportsTools && activeTools.length > 0 ? { tools: activeTools } : {};

      const response = await model.sendRequest(chatMessages, reqOptions, cancellationToken);

      const assistantParts: (vscode.LanguageModelTextPart | vscode.LanguageModelToolCallPart)[] =
        [];
      const toolCalls: vscode.LanguageModelToolCallPart[] = [];

      for await (const part of response.stream) {
        if (part instanceof vscode.LanguageModelTextPart) {
          assistantParts.push(part);
          onEvent({ type: 'token', chunk: part.value });
        } else if (part instanceof vscode.LanguageModelToolCallPart) {
          assistantParts.push(part);
          toolCalls.push(part);
        }
      }

      if (toolCalls.length === 0) {
        // If we have some text parts, we are done
        if (assistantParts.some((p) => p instanceof vscode.LanguageModelTextPart)) {
          break;
        }
        // If we have NOTHING (empty response), break to avoid infinite loop
        break;
      }

      chatMessages.push(vscode.LanguageModelChatMessage.Assistant(assistantParts));

      const toolResultParts: vscode.LanguageModelToolResultPart[] = [];
      for (const tc of toolCalls) {
        onEvent({
          type: 'tool-call',
          toolCall: { name: tc.name, args: tc.input as Record<string, unknown> },
        });

        if (executeTool) {
          onEvent({
            type: 'tool-executed',
            toolCall: { name: tc.name, args: tc.input as Record<string, unknown> },
          });

          // Add a timeout to tool execution to prevent hanging
          const toolResult = await Promise.race([
            executeTool(tc.name, tc.input as Record<string, unknown>),
            new Promise<string>((_, reject) =>
              setTimeout(() => reject(new Error(`Tool ${tc.name} timed out after 60s`)), 60000),
            ),
          ]).catch((err) => `Error: ${err instanceof Error ? err.message : String(err)}`);

          toolResultParts.push(
            new vscode.LanguageModelToolResultPart(tc.callId, [
              new vscode.LanguageModelTextPart(toolResult),
            ]),
          );
        } else {
          toolResultParts.push(
            new vscode.LanguageModelToolResultPart(tc.callId, [
              new vscode.LanguageModelTextPart(
                'Error: Tool execution not supported in this context',
              ),
            ]),
          );
        }
      }

      chatMessages.push(vscode.LanguageModelChatMessage.User(toolResultParts));
    }

    onEvent({ type: 'done' });
  }
}

export class McpInferenceAdapter implements LlmAdapter {
  constructor(
    public readonly id: string,
    private mcpManager: import('../../../shared/mcp').McpConnectionManager,
  ) {}

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
      // Robust extraction: custom:providerId:modelId -> we only want the modelId
      const parts = this.id.split(':');
      const modelId = parts.length > 2 ? parts.slice(2).join(':') : parts[parts.length - 1];

      let attempts = 0;
      const MAX_ATTEMPTS = 12; // Wait up to 60s (5s * 12)

      while (attempts < MAX_ATTEMPTS) {
        try {
          const result = await client.callTool({
            name: 'generate_completion',
            arguments: {
              modelId,
              messages: messages.map((m) => ({ role: m.role, content: m.content })),
              temperature: 0.7,
            },
          });

          const content = (result as any)?.content;
          const text = Array.isArray(content) ? content[0]?.text : '';

          if (text) {
            // Since we don't have real streaming through MCP tools yet,
            // we emit the whole block as a single token for now.
            onEvent({ type: 'token', chunk: text });
          }
          onEvent({ type: 'done' });
          return;
        } catch (e) {
          const errorMsg = String(e);
          if (errorMsg.includes('still loading')) {
            attempts++;
            onEvent({
              type: 'thinking',
              payload: {
                phase: 'loading',
                detail: `Chargement du modèle (VRAM/Vulkan)... Tentative ${attempts}/${MAX_ATTEMPTS}`,
              },
            } as any);
            // Wait 5 seconds before retrying
            await new Promise((resolve) => setTimeout(resolve, 5000));
            continue;
          }
          throw e;
        }
      }
      throw new Error('Timeout lors du chargement du modèle.');
    } catch (e) {
      throw new Error(`MCP Inference failed: ${e}`);
    }
  }
}

export class CustomFetchAdapter implements LlmAdapter {
  constructor(
    public readonly id: string,
    private baseUrl: string,
    private apiKey?: string,
    private modelName?: string,
    private providerType?: string,
  ) {}

  async streamChat(
    messages: { role: string; content: string }[],
    options: { tools?: vscode.LanguageModelChatTool[] },
    onEvent: (event: StreamEvent) => void,
    cancellationToken: vscode.CancellationToken,
    executeTool?: (name: string, args: Record<string, unknown>) => Promise<string>,
  ): Promise<void> {
    // Convert tools to OpenAI format
    const openaiTools = options.tools?.map((t) => ({
      type: 'function',
      function: {
        name: t.name,
        description: t.description,
        parameters: t.inputSchema,
      },
    }));

    const abortController = new AbortController();
    const tokenDisposable = cancellationToken.onCancellationRequested(() => {
      abortController.abort();
    });

    const isOllama = this.providerType === 'local-ollama';
    // If it's local-ollama, strip /v1 if user accidentally left it from OpenAI config
    const effectiveBaseUrl = isOllama ? this.baseUrl.replace(/\/v1\/?$/, '') : this.baseUrl;
    const endpoint = isOllama ? '/api/chat' : '/chat/completions';

    try {
      const currentMessages: LlmMessage[] = messages.map((m) => ({
        role: m.role,
        content: m.content,
      }));
      let iteration = 0;
      const MAX_TOOL_ITERATIONS = 10;

      while (iteration < MAX_TOOL_ITERATIONS) {
        iteration++;

        const hasTools = openaiTools && openaiTools.length > 0;

        const payload = {
          model: this.modelName || this.id,
          messages: currentMessages,
          stream: true,
          tools: hasTools ? openaiTools : undefined,
        };

        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
        };
        if (this.apiKey) {
          headers['Authorization'] = `Bearer ${this.apiKey}`;
        }

        try {
          const response = await fetch(`${effectiveBaseUrl}${endpoint}`, {
            method: 'POST',
            headers,
            body: JSON.stringify(payload),
            signal: abortController.signal,
          });

          if (!response.ok) {
            const errorBody = await response.text();
            try {
              const parsed = JSON.parse(errorBody);
              if (parsed.error && typeof parsed.error === 'object') {
                onEvent({ type: 'error', error: parsed.error });
                return;
              }
            } catch {
              // Not JSON, fall through
            }
            throw new Error(`HTTP error ${response.status}: ${errorBody || response.statusText}`);
          }

          if (!response.body) {
            throw new Error('Response body is empty');
          }

          const reader = response.body.getReader();
          const decoder = new TextDecoder();
          let buffer = '';

          // Maps to accumulate multiple tool calls
          const toolCallsMap = new Map<
            string | number,
            { id: string; name: string; args: string }
          >();

          let assistantContent = '';

          // eslint-disable-next-line no-constant-condition
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
              const trimmed = line.trim();
              if (!trimmed) continue;

              if (isOllama) {
                // Ollama native streaming returns NDJSON
                try {
                  const data = JSON.parse(trimmed);
                  if (data.message) {
                    if (data.message.content) {
                      assistantContent += data.message.content;
                      onEvent({ type: 'token', chunk: data.message.content });
                    }
                    if (data.message.tool_calls) {
                      for (const tc of data.message.tool_calls) {
                        const idx = tc.index ?? 0;
                        const existing = toolCallsMap.get(idx) || { id: '', name: '', args: '' };
                        if (tc.id) existing.id = tc.id;
                        if (tc.function?.name) existing.name = tc.function.name;
                        if (tc.function?.arguments) {
                          const args =
                            typeof tc.function.arguments === 'string'
                              ? tc.function.arguments
                              : JSON.stringify(tc.function.arguments);
                          existing.args += args;
                        }
                        // Ollama doesn't use call IDs natively the same way, but we generate one if needed
                        if (!existing.id)
                          existing.id = 'call_' + Math.random().toString(36).substr(2, 9);
                        toolCallsMap.set(idx, existing);
                      }
                    }
                  }
                  if (data.done) break;
                } catch (e) {
                  // Ignore parse errors on partial chunks
                }
              } else {
                // OpenAI SSE format
                if (trimmed === 'data: [DONE]') break;
                if (trimmed.startsWith('data: ')) {
                  try {
                    const data = JSON.parse(trimmed.slice(6));
                    const delta = data.choices[0]?.delta;

                    if (delta?.content) {
                      assistantContent += delta.content;
                      onEvent({ type: 'token', chunk: delta.content });
                    }

                    if (delta?.tool_calls) {
                      for (const tc of delta.tool_calls) {
                        const idx = tc.index ?? 0;
                        const existing = toolCallsMap.get(idx) || { id: '', name: '', args: '' };
                        if (tc.id) existing.id = tc.id;
                        if (tc.function?.name) existing.name = tc.function.name;
                        if (tc.function?.arguments) existing.args += tc.function.arguments;
                        toolCallsMap.set(idx, existing);
                      }
                    }
                  } catch (e) {
                    // Ignore parse errors on partial chunks
                  }
                }
              }
            }
          }

          const toolCalls = Array.from(toolCallsMap.values()).filter((tc) => tc.name);

          if (toolCalls.length === 0) {
            break; // No tool calls, we are done
          }

          // Add assistant message with all tool calls
          const assistantMsg: LlmMessage = {
            role: 'assistant',
            content: assistantContent || null,
            tool_calls: toolCalls.map((tc) => ({
              id: tc.id,
              type: 'function',
              function: { name: tc.name, arguments: tc.args },
            })),
          };
          currentMessages.push(assistantMsg);

          if (executeTool) {
            for (const tc of toolCalls) {
              let argsObj = {};
              try {
                // Remplacement de JSON.parse par l'extracteur sécurisé
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

              const toolResponse: LlmMessage = {
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
        } catch (err) {
          if (err instanceof Error && err.name === 'AbortError') {
            // Handled by cancellation token
            return;
          }
          onEvent({ type: 'error', error: err instanceof Error ? err.message : String(err) });
          return;
        }
      }

      onEvent({ type: 'done' });
    } finally {
      tokenDisposable.dispose();
    }
  }
}
