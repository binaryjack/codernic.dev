import { PageStrategy } from './PageStrategy';
import type { StepAction } from '../../core/StateMachine';
import { SettingsFactory } from '../widgets/SettingsFactory';

export class ModelHubSetupStrategy implements PageStrategy {
  getEntryKey() {
    return 'model_hub_entry';
  }

  getInitActions() {
    // Dispatch an action to open the model hub/settings if needed
    return [
      SettingsFactory.createDispatchAction()
    ];
  }

  getSequence(): Record<string, StepAction> {
    return {
      'model_hub_entry': {
        target: 'system-root',
        action: 'dispatch',
        payload: this.getInitActions(),
        autoAdvance: true,
        next: 'model_hub_cloud_keys'
      },
      'model_hub_cloud_keys': {
        target: '[data-testid$="-vault-api-keys"]', // Assuming there's a vault test ID or similar
        action: 'highlight',
        content: "[CODER] Welcome to the Model & Provider Management tour! First, let's talk about Cloud Models. By configuring your API keys (like OpenAI or Anthropic) in the Settings Vault, you instantly unlock cloud models in the Hub.",
        next: 'model_hub_download_hf'
      },
      'model_hub_download_hf': {
        target: '[data-testid*="-model-hub-search"]', // Adjust test ID based on real DOM
        action: 'highlight',
        content: "[CODER] Prefer keeping it local? You can search and download models directly from HuggingFace using this search bar. They are downloaded as .gguf files to your local drive.",
        next: 'model_hub_routing'
      },
      'model_hub_routing': {
        target: '[data-testid$="-route-profiles"]', // Adjust test ID based on real DOM
        action: 'highlight',
        content: "[CODER] Finally, you can manage your Route Profiles here. These profiles dictate fallback behavior if a model fails or isn't fast enough.",
      }
    };
  }
}
