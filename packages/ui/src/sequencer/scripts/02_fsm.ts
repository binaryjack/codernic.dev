import { SequenceConfig } from '../core/StateMachine';

export const fsmTourConfig: SequenceConfig = {
  id: '02_fsm',
  name: 'FSM & DAG Mode Tour',
  initial: 'start',
  states: {
    start: {
      target: 'chat-mode-selector',
      action: 'highlight',
      content: 'Let us change the Chat mode to Plan.',
      next: 'select_plan_mode'
    },
    select_plan_mode: {
      target: 'chat-mode-selector',
      action: 'dispatch',
      payload: [
        {
          type: 'chat/setMode',
          payload: { sessionId: 'demo-session', mode: 'plan' }
        },
        {
          type: 'chat/freezePlan',
          payload: { sessionId: 'demo-session' }
        }
      ],
      content: 'Switching to Plan mode...',
      next: 'validate_plan',
      autoAdvance: true
    },
    validate_plan: {
      target: 'implement-now-button',
      action: 'highlight',
      content: 'Once the plan is ready, we trigger "Implement Now".',
      next: 'click_implement'
    },
    click_implement: {
      target: 'implement-now-button',
      action: 'click',
      next: 'lock_chat'
    },
    lock_chat: {
      target: 'chat-input',
      action: 'dispatch',
      payload: {
        type: 'chat/transitionToImplementNow',
        payload: { sessionId: 'demo-session' }
      },
      content: 'Locking chat for DAG execution...',
      next: 'highlight_locked_chat',
      autoAdvance: true
    },
    highlight_locked_chat: {
      target: 'chat-input',
      action: 'highlight',
      content: 'The chat is now locked. You cannot type while the DAG is running.'
    }
  }
};
