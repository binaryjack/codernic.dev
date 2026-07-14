import { PageStrategy } from './PageStrategy';
import type { StepAction } from '../../core/StateMachine';
import { EnterpriseChatbotFactory } from '../widgets/EnterpriseChatbotFactory';

export class EnterpriseChatbotTourStrategy implements PageStrategy {
  getEntryKey() {
    return 'enterprise_init_layout';
  }

  getInitActions() {
    return [];
  }

  getSequence(): Record<string, StepAction> {
    return {
      'enterprise_init_layout': {
        target: 'layout-engine',
        action: 'introspection',
        payload: { method: 'switchLayout', args: ['EnterpriseChatbot', true] },
        autoAdvance: true,
        next: 'enterprise_inject_data'
      },
      'enterprise_inject_data': {
        target: 'chat.widget',
        action: 'injectData',
        payload: {
          slice: 'chat',
          data: {
            messages: [
              { id: 'msg-1', role: 'user', text: 'What is the current policy on remote work?' },
              { id: 'msg-2', role: 'assistant', text: 'Based on the IAM policy manual...' }
            ]
          }
        },
        autoAdvance: true,
        next: 'enterprise_root'
      },
      'enterprise_root': {
        target: 'enterprise-chatbot-widget-root',
        action: 'highlight',
        content: '[ENTERPRISE] A dedicated, focused RAG chatbot for corporate knowledge querying. Connects directly to an enterprise API endpoint with IAM token authentication.',
        next: 'enterprise_message_feed'
      },
      'enterprise_message_feed': {
        target: 'enterprise-chatbot-widget-message-feed',
        action: 'highlight',
        next: 'enterprise_chat_input'
      },
      'enterprise_chat_input': {
        target: 'enterprise-chatbot-widget-chat-input',
        action: 'highlight'
        // Next link will be patched dynamically by DemoEngine (this is the last strategy)
      }
    };
  }
}
