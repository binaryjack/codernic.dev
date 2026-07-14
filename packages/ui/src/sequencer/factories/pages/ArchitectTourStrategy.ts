import { PageStrategy } from './PageStrategy';
import type { StepAction } from '../../core/StateMachine';

export class ArchitectTourStrategy implements PageStrategy {
  getEntryKey() {
    return 'architect_init_layout';
  }

  getInitActions() {
    return [];
  }

  getSequence(): Record<string, StepAction> {
    return {
      'architect_init_layout': {
        target: 'layout-engine',
        action: 'introspection',
        payload: { method: 'switchLayout', args: ['Architect', true] },
        autoAdvance: true,
        next: 'architect_inject_pirsig'
      },
      'architect_inject_pirsig': {
        target: 'pirsig.widget',
        action: 'injectData',
        payload: {
          slice: 'pirsig',
          data: {
            kpi_score: 45,
            qualitative_flags: [
              '[FAILED] Zero Warnings Policy',
              '[FAILED] Strict Boundaries'
            ]
          }
        },
        autoAdvance: true,
        next: 'architect_inject_dag'
      },
      'architect_inject_dag': {
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
        next: 'architect_inject_events'
      },
      'architect_inject_events': {
        target: 'agent-events-widget-root',
        action: 'injectData',
        payload: {
          slice: 'agent_events',
          data: {
            events: [
              { type: 'step_start', step_id: 'plan_1' },
              { type: 'agent-thinking-stream', delta: 'Analyzing requirements...' },
              { type: 'ToolExecutionResult', payload: { tool_name: 'search', success: true } },
              { type: 'step_success', step_id: 'plan_1' }
            ]
          }
        },
        autoAdvance: true,
        next: 'architect_pirsig'
      },
      'architect_pirsig': {
        target: 'pirsig-widget-root',
        action: 'highlight',
        content: "[ARCHITECT] The Pirsig Quality Auditing panel displays real-time compliance scores and static code analysis results.",
        next: 'architect_pirsig_score'
      },
      'architect_pirsig_score': {
        target: 'pirsig-score',
        action: 'highlight',
        content: "[ARCHITECT] Your architectural quality score dynamically adjusts as you modify components.",
        next: 'architect_pirsig_flags'
      },
      'architect_pirsig_flags': {
        target: 'pirsig-flag-flag-0',
        action: 'highlight',
        content: "[ARCHITECT] Check specific rules like clean architecture boundaries and complexity limits.",
        next: 'architect_events'
      },
      'architect_events': {
        target: 'agent-events-widget-root',
        action: 'highlight',
        content: "[ARCHITECT] The Agent Events panel displays the granular trace of running agent workflows.",
        next: 'architect_erathos' // Removed architect_events_item since we don't mock the data yet
      },
      'architect_erathos': {
        target: 'erathos-widget-root',
        action: 'highlight',
        content: "[ARCHITECT] The Erathos DAG view is an interactive canvas presenting the running workflow topology.",
        next: 'architect_erathos_canvas'
      },
      'architect_erathos_canvas': {
        target: 'erathos-canvas',
        action: 'highlight',
        content: "[ARCHITECT] Watch the live dataflow and execution paths of containerized agents as they complete steps."
      }
    };
  }
}
