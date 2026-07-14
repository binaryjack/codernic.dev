import { createSessionsState } from '@binaryjack/state-factories';

export class SessionFactory {
  static createMockSession(
    id: string,
    name: string,
    status: 'idle' | 'running' | 'success' | 'error',
    confidenceScore: number,
    current_mode?: 'brainstorm' | 'plan' | 'agent',
    llm_id?: string,
    use_rag?: boolean,
    auto_pilot?: boolean
  ) {
    return {
      id,
      name,
      status,
      last_updated: Date.now() - Math.floor(Math.random() * 100000),
      confidenceScore,
      current_mode,
      llm_id,
      use_rag,
      auto_pilot
    };
  }

  static createSetSessionsDispatch() {
    const state = createSessionsState({
      sessions: { 
        'demo-session': this.createMockSession('demo-session', 'Exhaustive Debug Session', 'running', 85, 'plan', 'gpt-4o', true, true) as any,
        'sess-2': this.createMockSession('sess-2', 'Refactor Authentication API', 'success', 98, 'agent', 'claude-3-5-sonnet', false, true) as any,
        'sess-3': this.createMockSession('sess-3', 'Migrate to Postgres 16', 'idle', 45, 'brainstorm', 'meta-llama-3-70b', true, false) as any,
        'sess-4': this.createMockSession('sess-4', 'Implement GraphQL Federation', 'running', 60, 'plan', 'gpt-4o', false, false) as any,
        'sess-5': this.createMockSession('sess-5', 'Fix Memory Leak in Worker', 'error', 20, 'agent', 'claude-3-5-sonnet', true, true) as any,
        'sess-6': this.createMockSession('sess-6', 'Optimize Webpack Bundle', 'success', 95, 'brainstorm', 'meta-llama-3-70b', false, false) as any
      }
    });

    return {
      type: 'sessions/setSessions',
      payload: state.sessions
    };
  }

  static createSetCurrentSessionDispatch() {
    return {
      type: 'sessions/setCurrentSessionId',
      payload: 'demo-session'
    };
  }
}
