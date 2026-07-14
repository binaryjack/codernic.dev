import type { IDagSequenceStrategy } from '../i-dag-sequence';
import type { DagNode } from '../../types';

export class StepStartStrategy implements IDagSequenceStrategy<{ node_id: string }> {
  execute(currentNodes: DagNode[], payload: { node_id: string }): DagNode[] {
    return currentNodes.map((n) => (n.id === payload.node_id ? { ...n, status: 'running' } : n));
  }
}
