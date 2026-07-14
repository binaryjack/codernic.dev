import { PageStrategy } from './PageStrategy';
import type { StepAction } from '../../core/StateMachine';

export class AnalystTourStrategy implements PageStrategy {
  getEntryKey() {
    return 'analyst_init_layout';
  }

  getInitActions() {
    return [];
  }

  getSequence(): Record<string, StepAction> {
    return {
      'analyst_init_layout': {
        target: 'layout-engine',
        action: 'introspection',
        payload: { method: 'switchLayout', args: ['Analyst', true] },
        autoAdvance: true,
        next: 'analyst_inject_data'
      },
      'analyst_inject_data': {
        target: 'model-hub.widget',
        action: 'injectData',
        payload: {
          slice: 'models',
          data: {
            localModels: [
              { id: 'llama-3', name: 'Llama 3 8B', status: 'ready' },
              { id: 'mistral-7b', name: 'Mistral 7B', status: 'ready' }
            ],
            activeDownloads: [
              { id: 'demo-download', progress: '75%', model: 'meta-llama/Llama-3-8B' }
            ]
          }
        },
        autoAdvance: true,
        next: 'analyst_model_hub'
      },
      'analyst_model_hub': {
        target: 'model-hub-widget-root',
        action: 'highlight',
        content: "[ANALYST] Welcome to the Analyst layout. This focuses on model evaluation.",
        next: 'analyst_model_hub_tabs'
      },
      'analyst_model_hub_tabs': {
        target: 'model-hub-local',
        action: 'highlight',
        content: "[ANALYST] Toggle between your local and cloud environments.",
        next: 'analyst_model_hub_search'
      },
      'analyst_model_hub_search': {
        target: 'model-hub-search',
        action: 'highlight',
        content: "[ANALYST] Filter thousands of models seamlessly.",
        next: 'analyst_model_hub_item'
      },
      'analyst_model_hub_item': {
        target: 'model-hub-item-0',
        action: 'highlight',
        content: "[ANALYST] Download and configure parameters for each specific model.",
        next: 'analyst_analyzer_timer'
      },
      'analyst_analyzer_timer': {
        target: 'analyse-widget-root',
        action: 'highlight',
        content: "[ANALYST] Run automated test suites and watch progress.",
        next: 'analyst_analyzer_dismiss'
      },
      'analyst_analyzer_dismiss': {
        target: 'dismiss-button',
        action: 'highlight',
        content: "[ANALYST] Dismiss the progress panel when done."
      }
    };
  }
}
