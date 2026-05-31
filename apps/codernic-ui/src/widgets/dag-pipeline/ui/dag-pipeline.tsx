import { useSelector } from 'react-redux';
import { selectNodeIds, selectNodesMap } from '../../../entities/kernel';
import { DagNodeCard } from './dag-node-card';

export function DagPipeline() {
  const nodeIds = useSelector(selectNodeIds);
  const nodesMap = useSelector(selectNodesMap);
  const nodes = Object.values(nodesMap);

  if (nodeIds.length === 0) return null;

  // Simple heuristic for topological sorting based on creation order and dependencies
  const renderTreeNodes = (parentId: string | null, level: number): React.ReactNode[] => {
    return nodes
      .filter((n) => {
        if (parentId === null) return n.dependencies.length === 0;
        return n.dependencies.includes(parentId);
      })
      .map((node) => (
        <div key={node.id} style={{ display: 'flex', flexDirection: 'column' }}>
          <DagNodeCard nodeId={node.id} level={level} />
          {renderTreeNodes(node.id, level + 1)}
        </div>
      ));
  };

  return (
    <div
      style={{
        padding: '12px',
        background: '#131316',
        borderRadius: '6px',
        border: '1px solid var(--border, #27272a)',
        margin: '12px 0',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
        <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#3b82f6', boxShadow: '0 0 6px #3b82f6' }} />
        <h3 style={{ fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#71717a' }}>
          Agent Pipeline Monitor
        </h3>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {renderTreeNodes(null, 0)}
      </div>
    </div>
  );
}
