import type { BlockState } from '@ai-agencee/ui/layout-engine';

export const DEFAULT_LAYOUTS: Record<string, Record<string, BlockState>> = {
  Coder: {
    'root': { id: 'root', type: 'vblock', orientation: 'horizontal', childrenIds: ['sessions-col', 'chat-col', 'right-col'], ratios: [0.2, 0.55, 0.25], locked: true },
    'sessions-col': { id: 'sessions-col', type: 'vblock', orientation: 'vertical', childrenIds: ['sessions-w'], ratios: [1], parentId: 'root', locked: true, behavior: 'panel-left' },
    'sessions-w': { id: 'sessions-w', type: 'widget', widgetType: 'sessions', parentId: 'sessions-col', locked: true },
    'chat-col': { id: 'chat-col', type: 'vblock', orientation: 'vertical', childrenIds: ['chat-w'], ratios: [1], parentId: 'root', locked: true, allowFullScreen: true },
    'chat-w': { id: 'chat-w', type: 'widget', widgetType: 'chat', parentId: 'chat-col', locked: true },
    'right-col': { id: 'right-col', type: 'vblock', orientation: 'vertical', childrenIds: ['intro-w', 'artifacts-w'], ratios: [0.6, 0.4], parentId: 'root', locked: true, behavior: 'panel-right' },
    'intro-w': { id: 'intro-w', type: 'widget', widgetType: 'introspection', parentId: 'right-col', locked: true },
    'artifacts-w': { id: 'artifacts-w', type: 'widget', widgetType: 'artifacts', parentId: 'right-col', locked: true }
  },
  Architect: {
    'root': { id: 'root', type: 'vblock', orientation: 'horizontal', childrenIds: ['left-col', 'center-col', 'intro-col'], ratios: [0.25, 0.5, 0.25], locked: true },
    'left-col': { id: 'left-col', type: 'vblock', orientation: 'vertical', childrenIds: ['pirsig-col', 'events-col'], ratios: [0.5, 0.5], parentId: 'root', locked: true },
    'pirsig-col': { id: 'pirsig-col', type: 'vblock', orientation: 'horizontal', childrenIds: ['pirsig-w'], ratios: [1], parentId: 'left-col', locked: true, allowFullScreen: true },
    'pirsig-w': { id: 'pirsig-w', type: 'widget', widgetType: 'pirsig-widget', parentId: 'pirsig-col', locked: true },
    'events-col': { id: 'events-col', type: 'vblock', orientation: 'horizontal', childrenIds: ['events-w'], ratios: [1], parentId: 'left-col', locked: true, allowFullScreen: true },
    'events-w': { id: 'events-w', type: 'widget', widgetType: 'agent-events-widget', parentId: 'events-col', locked: true },
    'center-col': { id: 'center-col', type: 'vblock', orientation: 'vertical', childrenIds: ['erathos-col', 'chat-col'], ratios: [0.6, 0.4], parentId: 'root', locked: true },
    'erathos-col': { id: 'erathos-col', type: 'vblock', orientation: 'horizontal', childrenIds: ['erathos-w'], ratios: [1], parentId: 'center-col', locked: true, allowFullScreen: true },
    'erathos-w': { id: 'erathos-w', type: 'widget', widgetType: 'erathos', parentId: 'erathos-col', locked: true },
    'chat-col': { id: 'chat-col', type: 'vblock', orientation: 'horizontal', childrenIds: ['chat-w'], ratios: [1], parentId: 'center-col', locked: true, allowFullScreen: true },
    'chat-w': { id: 'chat-w', type: 'widget', widgetType: 'chat', parentId: 'chat-col', locked: true },
    'intro-col': { id: 'intro-col', type: 'vblock', orientation: 'vertical', childrenIds: ['intro-w'], ratios: [1], parentId: 'root', locked: true, behavior: 'panel-right' },
    'intro-w': { id: 'intro-w', type: 'widget', widgetType: 'introspection', parentId: 'intro-col', locked: true }
  },
  Integrator: {
    'root': { id: 'root', type: 'vblock', orientation: 'vertical', childrenIds: ['galileus-row', 'bot-row'], ratios: [0.4, 0.6], locked: true },
    'galileus-row': { id: 'galileus-row', type: 'vblock', orientation: 'vertical', childrenIds: ['galileus-topology-col', 'galileus-daw-col'], ratios: [0.75, 0.25], parentId: 'root', locked: true, behavior: 'accordion-top', allowFullScreen: true },
    'galileus-topology-col': { id: 'galileus-topology-col', type: 'vblock', orientation: 'horizontal', childrenIds: ['galileus-topology-w'], ratios: [1], parentId: 'galileus-row', locked: true, allowFullScreen: true },
    'galileus-topology-w': { id: 'galileus-topology-w', type: 'widget', widgetType: 'galileus-topology', parentId: 'galileus-topology-col', locked: true },
    'galileus-daw-col': { id: 'galileus-daw-col', type: 'vblock', orientation: 'horizontal', childrenIds: ['galileus-daw-w'], ratios: [1], parentId: 'galileus-row', locked: true, allowFullScreen: true },
    'galileus-daw-w': { id: 'galileus-daw-w', type: 'widget', widgetType: 'galileus-daw', parentId: 'galileus-daw-col', locked: true },
    'bot-row': { id: 'bot-row', type: 'vblock', orientation: 'horizontal', childrenIds: ['chat-col', 'intro-col'], ratios: [0.7, 0.3], parentId: 'root', locked: true },
    'chat-col': { id: 'chat-col', type: 'vblock', orientation: 'vertical', childrenIds: ['chat-w'], ratios: [1], parentId: 'bot-row', locked: true, allowFullScreen: true },
    'chat-w': { id: 'chat-w', type: 'widget', widgetType: 'chat', parentId: 'chat-col', locked: true },
    'intro-col': { id: 'intro-col', type: 'vblock', orientation: 'vertical', childrenIds: ['intro-w'], ratios: [1], parentId: 'bot-row', locked: true, behavior: 'panel-right' },
    'intro-w': { id: 'intro-w', type: 'widget', widgetType: 'introspection', parentId: 'intro-col', locked: true }
  },
  Settings: {
    'root': { id: 'root', type: 'vblock', orientation: 'horizontal', childrenIds: ['col-1', 'col-2', 'col-3'], ratios: [0.33, 0.33, 0.34], locked: true },
    'col-1': { id: 'col-1', type: 'vblock', orientation: 'vertical', childrenIds: ['models-col', 'rules-col', 'prompts-col'], ratios: [0.33, 0.33, 0.34], parentId: 'root', locked: true },
    'models-col': { id: 'models-col', type: 'vblock', orientation: 'horizontal', childrenIds: ['models-w'], ratios: [1], parentId: 'col-1', locked: true, allowFullScreen: true },
    'models-w': { id: 'models-w', type: 'widget', widgetType: 'models-settings', parentId: 'models-col', locked: true },
    'rules-col': { id: 'rules-col', type: 'vblock', orientation: 'horizontal', childrenIds: ['rules-w'], ratios: [1], parentId: 'col-1', locked: true, allowFullScreen: true },
    'rules-w': { id: 'rules-w', type: 'widget', widgetType: 'rules-settings', parentId: 'rules-col', locked: true },
    'prompts-col': { id: 'prompts-col', type: 'vblock', orientation: 'horizontal', childrenIds: ['prompts-w'], ratios: [1], parentId: 'col-1', locked: true, allowFullScreen: true },
    'prompts-w': { id: 'prompts-w', type: 'widget', widgetType: 'prompts-settings', parentId: 'prompts-col', locked: true },

    'col-2': { id: 'col-2', type: 'vblock', orientation: 'vertical', childrenIds: ['agents-col', 'dags-col', 'techs-col'], ratios: [0.33, 0.33, 0.34], parentId: 'root', locked: true },
    'agents-col': { id: 'agents-col', type: 'vblock', orientation: 'horizontal', childrenIds: ['agents-w'], ratios: [1], parentId: 'col-2', locked: true, allowFullScreen: true },
    'agents-w': { id: 'agents-w', type: 'widget', widgetType: 'agents', parentId: 'agents-col', locked: true },
    'dags-col': { id: 'dags-col', type: 'vblock', orientation: 'horizontal', childrenIds: ['dags-w'], ratios: [1], parentId: 'col-2', locked: true, allowFullScreen: true },
    'dags-w': { id: 'dags-w', type: 'widget', widgetType: 'dags', parentId: 'dags-col', locked: true },
    'techs-col': { id: 'techs-col', type: 'vblock', orientation: 'horizontal', childrenIds: ['techs-w'], ratios: [1], parentId: 'col-2', locked: true, allowFullScreen: true },
    'techs-w': { id: 'techs-w', type: 'widget', widgetType: 'technologies', parentId: 'techs-col', locked: true },

    'col-3': { id: 'col-3', type: 'vblock', orientation: 'vertical', childrenIds: ['routing-col'], ratios: [1], parentId: 'root', locked: true },
    'routing-col': { id: 'routing-col', type: 'vblock', orientation: 'horizontal', childrenIds: ['routing-w'], ratios: [1], parentId: 'col-3', locked: true, allowFullScreen: true },
    'routing-w': { id: 'routing-w', type: 'widget', widgetType: 'routing-settings', parentId: 'routing-col', locked: true }
  },
  Analyst: {
    'root': { id: 'root', type: 'vblock', orientation: 'horizontal', childrenIds: ['hub-col', 'analyse-col', 'chat-col'], ratios: [0.25, 0.5, 0.25], locked: true },
    'hub-col': { id: 'hub-col', type: 'vblock', orientation: 'vertical', childrenIds: ['hub-w'], ratios: [1], parentId: 'root', locked: true, allowFullScreen: true, behavior: 'panel-left' },
    'hub-w': { id: 'hub-w', type: 'widget', widgetType: 'model-hub', parentId: 'hub-col', locked: true },
    'analyse-col': { id: 'analyse-col', type: 'vblock', orientation: 'vertical', childrenIds: ['analyse-w'], ratios: [1], parentId: 'root', locked: true, allowFullScreen: true },
    'analyse-w': { id: 'analyse-w', type: 'widget', widgetType: 'analyse', parentId: 'analyse-col', locked: true },
    'chat-col': { id: 'chat-col', type: 'vblock', orientation: 'vertical', childrenIds: ['chat-w'], ratios: [1], parentId: 'root', locked: true, allowFullScreen: true, behavior: 'panel-right' },
    'chat-w': { id: 'chat-w', type: 'widget', widgetType: 'chat', parentId: 'chat-col', locked: true }
  },
  Zen: {
    'root': { id: 'root', type: 'vblock', orientation: 'horizontal', childrenIds: ['chat-col'], ratios: [1], locked: true },
    'chat-col': { id: 'chat-col', type: 'vblock', orientation: 'vertical', childrenIds: ['chat-w'], ratios: [1], parentId: 'root', locked: true, allowFullScreen: true },
    'chat-w': { id: 'chat-w', type: 'widget', widgetType: 'chat', parentId: 'chat-col', locked: true }
  },
  Admin: {
    'root': { id: 'root', type: 'vblock', orientation: 'vertical', childrenIds: ['sandbox-row', 'system-row'], ratios: [0.15, 0.85], locked: true },
    'sandbox-row': { id: 'sandbox-row', type: 'vblock', orientation: 'horizontal', childrenIds: ['sandbox-w'], ratios: [1], parentId: 'root', locked: true, behavior: 'accordion-top' },
    'sandbox-w': { id: 'sandbox-w', type: 'widget', widgetType: 'sandbox', parentId: 'sandbox-row', locked: true },
    'system-row': { id: 'system-row', type: 'vblock', orientation: 'horizontal', childrenIds: ['system-w'], ratios: [1], parentId: 'root', locked: true, allowFullScreen: true },
    'system-w': { id: 'system-w', type: 'widget', widgetType: 'system-settings', parentId: 'system-row', locked: true }
  },
  EnterpriseChatbot: {
    'root': { id: 'root', type: 'vblock', orientation: 'horizontal', childrenIds: ['chatbot-col'], ratios: [1], locked: true },
    'chatbot-col': { id: 'chatbot-col', type: 'vblock', orientation: 'vertical', childrenIds: ['chatbot-w'], ratios: [1], parentId: 'root', locked: true, allowFullScreen: true },
    'chatbot-w': { id: 'chatbot-w', type: 'widget', widgetType: 'enterprise-chatbot', parentId: 'chatbot-col', locked: true }
  },
  Ockham: {
    'root': { id: 'root', type: 'vblock', orientation: 'horizontal', childrenIds: ['ockham-left', 'ockham-right'], ratios: [0.45, 0.55], locked: true },
    'ockham-left': { id: 'ockham-left', type: 'vblock', orientation: 'vertical', childrenIds: ['cloud-model-hub-w'], ratios: [1], parentId: 'root', locked: true },
    'cloud-model-hub-w': { id: 'cloud-model-hub-w', type: 'widget', widgetType: 'cloud-model-hub', parentId: 'ockham-left', locked: true },
    'ockham-right': { id: 'ockham-right', type: 'vblock', orientation: 'vertical', childrenIds: ['routing-w'], ratios: [1], parentId: 'root', locked: true },
    'routing-w': { id: 'routing-w', type: 'widget', widgetType: 'routing-settings', parentId: 'ockham-right', locked: true }
  },
  Diagnostics: {
    'root': { id: 'root', type: 'vblock', orientation: 'vertical', childrenIds: ['diag-top', 'diag-mid', 'diag-bottom'], ratios: [0.3, 0.4, 0.3], locked: true },
    'diag-top': { id: 'diag-top', type: 'vblock', orientation: 'horizontal', childrenIds: ['welcome-w'], ratios: [1], parentId: 'root', locked: true, allowFullScreen: true },
    'welcome-w': { id: 'welcome-w', type: 'widget', widgetType: 'welcome-dashboard', parentId: 'diag-top', locked: true },
    
    'diag-mid': { id: 'diag-mid', type: 'vblock', orientation: 'horizontal', childrenIds: ['system-col', 'shield-col'], ratios: [0.5, 0.5], parentId: 'root', locked: true },
    'system-col': { id: 'system-col', type: 'vblock', orientation: 'vertical', childrenIds: ['system-w'], ratios: [1], parentId: 'diag-mid', locked: true, allowFullScreen: true },
    'system-w': { id: 'system-w', type: 'widget', widgetType: 'my-system-dashboard', parentId: 'system-col', locked: true },
    'shield-col': { id: 'shield-col', type: 'vblock', orientation: 'vertical', childrenIds: ['shield-w'], ratios: [1], parentId: 'diag-mid', locked: true, allowFullScreen: true },
    'shield-w': { id: 'shield-w', type: 'widget', widgetType: 'shield-proxy', parentId: 'shield-col', locked: true },

    'diag-bottom': { id: 'diag-bottom', type: 'vblock', orientation: 'horizontal', childrenIds: ['bench-col', 'model-col'], ratios: [0.6, 0.4], parentId: 'root', locked: true },
    'bench-col': { id: 'bench-col', type: 'vblock', orientation: 'vertical', childrenIds: ['bench-w'], ratios: [1], parentId: 'diag-bottom', locked: true, allowFullScreen: true },
    'bench-w': { id: 'bench-w', type: 'widget', widgetType: 'benchmark-widget', parentId: 'bench-col', locked: true },
    'model-col': { id: 'model-col', type: 'vblock', orientation: 'vertical', childrenIds: ['model-w'], ratios: [1], parentId: 'diag-bottom', locked: true, allowFullScreen: true },
    'model-w': { id: 'model-w', type: 'widget', widgetType: 'model-selection-card', parentId: 'model-col', locked: true }
  }
};
