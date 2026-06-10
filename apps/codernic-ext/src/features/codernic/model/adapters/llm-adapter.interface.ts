import * as vscode from 'vscode';

export type StreamEvent =
  | { type: 'token'; chunk: string; taskId?: string }
  | { type: 'task-ready'; taskId: string }
  | { type: 'error'; error: string }
  | { type: 'status'; text: string }
  | { type: 'tool-call'; toolCall: { name: string; args: Record<string, unknown> } }
  | { type: 'tool-executed'; toolCall: { name: string; args: Record<string, unknown> } }
  | { type: 'ui-lock' }
  | { type: 'ui-unlock' }
  | { type: 'done' }
  | { type: 'thinking'; payload: { phase: string; detail: string } };

export interface LlmAdapter {
  readonly id: string;
  streamChat(
    messages: { role: string; content: string }[],
    options: { tools?: vscode.LanguageModelChatTool[]; uiMode?: 'ask' | 'plan' | 'agent' },
    onEvent: (event: StreamEvent) => void,
    cancellationToken: vscode.CancellationToken,
    executeTool?: (name: string, args: Record<string, unknown>) => Promise<string>,
  ): Promise<void>;
}
