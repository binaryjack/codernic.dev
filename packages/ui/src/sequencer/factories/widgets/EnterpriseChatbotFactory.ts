import { createEnterpriseChatbotState } from '@binaryjack/state-factories';

export const DEMO_ENTERPRISE_SESSION_ID = 'demo-enterprise-session';

export class EnterpriseChatbotFactory {
  static createMockMessages() {
    const state = createEnterpriseChatbotState({
      messages: [
        {
          id: 'enterprise-msg-1',
          role: 'user',
          text: 'What is our Q3 revenue forecast for the EMEA region?'
        },
        {
          id: 'enterprise-msg-2',
          role: 'assistant',
          text: 'Based on the financial documents indexed in the corporate knowledge base, the **EMEA Q3 revenue forecast** is **€42.7M**, reflecting a 12% YoY growth driven primarily by enterprise SaaS subscriptions in Germany and the Netherlands.\n\n**Sources used:**\n- `FY2026_EMEA_Budget.xlsx` (pg. 4)\n- `Q2_Board_Deck.pdf` (slide 17)\n\n> _Confidence: 94% — data freshness: 3 hours ago._'
        },
        {
          id: 'enterprise-msg-3',
          role: 'user',
          text: 'Which product line is underperforming against targets?'
        },
        {
          id: 'enterprise-msg-4',
          role: 'assistant',
          text: 'The **On-Premise Enterprise** product line is currently running **18% below Q3 target**. The primary drivers identified are:\n\n1. Delayed procurement cycles in the public sector (UK, France)\n2. Competitive pressure from hyperscaler-bundled offerings\n3. Reduced sales headcount (3 open positions in the field team)\n\n**Source:** `Sales_Pipeline_Q3_2026.xlsx` — Sheet "By Product Line"'
        }
      ]
    });
    return state.messages;
  }

  static createInjectMessagesAction() {
    return {
      type: 'enterpriseChatbot/setMessages',
      payload: this.createMockMessages()
    };
  }
}
