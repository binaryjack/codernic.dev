import type { GalileusSession, WorkspaceSnapshot } from '../../../entities/kernel';

interface GalileusTrackerProps {
  snapshot: WorkspaceSnapshot | null;
  error: string | null;
}

export function GalileusTracker({ snapshot, error }: GalileusTrackerProps) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '160px',
        overflow: 'hidden',
        background: '#131316',
        borderRadius: '6px',
        border: '1px solid var(--border, #27272a)',
        fontSize: '11px',
      }}
    >
      <div
        style={{
          padding: '6px 10px',
          fontWeight: 700,
          background: '#18181b',
          borderBottom: '1px solid var(--border, #27272a)',
          display: 'flex',
          justifyContent: 'space-between',
          textTransform: 'uppercase',
          fontSize: '9px',
          letterSpacing: '0.05em',
          color: '#71717a',
        }}
      >
        <span>🛰️ Galileus Active Sequences</span>
        <span style={{ color: error ? '#ef4444' : '#10b981', fontWeight: 'bold' }}>
          {error ? 'Offline' : `${snapshot?.sessions?.length ?? 0} active`}
        </span>
      </div>

      <div style={{ overflowY: 'auto', flex: 1, padding: '8px' }}>
        {!snapshot?.sessions?.length ? (
          <div
            style={{
              opacity: 0.5,
              fontSize: '11px',
              textAlign: 'center',
              marginTop: '20px',
              color: '#71717a',
            }}
          >
            No active agent sequences
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {snapshot.sessions.map((sess: GalileusSession) => (
              <div
                key={sess.id}
                style={{
                  border: '1px solid var(--border, #27272a)',
                  borderRadius: '4px',
                  padding: '6px 8px',
                  background: '#1c1c1f',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                  <strong style={{ color: '#60a5fa' }}>{sess.label}</strong>
                  <span
                    style={{
                      padding: '1px 5px',
                      borderRadius: '8px',
                      fontSize: '8px',
                      fontWeight: 700,
                      background:
                        sess.state === 'ACTIVE'
                          ? 'rgba(16, 185, 129, 0.15)'
                          : 'rgba(113, 113, 122, 0.15)',
                      color: sess.state === 'ACTIVE' ? '#10b981' : '#71717a',
                    }}
                  >
                    {sess.state}
                  </span>
                </div>
                <div style={{ fontSize: '10px', color: '#a1a1aa' }}>
                  Agent: <span style={{ fontFamily: 'var(--mono)' }}>{sess.agent_type}</span> · Claimed Locks: <span style={{ fontFamily: 'var(--mono)', color: '#fbbf24' }}>{sess.claimed_files_count}</span>
                </div>
                {sess.waiter_count > 0 && (
                  <div style={{ color: '#f59e0b', marginTop: 2, fontSize: '10px', fontWeight: 600 }}>
                    ⚠️ Blocked by {sess.waiter_count} intents in sequence queue
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
