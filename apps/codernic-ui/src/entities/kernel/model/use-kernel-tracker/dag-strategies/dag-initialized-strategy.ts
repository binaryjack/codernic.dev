import {
  normalizeStatus,
  type DagNode,
  type IDagSequenceStrategy,
  type RawDagNode,
} from '../i-dag-sequence';

export class DagInitializedStrategy implements IDagSequenceStrategy<{ nodes: RawDagNode[] }> {
  execute(_currentNodes: DagNode[], payload: { nodes: RawDagNode[] }): DagNode[] {
    return payload.nodes.map((n: RawDagNode) => {
      const { status, error } = normalizeStatus(n.status);
      return {
        id: n.id,
        role: n.role,
        status,
        dependencies: n.dependencies || [],
        description: n.description,
        errorLog: error,
      };
    });
  }
}
