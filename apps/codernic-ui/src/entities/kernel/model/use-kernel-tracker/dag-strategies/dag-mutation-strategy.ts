import type { IDagSequenceStrategy } from '../i-dag-sequence';
import type { DagNode } from '../../types';

export interface DagMutationPayload {
  failed_node: string;
  new_reviewer_node: string;
  affected_children: string[];
  error: string;
}

export class DagMutationStrategy implements IDagSequenceStrategy<DagMutationPayload> {
  execute(currentNodes: DagNode[], payload: DagMutationPayload): DagNode[] {
    const { failed_node, new_reviewer_node, affected_children, error } = payload;

    // 1. Mark failed node
    let nextNodes: DagNode[] = currentNodes.map((n) =>
      n.id === failed_node ? { ...n, status: 'failed', errorLog: error } : n,
    );

    // 2. Add Reviewer node if not exists
    if (!nextNodes.some((n) => n.id === new_reviewer_node)) {
      nextNodes.push({
        id: new_reviewer_node,
        role: 'Reviewer',
        status: 'pending',
        dependencies: [failed_node],
      });
    }

    // 3. Update children dependencies
    nextNodes = nextNodes.map((n) => {
      if (affected_children.includes(n.id)) {
        return {
          ...n,
          dependencies: n.dependencies
            .filter((d: string) => d !== failed_node)
            .concat(new_reviewer_node),
        };
      }
      return n;
    });

    return nextNodes;
  }
}
