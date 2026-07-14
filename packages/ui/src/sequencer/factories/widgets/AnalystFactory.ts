import { createModelsState, createSessionsState, createDagState } from '@binaryjack/state-factories';

export const DEMO_ANALYST_SESSION_ID = 'demo-analyst-session';

export class AnalystFactory {
  static createMockSearchResultsAction() {
    const state = createModelsState({
      searchState: {
        isSearching: false,
        error: null,
        query: '',
        source: 'huggingface',
        match: 'c',
        type: 'all',
        models: [
          {
            id: 'Qwen2-7B-Instruct-GGUF',
            downloads: 14500,
            likes: 850,
            tags: ['text-generation', 'qwen'],
            gguf_files: [{ name: 'qwen2-7b-instruct-q4_k_m.gguf', size: 4860000000 }],
            isConfigured: true,
            isMissing: false
          },
          {
            id: 'Llama-3-8B-Instruct-GGUF',
            downloads: 89000,
            likes: 3400,
            tags: ['text-generation', 'llama'],
            gguf_files: [{ name: 'Meta-Llama-3-8B-Instruct.Q4_K_M.gguf', size: 4800000000 }],
            isConfigured: false,
            isMissing: false
          },
          {
            id: 'Phi-3-mini-4k-instruct-GGUF',
            downloads: 24000,
            likes: 920,
            tags: ['text-generation', 'phi'],
            gguf_files: [{ name: 'Phi-3-mini-4k-instruct-q4.gguf', size: 2200000000 }],
            isConfigured: true,
            isMissing: true,
            fileName: 'Phi-3-mini-4k-instruct-q4.gguf',
            configPath: '/home/tadeop/.codernic/models/config/phi-3.provider.json'
          } as any
        ] as any
      }
    } as any) as any;
    return {
      type: 'models/setSearchResults',
      payload: { models: state.searchState.models, error: null }
    };
  }

  static createSetLocalModelsAction() {
    const state = createModelsState({
      localModels: [
        { name: 'qwen2-7b-instruct-q4_k_m.gguf', sizeBytes: 4860000000 },
        { name: 'Meta-Llama-3-8B-Instruct.Q4_K_M.gguf', sizeBytes: 4800000000 }
      ] as any
    } as any);
    return {
      type: 'models/setLocalModels',
      payload: state.localModels
    };
  }

  static createCloudModelsAction() {
    // This goes to assets state technically, but we didn't use createAssetsState. 
    // We can just keep it as is or use createAssetsState if it exists.
    return {
      type: 'assets/setCloudModels',
      payload: [
        { id: 'gpt-4o', name: 'GPT-4o', provider: 'OpenAI', tier: 'High' },
        { id: 'claude-3-opus', name: 'Claude 3 Opus', provider: 'Anthropic', tier: 'High' },
        { id: 'llama-3', name: 'Llama 3 70B', provider: 'Meta', tier: 'Medium' }
      ]
    };
  }

  static createMockAnalystSessionAction() {
    const state = createSessionsState({
      sessions: {
        [DEMO_ANALYST_SESSION_ID]: {
          id: DEMO_ANALYST_SESSION_ID,
          name: 'Analyst Demo Session',
          status: 'idle',
          last_updated: Date.now()
        } as any
      }
    } as any);
    return {
      type: 'sessions/setSessions',
      payload: state.sessions
    };
  }

  static createSetCurrentAnalystSessionAction() {
    return {
      type: 'sessions/setCurrentSessionId',
      payload: DEMO_ANALYST_SESSION_ID
    };
  }

  static createAnalyseProgressAction() {
    const state = createDagState({
      analyseProgressBySession: {
        [DEMO_ANALYST_SESSION_ID]: {
          steps: {
            'tech-identification': 'done',
            'convention-mining': 'running',
            'agent-generation': 'pending'
          },
          currentStep: null,
          totalCostUSD: 0.0032,
          profile: 'standard'
        } as any
      }
    } as any);
    return {
      type: 'dag/setAnalyseProgress',
      payload: {
        sessionId: DEMO_ANALYST_SESSION_ID,
        progress: state.analyseProgressBySession[DEMO_ANALYST_SESSION_ID]
      }
    };
  }
}
