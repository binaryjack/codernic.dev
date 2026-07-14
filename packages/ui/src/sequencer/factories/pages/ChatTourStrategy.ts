import { ChatFactory } from '../widgets/ChatFactory';
import { PageStrategy } from './PageStrategy';
import type { StepAction } from '../../core/StateMachine';

export class ChatTourStrategy implements PageStrategy {
  getEntryKey() {
    return 'chat_inject_data';
  }

  getInitActions() {
    return [];
  }

  getSequence(): Record<string, StepAction> {
    return {
      'chat_inject_data': {
        target: 'chat.widget',
        action: 'injectData',
        payload: {
          slice: 'chat',
          data: {
            messages: ChatFactory.createExhaustiveChatMock()
          }
        },
        autoAdvance: true,
        next: 'chat_inject_context'
      },
      'chat_inject_context': {
        target: 'chat.widget',
        action: 'injectData',
        payload: {
          slice: 'chat',
          data: {
            contextFiles: [
              { id: 'demo-file-1', filePath: 'auth.ts', fileName: 'auth.ts', lines: [10, 25], demoDesc: '[CODER] Mapped authentication module context lines.' },
              { id: 'demo-file-2', filePath: 'cart.ts', fileName: 'cart.ts', lines: [50, 60], demoDesc: '[CODER] Mapped shopping cart context lines.' }
            ]
          }
        },
        autoAdvance: true,
        next: 'chat_inject_artifacts'
      },
      'chat_inject_artifacts': {
        target: 'artifacts.widget',
        action: 'injectData',
        payload: {
          slice: 'artifacts',
          data: {
            items: ['implementation_plan.md', 'task.md']
          }
        },
        autoAdvance: true,
        next: 'chat_inject_introspection'
      },
      'chat_inject_introspection': {
        target: 'introspection.widget',
        action: 'injectData',
        payload: {
          slice: 'introspection',
          data: {
            nodes: [
              { id: 't-1', status: 'completed', type: 'thought', message: 'Analyzing project context.' },
              { id: 't-2', status: 'running', type: 'tool', message: 'Calling read_file', details: 'auth.ts' }
            ],
            confidence: 85
          }
        },
        autoAdvance: true,
        next: 'chat_introspection_confidence'
      },
      'chat_introspection_confidence': { target: 'chat-widget-introspection-panel-confidence-slider', action: 'highlight', next: 'chat_introspection_node_1' },
      'chat_introspection_node_1': { target: 'introspection-node-t-1', action: 'highlight', next: 'chat_input' },
      'chat_input': { target: 'chat-textarea', action: 'highlight', next: 'chat_mode' },
      'chat_mode': { target: 'chat-mode-selector', action: 'highlight', next: 'chat_provider' },
      'chat_provider': { target: 'chat-input-model-dropdown-select-dropdown', action: 'highlight', next: 'chat_model' },
      'chat_model': { target: 'chat-input-model-dropdown-select-dropdown-1', action: 'highlight', next: 'chat_autopilot' },
      'chat_autopilot': { target: 'chat-input-autopilot-toggle', action: 'highlight', next: 'chat_rag' },
      'chat_rag': { target: 'chat-input-rag-toggle', action: 'highlight', next: 'chat_execute' },
      'chat_execute': { target: 'chat-send-button', action: 'highlight', next: 'chat_feed_root' },
      'chat_feed_root': { target: 'chat-widget-chat-feed', action: 'highlight', next: 'chat_feed_card_demo_msg_1' },
      'chat_feed_card_demo_msg_1': { target: 'message-card-demo-msg-1', action: 'highlight', next: 'chat_feed_card_demo_msg_2' },
      'chat_feed_card_demo_msg_2': { target: 'message-card-demo-msg-2', action: 'highlight', next: 'chat_feed_card_demo_msg_3' },
      'chat_feed_card_demo_msg_3': { target: 'message-card-demo-msg-3', action: 'highlight', next: 'chat_feed_card_demo_msg_pirsig' },
      'chat_feed_card_demo_msg_pirsig': { target: 'message-card-demo-msg-pirsig-report', action: 'highlight', next: 'chat_feed_card_demo_msg_plan' },
      'chat_feed_card_demo_msg_plan': { target: 'message-card-demo-msg-plan-cta', action: 'highlight', next: 'chat_artifacts' },
      'chat_artifacts': { target: 'chat-widget-artifacts-panel', action: 'highlight', next: 'chat_artifact_1' },
      'chat_artifact_1': { target: 'artifact-item-0', action: 'highlight', next: 'chat_introspection' },
      'chat_introspection': { target: 'chat-widget-introspection-panel', action: 'highlight', next: 'architect_nav' },
      'architect_nav': { target: 'nav-item-architect', action: 'click', next: 'architect_inject_data', autoAdvance: true }
    };
  }
}
