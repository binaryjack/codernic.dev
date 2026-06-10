import { useState } from 'react';
import { useSelector } from 'react-redux';
import { selectNodeIds, selectNodesMap } from '../../../entities/kernel';
import { DagNodeCard } from './dag-node-card';
import { ErathosCanvas } from './ErathosCanvas';

export function DagPipeline() {
  const [activeTab, setActiveTab] = useState<'canvas' | 'list'>('canvas');
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
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#3b82f6', boxShadow: '0 0 6px #3b82f6' }} />
          <h3 style={{ fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#71717a' }}>
            Agent Pipeline Monitor
          </h3>
        </div>
        
        {/* Segmented Tab Controls */}
        <div style={{ display: 'flex', background: '#1c1c22', padding: '2px', borderRadius: '4px', border: '1px solid #27272a' }}>
          <button
            onClick={() => setActiveTab('canvas')}
            style={{
              padding: '4px 8px',
              fontSize: '10px',
              fontWeight: 600,
              borderRadius: '3px',
              border: 'none',
              background: activeTab === 'canvas' ? '#27272a' : 'transparent',
              color: activeTab === 'canvas' ? '#ffffff' : '#71717a',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
          >
            Interactive Canvas
          </button>
          <button
            onClick={() => setActiveTab('list')}
            style={{
              padding: '4px 8px',
              fontSize: '10px',
              fontWeight: 600,
              borderRadius: '3px',
              border: 'none',
              background: activeTab === 'list' ? '#27272a' : 'transparent',
              color: activeTab === 'list' ? '#ffffff' : '#71717a',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
          >
            Sequence List
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {activeTab === 'canvas' ? (
          <ErathosCanvas />
        ) : (
          renderTreeNodes(null, 0)
        )}
      </div>
    </div>
  );
}
