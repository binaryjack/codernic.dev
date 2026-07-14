import { PageStrategy } from './PageStrategy';
import type { StepAction } from '../../core/StateMachine';

export class SessionsTourStrategy implements PageStrategy {
  getEntryKey() {
    return 'sessions_init_layout';
  }

  getInitActions() {
    return []; // No longer used, replaced by agnostic injectData
  }

  getSequence(): Record<string, StepAction> {
    return {
      'sessions_init_layout': {
        target: 'layout-engine',
        action: 'introspection',
        payload: { method: 'switchLayout', args: ['Coder', true] },
        autoAdvance: true,
        next: 'sessions_inject_data'
      },
      'sessions_inject_data': {
        target: 'session.widget',
        action: 'injectData',
        payload: {
          slice: 'sessions',
          data: {
            list: [
              { id: '1', name: 'Scaling Codernic for Swiss PME', date: '2026-07-02T16:23:51Z' },
              { id: '2', name: 'Auditing Deming Engine', date: '2026-07-10T16:11:11Z' },
              { id: '3', name: 'Consolidating Agent Session', date: '2026-07-07T13:29:31Z' }
            ],
            currentId: '1'
          }
        },
        autoAdvance: true,
        next: 'sessions_welcome'
      },
      'sessions_welcome': {
        target: 'session-widget-root',
        action: 'highlight',
        content: "[SESSIONS] Easily load, manage, or delete past session context.",
        next: 'sessions_selector'
      },
      'sessions_selector': {
        target: 'session-selector',
        action: 'highlight',
        content: "[SESSIONS] A searchable list of all historical interactions.",
        next: 'sessions_new'
      },
      'sessions_new': {
        target: 'icon-plus',
        action: 'highlight',
        content: "[SESSIONS] Start a fresh session instantly.",
        next: 'sessions_item'
      },
      'sessions_item': {
        target: 'session-item-2',
        action: 'highlight',
        content: "[SESSIONS] An individual session item containing your conversation context.",
        next: 'sessions_edit'
      },
      'sessions_edit': {
        target: 'rename-session-2',
        action: 'highlight',
        content: "[SESSIONS] Double click or use this button to rename.",
        next: 'sessions_delete'
      },
      'sessions_delete': {
        target: 'delete-session-2',
        action: 'highlight',
        content: "[SESSIONS] Safely remove unneeded sessions."
      } // The 'next' link will be patched dynamically by the DemoEngine
    };
  }
}
