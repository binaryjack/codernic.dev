import { useSelector } from 'react-redux';
import { selectDagNodeById } from '../../../entities/kernel';
import type { NodeStatus } from '../../../entities/kernel/model/use-kernel-tracker/i-dag-sequence';

interface DagNodeCardProps {
  nodeId: string;
  level: number;
}

const BADGE_STYLES: Record<NodeStatus, React.CSSProperties> = {
  pending: {
    background: '#18181b',
    color: '#71717a',
    borderColor: '#27272a',
  },
  running: {
    background: 'rgba(59, 130, 246, 0.1)',
    color: '#60a5fa',
    borderColor: '#3b82f6',
  },
  success: {
    background: 'rgba(16, 185, 129, 0.1)',
    color: '#34d399',
    borderColor: '#10b981',
  },
  failed: {
    background: 'rgba(239, 68, 68, 0.1)',
    color: '#f87171',
    borderColor: '#ef4444',
  },
};

export function DagNodeCard({ nodeId, level }: DagNodeCardProps) {
  const node = useSelector((state: any) => selectDagNodeById(state, nodeId));
  if (!node) return null;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '4px',
        marginBottom: '8px',
        position: 'relative',
        marginLeft: `${level * 20}px`,
      }}
    >
      {level > 0 && (
        <div
          style={{
            position: 'absolute',
            left: '-14px',
            top: '12px',
            color: '#3f3f46',
            fontFamily: 'var(--mono)',
            fontSize: '11px',
            lineHeight: 1,
            userSelect: 'none',
          }}
        >
          ↳
        </div>
      )}
      <div
        style={{
          padding: '10px 12px',
          borderRadius: '6px',
          border: node.status === 'running' ? '1px solid #3b82f6' : '1px solid var(--border, #27272a)',
          background: '#18181b',
          boxShadow: node.status === 'running' ? '0 0 10px rgba(59, 130, 246, 0.1)' : 'var(--shadow)',
          transition: 'all 0.3s ease',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontWeight: 600, fontSize: '11px', color: 'var(--text-h)' }}>{node.role}</span>
            <span
              style={{
                fontSize: '8px',
                fontWeight: 700,
                padding: '2px 6px',
                borderRadius: '4px',
                border: '1px solid',
                ...BADGE_STYLES[node.status],
              }}
            >
              {node.status.toUpperCase()}
            </span>
          </div>
          <span style={{ fontSize: '9px', fontFamily: 'var(--mono)', color: '#71717a' }}>
            {node.id.slice(0, 8)}
          </span>
        </div>

        {node.errorLog && (
          <div
            style={{
              marginTop: '8px',
              padding: '6px 10px',
              borderRadius: '4px',
              background: 'rgba(239, 68, 68, 0.05)',
              border: '1px solid rgba(239, 68, 68, 0.15)',
              fontSize: '10px',
              color: '#f87171',
              fontFamily: 'var(--mono)',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-all',
            }}
          >
            {node.errorLog}
          </div>
        )}
      </div>
    </div>
  );
}
