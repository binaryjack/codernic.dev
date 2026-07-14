import { createDagState } from '@binaryjack/state-factories';

export class GalileusFactory {
  static createMockAgentEvents() {
    const state = createDagState({
      introspectionEvents: [
        { 
          id: 'evt-1', step_id: 'System', type: 'dag_initialized', timestamp: Date.now() - 30000, 
          payload: { 
            nodes: JSON.stringify([
              { id: 'UserProxy', role: 'UserProxy', status: 'idle', dependencies: [] },
              { id: 'Planner', role: 'Planner', status: 'idle', dependencies: ['UserProxy'] },
              { id: 'Architect', role: 'Architect', status: 'idle', dependencies: ['Planner'] },
              { id: 'Pirsig', role: 'Reviewer', status: 'idle', dependencies: ['Planner', 'Architect'] },
              { id: 'Coder_Frontend', role: 'Coder', status: 'idle', dependencies: ['Architect', 'Pirsig'] },
              { id: 'Coder_Backend', role: 'Coder', status: 'idle', dependencies: ['Architect', 'Pirsig'] },
              { id: 'Security_Analyst', role: 'Analyst', status: 'idle', dependencies: ['Coder_Backend'] },
              { id: 'QA_Tester', role: 'QA', status: 'idle', dependencies: ['Coder_Frontend', 'Coder_Backend', 'Security_Analyst'] },
              { id: 'Deployer', role: 'Deployer', status: 'idle', dependencies: ['QA_Tester'] }
            ])
          }
        },
        { id: 'evt-2', step_id: 'UserProxy', type: 'step_start', timestamp: Date.now() - 29000, payload: {} },
        { id: 'evt-3', step_id: 'UserProxy', type: 'step_success', timestamp: Date.now() - 28000, payload: {} },
        { id: 'evt-4', step_id: 'Planner', type: 'step_start', timestamp: Date.now() - 27000, payload: {} },
        { id: 'evt-5', step_id: 'Planner', type: 'step_success', timestamp: Date.now() - 24000, payload: {} },
        { id: 'evt-6', step_id: 'Architect', type: 'step_start', timestamp: Date.now() - 23000, payload: {} },
        { id: 'evt-7', step_id: 'Architect', type: 'step_success', timestamp: Date.now() - 19000, payload: {} },
        { id: 'evt-8', step_id: 'Pirsig', type: 'step_start', timestamp: Date.now() - 18000, payload: {} },
        { id: 'evt-9', step_id: 'Pirsig', type: 'step_success', timestamp: Date.now() - 15000, payload: {} },
        { id: 'evt-10', step_id: 'Coder_Frontend', type: 'step_start', timestamp: Date.now() - 14000, payload: {} },
        { id: 'evt-11', step_id: 'Coder_Backend', type: 'step_start', timestamp: Date.now() - 14000, payload: {} },
        { id: 'evt-12', step_id: 'Coder_Backend', type: 'step_success', timestamp: Date.now() - 8000, payload: {} },
        { id: 'evt-13', step_id: 'Security_Analyst', type: 'step_start', timestamp: Date.now() - 7000, payload: {} },
        // Coder_Frontend is still running, Security_Analyst is running.
      ] as any
    });
    return state.introspectionEvents;
  }

  static createDispatchAction() {
    return this.createMockAgentEvents().map(evt => ({
      type: 'dag/addIntrospectionEvent',
      payload: evt
    }));
  }
}

