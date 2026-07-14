import { createIntrospectionState } from '@binaryjack/state-factories';

export class IntrospectionFactory {
  static createMockIntrospectionDispatch() {
    const state = createIntrospectionState({
      activeIntrospectionId: 'demo-intro',
      sessions: {
        'demo-intro': {
          introspectionId: 'demo-intro',
          sessionId: 'demo-session',
          confidenceScore: 85,
          mode: 'free-flow',
          nodes: [
            {
              id: 'node-1',
              timestamp: new Date(Date.now() - 20000).toISOString(),
              type: 'thought',
              content: 'Planner identified 5 key requirements. Delegating to Architect.',
            },
            {
              id: 'node-2',
              timestamp: new Date(Date.now() - 15000).toISOString(),
              type: 'divergence',
              content: '[PIRSIG] Warning: Architect proposed monolithic structure which violates scalability requirement (REQ-003). Requesting revision.',
              messageId: 'demo-msg-1',
            },
            {
              id: 'node-3',
              timestamp: new Date(Date.now() - 10000).toISOString(),
              type: 'convergence',
              content: '[ALIGNMENT] Architect adapted to microservices topology. Pirsig approved structural schema.',
              messageId: 'demo-msg-1',
            },
            {
              id: 'node-4',
              timestamp: new Date(Date.now() - 5000).toISOString(),
              type: 'dag_arbitration',
              content: '[PIRSIG] Code quality heuristic suggests extracting reusable hooks in the React frontend.',
              messageId: 'demo-msg-1',
            }
          ] as any
        }
      }
    });

    const introSession = state.sessions['demo-intro'];

    return [
      {
        type: 'introspection/initIntrospection',
        payload: {
          introspectionId: introSession.introspectionId,
          sessionId: introSession.sessionId,
          mode: introSession.mode
        }
      },
      {
        type: 'introspection/setActiveIntrospection',
        payload: state.activeIntrospectionId
      },
      {
        type: 'introspection/setConfidenceScore',
        payload: {
          introspectionId: introSession.introspectionId,
          score: introSession.confidenceScore
        }
      },
      ...introSession.nodes.map(node => ({
        type: 'introspection/addIntrospectionNode',
        payload: {
          introspectionId: introSession.introspectionId,
          node
        }
      }))
    ];
  }
}
