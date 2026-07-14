import { selectActiveIntrospectionSession } from "../../../entities/introspection/model/introspection-slice";
import { useSelector } from 'react-redux';
import { selectCurrentSessionName } from '../../../features/sessions/store/sessions.slice';
import { IconZap, IconDot, IconTool, IconThought, IconRepeat, IconCircle, useHubEvent } from '@ai-agencee/ui';
import { useTestId } from '@ai-agencee/ui';
import { WidgetHub } from '@ai-agencee/ui';
import { useState } from 'react';

export function ConfidenceSlider({ dataTestId, score }: { dataTestId?: string, score: number | null }) {
  if (score === null) return null;
  const isConfident = score >= 70;
  const isDoubtful  = score <= 30;
  const barColor = isDoubtful ? 'var(--status-error)' : isConfident ? 'var(--status-ok)' : 'var(--amber-400)';
  const textColor = isDoubtful ? 'var(--status-error)' : isConfident ? 'var(--status-ok)' : 'var(--amber-400)';
  const label = isDoubtful ? 'Low confidence — clarify intent' : isConfident ? 'High confidence' : 'Moderate — more context may help';

  return (
    <div
      data-testid={dataTestId || "introspection-confidence"}
      style={{
        padding: '10px 12px',
        borderBottom: '1px solid var(--border)',
        display: 'flex',
        flexDirection: 'column',
        gap: '6px',
        background: 'var(--bg-card)',
        flexShrink: 0,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-muted)' }}>
          Confidence
        </span>
        <span style={{ fontSize: '12px', fontWeight: 700, fontFamily: 'var(--mono)', color: textColor }}>
          {score}%
        </span>
      </div>
      <div style={{ width: '100%', height: '3px', background: 'var(--border)', borderRadius: '2px', overflow: 'hidden' }}>
        <div
          style={{
            height: '100%',
            width: `${score}%`,
            background: barColor,
            borderRadius: '2px',
            transition: 'width 0.5s ease, background 0.3s ease',
            boxShadow: `0 0 8px ${barColor}`,
          }}
        />
      </div>
      <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontStyle: 'italic' }}>{label}</div>
    </div>
  );
}

const nodeColor = (type: string) => {
  switch (type) {
    case 'thought':     return 'var(--accent-ask)';
    case 'convergence': return 'var(--status-ok)';
    case 'divergence':  return 'var(--amber-400)';
    case 'tool_call':   return 'var(--accent-journey)';
    case 'phase':       return 'var(--blue-400)';
    default:            return 'var(--status-error)';
  }
};

const NodeIcon = ({ dataTestId, type }: { type: string; dataTestId?: string; }) => {
  
  const { rootId, getTestId } = useTestId('node-icon', dataTestId);
const color = nodeColor(type);
  if (type === 'thought')     return <IconThought data-testid={getTestId('icon-thought')} size={10} color={color} />;
  if (type === 'convergence') return <IconZap data-testid={getTestId('icon-zap')} size={10} color={color} />;
  if (type === 'divergence')  return <IconRepeat data-testid={getTestId('icon-repeat')} size={10} color={color} />;
  if (type === 'tool_call')   return <IconTool data-testid={getTestId('icon-tool')} size={10} color={color} />;
  if (type === 'phase')       return <IconDot data-testid={getTestId('icon-dot')} size={10} color={color} />;
  return <IconCircle data-testid={getTestId('icon-circle')} size={10} color={color} />;
};

