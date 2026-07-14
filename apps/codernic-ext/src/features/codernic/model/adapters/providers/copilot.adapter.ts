import * as vscode from 'vscode';
import type { StreamEvent } from '../llm-adapter.interface';
import type { SingleShotLlmAdapter } from '../tool-orchestrator';

export class CopilotAdapter implements SingleShotLlmAdapter {
  public readonly id: string;
  private readonly overrideMode: 'manual' | 'auto' | null;

  constructor(
    id: string,
    overrideMode: 'manual' | 'auto' | null = null,
  ) {
    this.id = id;
    this.overrideMode = overrideMode;
  }

  async streamChatSingle(
    messages: { role: string; content: string; tool_calls?: any[]; tool_call_id?: string; name?: string }[],
    options: { tools?: vscode.LanguageModelChatTool[] },
    onEvent: (event: StreamEvent) => void,
    cancellationToken: vscode.CancellationToken,
  ): Promise<{ assistantContent: string; toolCalls: { id: string; name: string; args: string; thought_signature?: string }[] }> {
    let models: vscode.LanguageModelChat[] = [];
    if (this.overrideMode === 'manual' && this.id === 'manual-model-id') {
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

    const chatMessages: vscode.LanguageModelChatMessage[] = messages.map((h) => {
      if (h.role === 'system') return vscode.LanguageModelChatMessage.User(h.content);
      if (h.role === 'user') {
        if (h.tool_call_id && h.name) {
           return vscode.LanguageModelChatMessage.User([
              new vscode.LanguageModelToolResultPart(h.tool_call_id, [
                new vscode.LanguageModelTextPart(h.content)
              ])
           ]);
        }
        return vscode.LanguageModelChatMessage.User(h.content);
      }
      
      // role === assistant
      const parts: (vscode.LanguageModelTextPart | vscode.LanguageModelToolCallPart)[] = [];
      if (h.content) parts.push(new vscode.LanguageModelTextPart(h.content));
      if (h.tool_calls) {
        h.tool_calls.forEach(tc => {
            parts.push(new vscode.LanguageModelToolCallPart(tc.id, tc.function.name, JSON.parse(tc.function.arguments)));
        });
      }
      return vscode.LanguageModelChatMessage.Assistant(parts.length > 0 ? parts : h.content);
    });

    const reqOptions: vscode.LanguageModelChatRequestOptions =
      supportsTools && activeTools.length > 0 ? { tools: activeTools } : {};

    const response = await model.sendRequest(chatMessages, reqOptions, cancellationToken);

    const toolCalls: { id: string; name: string; args: string; thought_signature?: string }[] = [];
    let assistantContent = '';

    for await (const part of response.stream) {
      if (part instanceof vscode.LanguageModelTextPart) {
        assistantContent += part.value;
        onEvent({ type: 'token', chunk: part.value });
      } else if (part instanceof vscode.LanguageModelToolCallPart) {
        toolCalls.push({
          id: part.callId,
          name: part.name,
          args: typeof part.input === 'string' ? part.input : JSON.stringify(part.input)
        });
      }
    }

    return { assistantContent, toolCalls };
  }
}
