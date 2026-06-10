import * as vscode from 'vscode';
import type { StreamEvent } from '../../llm-adapter.interface';
import type { SingleShotLlmAdapter } from '../../tool-orchestrator';
import type { StreamParserStrategy } from './parsers/stream-parser.interface';
import { OllamaStreamParser } from './parsers/ollama.parser';
import { OpenAiStreamParser } from './parsers/openai.parser';

export class CustomFetchAdapter implements SingleShotLlmAdapter {
  public readonly id: string;
  private baseUrl: string;
  private apiKey?: string;
  private modelName?: string;
  private providerType?: string;

  constructor(
    id: string,
    baseUrl: string,
    apiKey?: string,
    modelName?: string,
    providerType?: string,
  ) {
    this.id = id;
    this.baseUrl = baseUrl;
    this.apiKey = apiKey;
    this.modelName = modelName;
    this.providerType = providerType;
  }

  async streamChatSingle(
    messages: { role: string; content: string; tool_calls?: any[]; tool_call_id?: string; name?: string }[],
    options: { tools?: vscode.LanguageModelChatTool[] },
    onEvent: (event: StreamEvent) => void,
    cancellationToken: vscode.CancellationToken,
  ): Promise<{ assistantContent: string; toolCalls: { id: string; name: string; args: string }[] }> {
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
    const effectiveBaseUrl = isOllama ? this.baseUrl.replace(/\/v1\/?$/, '') : this.baseUrl;
    const endpoint = isOllama ? '/api/chat' : '/chat/completions';

    const hasTools = openaiTools && openaiTools.length > 0;
    const payload = {
      model: this.modelName || this.id,
      messages,
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
            return { assistantContent: '', toolCalls: [] };
          }
        } catch {
          // Not JSON
        }
        throw new Error(`HTTP error ${response.status}: ${errorBody || response.statusText}`);
      }

      if (!response.body) {
        throw new Error('Response body is empty');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      const parser: StreamParserStrategy = isOllama ? new OllamaStreamParser() : new OpenAiStreamParser();
      let finalToolCalls: { id: string; name: string; args: string }[] = [];
      let finalAssistantContent = '';

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

          const result = parser.parseChunk(trimmed, onEvent);
          finalToolCalls = result.toolCalls;
          finalAssistantContent = result.assistantContent;

          if (result.isDone) {
            return { assistantContent: finalAssistantContent, toolCalls: finalToolCalls };
          }
        }
      }

      return { assistantContent: finalAssistantContent, toolCalls: finalToolCalls };
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        return { assistantContent: '', toolCalls: [] };
      }
      onEvent({ type: 'error', error: err instanceof Error ? err.message : String(err) });
      return { assistantContent: '', toolCalls: [] };
    } finally {
      tokenDisposable.dispose();
    }
  }
}
