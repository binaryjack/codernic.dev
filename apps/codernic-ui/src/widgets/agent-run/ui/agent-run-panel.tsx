import { useEffect, useRef, useState } from 'react';
import { vscode, Button } from '../../../shared';
import type { AgentRunState, LaneStatus } from '../../../entities/kernel';

const LANE_STATUS_ICON: Record<LaneStatus, string> = {
  pending: '◌',
  running: '⟳',
  success: '✓',
  failed: '✗',
  escalated: '⚠',
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'success':
      return '#10b981';
    case 'running':
      return '#3b82f6';
    case 'failed':
      return '#ef4444';
    case 'escalated':
      return '#f59e0b';
    default:
      return '#71717a';
  }
};

const getCurrentDate = (startDteAt: number) => {
  return Date.now() - startDteAt;
};

function ElapsedTimer({ startedAt }: { startedAt: number }) {
  const [elapsed, setElapsed] = useState(getCurrentDate(startedAt));

  useEffect(() => {
    const id = setInterval(() => setElapsed(Date.now() - startedAt), 500);
    return () => clearInterval(id);
  }, [startedAt]);

  const totalSec = Math.floor(elapsed / 1000);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return (
    <span>
      {m > 0 ? `${m}m ` : ''}
      {s}s
    </span>
  );
}

interface AgentRunPanelProps {
  run: AgentRunState;
  onDismiss: () => void;
}

export function AgentRunPanel({ run, onDismiss }: AgentRunPanelProps) {
  const endRef = useRef<HTMLDivElement>(null);
  const isDone = run.status !== 'running';

  // Scroll to bottom when lanes update
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [run.lanes]);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        overflow: 'hidden',
        background: '#131316',
        border: '1px solid var(--border, #27272a)',
        borderRadius: '6px',
      }}
    >
      {/* Header — DAG name + status ticker */}
      <div
        style={{
          flexShrink: 0,
          padding: '8px 12px',
          background: '#18181b',
          borderBottom: '1px solid var(--border, #27272a)',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
        }}
      >
        <div
          style={{
            width: '4px',
            height: '20px',
            borderRadius: '2px',
            background: getStatusColor(run.status),
          }}
        />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-h)' }}>{run.dagName}</div>
          <div style={{ fontSize: '10px', color: '#a1a1aa', opacity: 0.8, marginTop: '1px' }}>
            {isDone ? (
              `${run.status.toUpperCase()} · $${run.runningCostUSD.toFixed(4)}`
            ) : (
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                ⟳ <ElapsedTimer startedAt={run.startedAt} /> · ${run.runningCostUSD.toFixed(4)}
              </span>
            )}
          </div>
        </div>

        {isDone ? (
          <Button onClick={onDismiss} variant="secondary" size="xs">
            Dismiss
          </Button>
        ) : (
          <Button
            onClick={() => vscode.postMessage({ type: 'codernic:stop-dag' })}
            variant="danger"
            size="xs"
            style={{ fontWeight: 700 }}
          >
            Stop
          </Button>
        )}
      </div>

      {/* Lane List */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '10px 12px',
          display: 'flex',
          flexDirection: 'column',
          gap: '6px',
        }}
      >
        {run.lanes.map((lane) => (
          <div
            key={lane.id}
            style={{
              padding: '8px 10px',
              borderRadius: '6px',
              background: '#09090b',
              border: `1px solid ${lane.status === 'running' ? '#3b82f6' : 'var(--border, #27272a)'}`,
              transition: 'border-color 0.2s ease',
            }}
          >
            {/* Lane header row */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: lane.checkpoints.length > 0 ? '6px' : '0',
              }}
            >
              <span
                style={{
                  fontSize: '12px',
                  fontFamily: 'var(--mono)',
                  color: getStatusColor(lane.status),
                  fontWeight: 'bold',
                }}
              >
                {LANE_STATUS_ICON[lane.status]}
              </span>
              <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-h)', flex: 1 }}>{lane.id}</span>
              {lane.durationMs !== undefined && (
                <span style={{ fontSize: '10px', color: '#71717a', fontFamily: 'var(--mono)' }}>
                  {(lane.durationMs / 1000).toFixed(1)}s
                </span>
              )}
              {lane.cost > 0 && (
                <span style={{ fontSize: '10px', color: '#71717a', fontFamily: 'var(--mono)' }}>
                  ${lane.cost.toFixed(4)}
                </span>
              )}
            </div>

            {/* Checkpoint badges */}
            {lane.checkpoints.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', paddingLeft: '18px' }}>
                {lane.checkpoints.map((cp) => (
                  <span
                    key={cp.id}
                    title={`${cp.id}: ${cp.verdict} (${(cp.durationMs / 1000).toFixed(1)}s)`}
                    style={{
                      fontSize: '9px',
                      fontFamily: 'var(--mono)',
                      padding: '1px 5px',
                      borderRadius: '4px',
                      background: cp.verdict === 'success' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                      color: cp.verdict === 'success' ? '#34d399' : '#f87171',
                      border: `1px solid ${cp.verdict === 'success' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)'}`,
                    }}
                  >
                    {cp.id}: {cp.verdict}
                  </span>
                ))}
              </div>
            )}
          </div>
        ))}
        <div ref={endRef} />
      </div>
    </div>
  );
}
