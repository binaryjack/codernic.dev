/** llm.types.ts — Types for LLM providers and models. */

export type LlmProviderType =
  | 'local-managed-llama'
  | 'local-ollama'
  | 'cloud-openai'
  | 'cloud-anthropic'
  | 'cloud-google'
  | 'local-custom'
  | 'copilot';

export interface LlmModel {
  id: string;
  name: string;
  port: number;
  gpuLayers: number;
  contextSize: number;
  threads: number;
  flashAttn: boolean;
  ctk: string;
  ctv: string;
  vramRequiredGb: number;
  modelPath?: string;
  mmprojPath?: string;
  isCustom?: boolean;
}

export interface LlmProvider {
  id: string;
  name: string;
  type: LlmProviderType;
  host?: string;
  baseUrl?: string;
  apiKey?: string;
  llamaCppPath?: string;
  models: LlmModel[];
}

export interface ManagedLlmStatus {
  status: 'stopped' | 'starting' | 'running' | 'error' | 'loading';
  error?: string;
}
