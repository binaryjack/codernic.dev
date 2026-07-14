import type * as vscode from 'vscode';

export type ProviderType =
  | 'cloud-openai'
  | 'cloud-anthropic'
  | 'local-ollama'
  | 'local-custom'
  | 'local-managed-llama'
  | 'openai-compatible'
  | 'cloud-google';

export interface LlmProvider {
  id: string;
  name: string;
  type: ProviderType;
  baseUrl?: string;
  // Infrastructure fields for Managed Llama
  llamaCppPath?: string;
  host?: string;
  parameters?: Record<string, any>;
  apiKey?: string;
}

export interface CustomLlmModel {
  id: string;
  providerId: string;
  name: string;
  port?: number;
  maxTokens?: number;
  temperature?: number;
  isCustom: true;
  // Brain fields for Managed Llama
  displayName?: string;
  fileName?: string;
  folderName?: string;
  mmprojFileName?: string;
  gpuLayers?: number;
  contextSize?: number;
  threads?: number;
  flashAttn?: boolean;
  vramRequiredGb?: number;
  ctk?: string;
  ctv?: string;
  parameters?: Record<string, any>;
  isMissing?: boolean;
}

export interface StreamEvent {
  type: 'token' | 'tool-call' | 'tool-executed' | 'error' | 'thinking' | 'done' | 'ui-lock' | 'ui-unlock' | 'status';
  chunk?: string;
  text?: string; // For status events
  payload?: any; // For thinking events
  toolCall?: { name: string; args: Record<string, unknown>; success?: boolean; result?: string };
  error?: string;
}

export interface LlmMessage {
  role: string;
  content: string | null;
  name?: string;
  tool_call_id?: string;
  tool_calls?: Array<{
    id: string;
    type: 'function';
    function: { name: string; arguments: string };
  }>;
}

export interface LlmAdapter {
  id: string;
  streamChat(
    messages: { role: string; content: string }[],
    options: { tools?: vscode.LanguageModelChatTool[]; uiMode?: 'ask' | 'plan' | 'agent' },
    onEvent: (event: StreamEvent) => void,
    cancellationToken: vscode.CancellationToken,
    executeTool?: (name: string, args: Record<string, unknown>) => Promise<string>,
  ): Promise<void>;
}
