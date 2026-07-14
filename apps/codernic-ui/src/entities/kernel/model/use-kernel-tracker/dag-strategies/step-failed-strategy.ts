import type { IDagSequenceStrategy } from '../i-dag-sequence';
import type { DagNode } from '../../types';

export class StepFailedStrategy implements IDagSequenceStrategy<{
  node_id: string;
  error: string;
}> {
  execute(currentNodes: DagNode[], payload: { node_id: string; error: string }): DagNode[] {
    return currentNodes.map((n) =>
      n.id === payload.node_id ? { ...n, status: 'failed', errorLog: payload.error } : n,
    );
  }
}
