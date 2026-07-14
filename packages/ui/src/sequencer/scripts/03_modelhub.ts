import { SequenceConfig } from '../core/StateMachine';

export const modelHubTourConfig: SequenceConfig = {
  id: '03_modelhub',
  name: 'Model Hub & Deletion Cascade',
  initial: 'start',
  states: {
    start: {
      target: 'models-hub-button',
      action: 'highlight',
      content: 'Let us open the Model Hub to manage our local models.',
      next: 'click_model_hub'
    },
    click_model_hub: {
      target: 'models-hub-button',
      action: 'click',
      next: 'highlight_model_list'
    },
    highlight_model_list: {
      target: 'model-list-container',
      action: 'highlight',
      content: 'Here are all your downloaded and configured models.',
      next: 'click_delete_model'
    },
    click_delete_model: {
      target: 'delete-model-button-openrouter/gpt-4o',
      action: 'click',
      next: 'simulate_deletion'
    },
    simulate_deletion: {
      target: 'model-list-container',
      action: 'dispatch',
      payload: {
        type: 'system/sendIntent',
        payload: {
          type: 'delete_model',
          payload: { model_id: 'openrouter/gpt-4o' }
        }
      },
      content: 'Deleting the model and purging JSON configurations...',
      next: 'highlight_success',
      autoAdvance: true
    },
    highlight_success: {
      target: 'model-list-container',
      action: 'highlight',
      content: 'The model has been successfully purged from the disk and UI.'
    }
  }
};
