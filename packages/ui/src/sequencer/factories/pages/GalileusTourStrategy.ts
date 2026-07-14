import { PageStrategy } from './PageStrategy';
import type { StepAction } from '../../core/StateMachine';

export class GalileusTourStrategy implements PageStrategy {
  getEntryKey() {
    return 'galileus_init_layout';
  }

  getInitActions() {
    return [];
  }

  getSequence(): Record<string, StepAction> {
    return {
      'galileus_init_layout': {
        target: 'layout-engine',
        action: 'introspection',
        payload: { method: 'switchLayout', args: ['Integrator', true] },
        autoAdvance: true,
        next: 'galileus_inject_data'
      },
      'galileus_inject_data': {
        target: 'galileus-router.widget',
        action: 'injectData',
        payload: {
          slice: 'dag',
          data: {
            nodes: [
              { id: 'node-A', type: 'agent', data: { label: 'Planner' } },
              { id: 'node-B', type: 'agent', data: { label: 'Executor' } }
            ],
            edges: [
              { id: 'edge-AB', source: 'node-A', target: 'node-B' }
            ]
          }
        },
        autoAdvance: true,
        next: 'galileus_lanes'
      },
      'galileus_lanes': {
        target: 'galileus-lanes',
        action: 'highlight',
        content: "[GALILEUS] Telemetry traces populate directly in the swimlanes.",
        next: 'galileus_topology'
      },
      'galileus_topology': {
        target: 'galileus-topology-widget',
        action: 'highlight',
        content: "[ROUTER] Watch requests get intelligently routed to specialized models.",
        next: 'galileus_heading'
      },
      'galileus_heading': {
        target: 'heading',
        action: 'highlight',
        content: "[ROUTER] Live view of the routing cluster."
      }
    };
  }
}
