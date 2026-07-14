import { SequenceConfig } from '../core/StateMachine';

export const architectureTourConfig: SequenceConfig = {
  id: '01_architecture',
  name: 'Erathos Architecture Preview',
  initial: 'start',
  states: {
    start: {
      target: 'chat-input',
      action: 'highlight',
      content: 'Welcome to the Demo. We will now simulate a prompt.',
      next: 'type_prompt',
      autoAdvance: true
    },
    type_prompt: {
      target: 'chat-input',
      action: 'typewriter',
      payload: 'Design a scalable architecture for an e-commerce platform.',
      next: 'send_prompt'
    },
    send_prompt: {
      target: 'chat-send-button',
      action: 'click',
      next: 'wait_for_response'
    },
    wait_for_response: {
      target: 'chat-input',
      action: 'dispatch',
      payload: {
        type: 'system/sendIntent',
        payload: {
          type: 'codernic:chat',
          payload: { sessionId: 'demo-session', message: 'Design a scalable architecture for an e-commerce platform.' }
        }
      },
      content: 'Sending prompt to backend...',
      next: 'simulate_schema_update',
      autoAdvance: true
    },
    simulate_schema_update: {
      target: 'chat-input',
      action: 'dispatch',
      payload: {
        type: 'system/sendIntent',
        payload: {
          type: 'update_erathos_schema',
          payload: {
            schema: {
              nodes: [
                { id: '1', type: 'service', data: { label: 'API Gateway' } },
                { id: '2', type: 'database', data: { label: 'PostgreSQL' } }
              ],
              edges: [
                { id: 'e1-2', source: '1', target: '2' }
              ]
            }
          }
        }
      },
      content: 'Erathos is generating the schema...',
      next: 'highlight_erathos',
      autoAdvance: true
    },
    highlight_erathos: {
      target: 'erathos-preview-container',
      action: 'highlight',
      content: 'Here is the generated Erathos preview based on the simulated schema.',
      next: 'write_artifact'
    },
    write_artifact: {
      target: 'artifacts-panel',
      action: 'dispatch',
      payload: {
        type: 'system/sendIntent',
        payload: {
          type: 'codernic:chat',
          payload: { sessionId: 'demo-session', command: 'write_artifact', file: 'architecture.md' }
        }
      },
      content: 'Writing the architecture report to an artifact.',
      next: 'highlight_artifact',
      autoAdvance: true
    },
    highlight_artifact: {
      target: 'artifacts-panel',
      action: 'highlight',
      content: 'The artifact has been generated and is ready for review.'
    }
  }
};
