import { createAssetsState } from '@binaryjack/state-factories';

export class SettingsFactory {
  static createPopulateAction() {
    const state = createAssetsState({
      agents: {
        'agent-1': { id: 'agent-1', name: 'Frontend Developer', description: 'React expert' },
        'agent-2': { id: 'agent-2', name: 'Backend Engineer', description: 'NodeJS specialist' }
      },
      dags: {
        'dag-1': { id: 'dag-1', name: 'Code Review Workflow', description: 'Pipeline for PR reviews' }
      },
      techs: {
        'tech-1': { id: 'tech-1', name: 'React', description: 'UI Library' },
        'tech-2': { id: 'tech-2', name: 'TypeScript', description: 'Strict types' }
      },
      rules: {
        'rule-1': { id: 'rule-1', name: 'No Any', description: 'Strict typings required' }
      },
      prompts: {
        'prompt-1': { id: 'prompt-1', name: 'Generate Component', description: 'React FC generator' }
      },
      providers: ['ollama', 'openai', 'anthropic']
    });

    return {
      type: 'assets/setAssetsPayload',
      payload: {
        agents: Object.values(state.agents),
        dags: Object.values(state.dags),
        techs: Object.values(state.techs),
        rules: Object.values(state.rules),
        prompts: Object.values(state.prompts),
        providers: state.providers
      }
    };
  }

  static createLlmProvidersAction() {
    const state = createAssetsState({
      llmProviders: {
        'openai': { id: 'openai', name: 'OpenAI', description: 'https://api.openai.com' },
        'anthropic': { id: 'anthropic', name: 'Anthropic', description: 'https://api.anthropic.com' }
      }
    });

    return {
      type: 'assets/setLlmProviders',
      payload: Object.values(state.llmProviders)
    };
  }

  static createLlmRoutesAction() {
    const state = createAssetsState({
      llmRoutes: {
        'fast-route': { id: 'fast-route', name: 'Fast Models', description: 'gpt-3.5 via openai' },
        'smart-route': { id: 'smart-route', name: 'Smart Models', description: 'claude-3 via anthropic' }
      }
    });

    return {
      type: 'assets/setLlmRoutes',
      payload: Object.values(state.llmRoutes)
    };
  }

  static createSetJsonEditorSchemasAction() {
    const state = createAssetsState({
      jsonEditorSchemas: {
        agents: JSON.stringify({
          type: 'object',
          properties: {
            name: { type: 'string', title: 'Agent Name' },
            description: { type: 'string', title: 'Role Description' },
            systemPrompt: { type: 'string', title: 'System Instructions' }
          },
          required: ['name', 'description']
        }),
        dags: JSON.stringify({
          type: 'object',
          properties: {
            name: { type: 'string', title: 'Workflow Name' },
            description: { type: 'string', title: 'Workflow Description' },
            steps: { type: 'array', items: { type: 'string' } }
          },
          required: ['name']
        }),
        techs: JSON.stringify({
          type: 'object',
          properties: {
            name: { type: 'string', title: 'Technology Name' },
            version: { type: 'string', title: 'Required Version' }
          },
          required: ['name']
        }),
        rules: JSON.stringify({
          type: 'object',
          properties: {
            name: { type: 'string', title: 'Rule Name' },
            severity: { type: 'string', enum: ['error', 'warning', 'info'] }
          },
          required: ['name']
        }),
        prompts: JSON.stringify({
          type: 'object',
          properties: {
            name: { type: 'string', title: 'Template Name' },
            template: { type: 'string', title: 'Prompt Template' }
          },
          required: ['name']
        }),
        'config/llms/providers': JSON.stringify({
          type: 'object',
          properties: {
            name: { type: 'string', title: 'Provider Name' },
            url: { type: 'string', title: 'Endpoint URL' },
            apiKey: { type: 'string', title: 'API Key' }
          },
          required: ['name', 'url']
        }),
        'config/llms/routes': JSON.stringify({
          type: 'object',
          properties: {
            name: { type: 'string', title: 'Route Name' },
            model: { type: 'string', title: 'Target Model' },
            provider: { type: 'string', title: 'LLM Provider' }
          },
          required: ['name', 'model', 'provider']
        })
      }
    });

    // Parse back since redux expects object
    const parsedSchemas = Object.entries(state.jsonEditorSchemas).reduce((acc, [k, v]) => {
      acc[k] = JSON.parse(v as string);
      return acc;
    }, {} as Record<string, any>);

    return {
      type: 'assets/setJsonEditorSchemas',
      payload: parsedSchemas
    };
  }

  static createDispatchAction() {
    return this.createPopulateAction();
  }
}
