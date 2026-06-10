import type { LlmAdapter } from './llm-adapter.interface';
import { CopilotAdapter } from './providers/copilot.adapter';
import { CustomFetchAdapter } from './providers/http/custom-fetch.adapter';
import { McpInferenceAdapter } from './providers/mcp.adapter';
import { IpcEngineAdapter } from './providers/ipc-engine.adapter';
import { ToolOrchestrator } from './tool-orchestrator';

export class LlmAdapterFactory {
  /**
   * Instancie l'adaptateur approprié en fonction du type de provider et des infos du modèle.
   */
  static createAdapter(
    id: string,
    providerType: string | undefined,
    modelName: string | undefined,
    providerConfig: any | undefined,
    mcpManager: any | undefined,
    workspaceRoot: string,
    apiKey?: string
  ): LlmAdapter {
    const modelInfo = providerConfig?.models?.find((m: any) => m.id === modelName) || {};

    if (providerType === 'copilot') {
      const baseAdapter = new CopilotAdapter(id, 'auto');
      return new ToolOrchestrator(baseAdapter) as LlmAdapter;
    } 
    
    if (providerType === 'mcp-proxy' && mcpManager) {
      return new McpInferenceAdapter(id, mcpManager, modelInfo);
    } 
    
    if (providerType === 'local-ollama' || providerType === 'openai-compatible' || providerType === 'cloud-openai' || providerType === 'cloud-anthropic') {
      const baseUrl = modelInfo?.baseUrl || providerConfig?.baseUrl || providerConfig?.parameters?.baseUrl || 'http://localhost:11434';
      const actualApiKey = apiKey || providerConfig?.parameters?.apiKey;
      const baseAdapter = new CustomFetchAdapter(id, baseUrl, actualApiKey, modelName, providerType);
      return new ToolOrchestrator(baseAdapter) as LlmAdapter;
    }
    
    return new IpcEngineAdapter(id, workspaceRoot, modelName, providerConfig);
  }
}
