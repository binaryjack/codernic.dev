import { PageStrategy } from './PageStrategy';
import type { StepAction } from '../../core/StateMachine';
import { ChatFactory } from '../widgets/ChatFactory';

export class ChatInterfaceStrategy implements PageStrategy {
  getEntryKey() {
    return 'chat_interface_entry';
  }

  getInitActions() {
    return [
      ChatFactory.createDispatchAction()
    ];
  }

  getSequence(): Record<string, StepAction> {
    return {
      'chat_interface_entry': {
        target: 'system-root',
        action: 'dispatch',
        payload: this.getInitActions(),
        autoAdvance: true,
        next: 'chat_interface_mode'
      },
      'chat_interface_mode': {
        target: '[data-testid$="-mode-dropdown"]',
        action: 'highlight',
        content: "[CODER] Welcome to the Chat Interface tour! You can switch the Cognitive Mode here (e.g. Brainstorm, Plan, Agent). Each mode dictates the permissions and safety boundaries of the LLM.",
        next: 'chat_interface_mentions'
      },
      'chat_interface_mentions': {
        target: 'chat-textarea', // from chat-input.tsx data-testid
        action: 'highlight',
        content: "[CODER] The Chat Input supports rich features. Type `@` to instantly pull in files, symbols, or sessions into the LLM context. You also get AI autocomplete powered by Erathos as you type!",
        next: 'chat_interface_rag'
      },
      'chat_interface_rag': {
        target: '[data-testid$="-button"]', // RAG button
        action: 'highlight',
        content: "[CODER] The 'R' button toggles Retrieval-Augmented Generation. When enabled, your prompt is automatically enriched with semantic context from your codebase index.",
        next: 'chat_interface_autopilot'
      },
      'chat_interface_autopilot': {
        target: '[data-testid$="-autopilot-toggle"]',
        action: 'highlight',
        content: "[CODER] Finally, toggle Autopilot to let the agent run multi-step plans fully autonomously. To submit your prompt, hit Ctrl+Enter (or Cmd+Enter)!",
      }
    };
  }
}