export function CognitiveTimeline({ dataTestId, nodes }: { dataTestId?: string, nodes: any[] }) {
  if (nodes.length === 0) {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', textAlign: 'center' }}>
        <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontStyle: 'italic' }}>
          Awaiting cognitive stream…
        </div>
      </div>
    );
  }

  const rootId = dataTestId || 'nodes-timeline';
  const [highlightedNodeId, setHighlightedNodeId] = useState<string | null>(null);

  useHubEvent('codernic:focus-introspection', (event) => {
    const targetId = event.payload.id;
    if (targetId) {
      const el = document.getElementById(`introspection-node-${targetId}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        setHighlightedNodeId(targetId);
        setTimeout(() => setHighlightedNodeId(null), 2000);
      }
    }
  });

  useHubEvent('codernic:focus-introspection-message', (event) => {
    const messageId = event.payload.id;
    if (messageId) {
      // Find the first node with this messageId
      const targetNode = nodes.find(n => n.messageId === messageId);
      if (targetNode) {
        const el = document.getElementById(`introspection-node-${targetNode.id}`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          setHighlightedNodeId(targetNode.id);
          setTimeout(() => setHighlightedNodeId(null), 2000);
        }
      }
    }
  });

  return (
    <div data-testid={rootId} style={{ flex: 1, overflowY: 'auto', padding: '12px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {nodes.map((node, index) => (
        <div key={node.id} style={{ position: 'relative', paddingLeft: '22px' }}>
          {/* Connecting line */}
          {index !== nodes.length - 1 && (
            <div
              style={{
                position: 'absolute',
                left: '7px',
                top: '18px',
                bottom: '-12px',
                width: '1px',
                background: 'var(--border)',
              }}
            />
          )}
          {/* Node marker */}
          <div
            style={{
              position: 'absolute',
              left: 0,
              top: '4px',
              width: '16px',
              height: '16px',
              borderRadius: '50%',
              background: 'var(--bg-panel)',
              border: `1px solid ${nodeColor(node.type)}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <NodeIcon data-testid={`${rootId}-item-${node.id}`} type={node.type} />
          </div>
          {/* Node card */}
          <div
            data-testid={`introspection-node-${node.id}`}
            onClick={() => {
              if (node.type === 'thought') {
                const el = document.getElementById(node.id);
                if (el) {
                  el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
                WidgetHub.publish({
                  type: 'codernic:focus-thought',
                  payload: { id: node.id },
                  dedupKey: `focus-thought-${node.id}`
                });
              } else if (node.messageId) {
                WidgetHub.publish({
                  type: 'codernic:focus-message',
                  payload: { id: node.messageId },
                  dedupKey: `focus-msg-${node.messageId}`
                });
              }
            }}
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderLeft: `2px solid ${nodeColor(node.type)}`,
              borderRadius: 'var(--radius-sm)',
              padding: '8px 10px',
              display: 'flex',
              flexDirection: 'column',
              gap: '4px',
              cursor: (node.type === 'thought' || node.messageId) ? 'pointer' : 'default',
              transition: 'all 0.3s',
              boxShadow: highlightedNodeId === node.id ? `0 0 15px 2px ${nodeColor(node.type)}` : 'none',
              transform: highlightedNodeId === node.id ? 'scale(1.02)' : 'none',
              zIndex: highlightedNodeId === node.id ? 10 : 1,
            }}
            onMouseEnter={(e) => {
              if (node.type === 'thought' || node.messageId) {
                (e.currentTarget as HTMLElement).style.background = 'var(--vscode-list-hoverBackground, rgba(255,255,255,0.05))';
              }
            }}
            onMouseLeave={(e) => {
              if (node.type === 'thought' || node.messageId) {
                (e.currentTarget as HTMLElement).style.background = 'var(--bg-card)';
              }
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: nodeColor(node.type) }}>
                {node.type.replace('_', ' ')}
              </span>
              <span style={{ fontSize: '9px', color: 'var(--text-muted)', fontFamily: 'var(--mono)' }}>
                {node.timestamp}
              </span>
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-body)', lineHeight: 1.55 }}>
              {node.content}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function IntrospectionPanel({ dataTestId }: { dataTestId?: string } = {}) {
  const { rootId, getTestId } = useTestId('introspection-panel', dataTestId);
  const session = useSelector(selectActiveIntrospectionSession);
  const sessionName = useSelector(selectCurrentSessionName);

  if (!session) {
    return (
      <div data-testid="introspection-panel" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', padding: '20px', textAlign: 'center' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
          <IconDot data-testid={getTestId('icon-dot')} size={24} color="var(--text-muted)" />
          <span style={{ fontSize: '11px', color: 'var(--text-muted)', lineHeight: 1.5 }}>
            Click a "Thinking" indicator in the chat to view introspection.
          </span>
        </div>
      </div>
    );
  }

  return (
    <div data-testid="introspection-panel" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <div
        style={{
          padding: '10px 12px',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'var(--bg-card)',
          flexShrink: 0,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span
            className="status-dot running animate-pulse-amber"
            style={{ width: '6px', height: '6px' }}
          />
          <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-heading)', letterSpacing: '-0.01em' }}>
            Introspection Engine {sessionName ? `- ${sessionName}` : ''}
          </span>
        </div>
        <span className="badge badge-muted" style={{ fontSize: '9px', fontFamily: 'var(--mono)' }}>
          {session.mode}
        </span>
      </div>

      <ConfidenceSlider dataTestId={getTestId('confidence-slider')} score={session.confidenceScore} />
      <CognitiveTimeline dataTestId={getTestId('cognitive-timeline')} nodes={session.nodes} />
    </div>
  );
}
