import type { DagNode, IDagSequenceStrategy } from '../i-dag-sequence';

export class StepSuccessStrategy implements IDagSequenceStrategy<{ node_id: string }> {
  execute(currentNodes: DagNode[], payload: { node_id: string }): DagNode[] {
    return currentNodes.map((n) => (n.id === payload.node_id ? { ...n, status: 'success' } : n));
  }
}
