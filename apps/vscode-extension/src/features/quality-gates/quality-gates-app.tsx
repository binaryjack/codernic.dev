export interface CheckpointRecord {
  checkpointId: string;
  stepIndex: number;
  mode: string;
  verdict: {
    type: 'APPROVE' | 'RETRY' | 'HANDOFF' | 'ESCALATE';
    instructions?: string;
    reason?: string;
  };
  retryCount: number;
  timestamp: string;
  durationMs: number;
}

export interface LaneResult {
  laneId: string;
  status: 'success' | 'failed' | 'escalated' | 'timed-out';
  checkpoints: CheckpointRecord[];
  totalRetries: number;
  durationMs: number;
  error?: string;
}

export interface DagResult {
  dagName: string;
  runId: string;
  status: 'success' | 'partial' | 'failed';
  lanes: LaneResult[];
  totalDurationMs: number;
  startedAt: string;
  completedAt: string;
}

interface QualityGatesAppProps {
  dagResult: DagResult;
}

/**
 * Quality Gates Dashboard - React version
 * Displays quality gate results from DAG execution
 */
export function QualityGatesApp({ dagResult }: QualityGatesAppProps) {
  const totalCheckpoints = dagResult.lanes.reduce((sum, lane) => sum + lane.checkpoints.length, 0);
  const totalRetries = dagResult.lanes.reduce((sum, lane) => sum + lane.totalRetries, 0);
  const passedLanes = dagResult.lanes.filter((l) => l.status === 'success').length;

  return (
    <div style={styles.body}>
      <div style={styles.container}>
        <h1 style={styles.h1}>🎯 Quality Gates Dashboard</h1>
        <p style={styles.subtitle}>
          DAG: {dagResult.dagName} • Run: {dagResult.runId}
        </p>

        {/* Summary Statistics */}
        <div style={styles.summary}>
          <div style={styles.stat}>
            <div
              style={{
                ...styles.statValue,
                color: dagResult.status === 'success' ? '#2ea043' : '#f85149',
              }}
            >
              {dagResult.status.toUpperCase()}
            </div>
            <div style={styles.statLabel}>Overall Status</div>
          </div>
          <div style={styles.stat}>
            <div style={{ ...styles.statValue, color: '#2ea043' }}>
              {passedLanes}/{dagResult.lanes.length}
            </div>
            <div style={styles.statLabel}>Lanes Passed</div>
          </div>
          <div style={styles.stat}>
            <div style={{ ...styles.statValue, color: 'var(--vscode-textLink-foreground)' }}>
              {totalCheckpoints}
            </div>
            <div style={styles.statLabel}>Quality Checks</div>
          </div>
          <div style={styles.stat}>
            <div
              style={{
                ...styles.statValue,
                color: totalRetries > 0 ? '#d29922' : '#2ea043',
              }}
            >
              {totalRetries}
            </div>
            <div style={styles.statLabel}>Total Retries</div>
          </div>
        </div>

        {/* Lane Results */}
        {dagResult.lanes.map((lane) => (
          <LaneCard key={lane.laneId} lane={lane} />
        ))}

        <div style={styles.footer}>
          <p>
            Duration: {(dagResult.totalDurationMs / 1000).toFixed(2)}s • Started:{' '}
            {new Date(dagResult.startedAt).toLocaleTimeString()}
          </p>
          <p style={{ marginTop: '0.5rem' }}>
            Zero-Hallucination Philosophy: All checkpoints use FTS5 verification
          </p>
        </div>
      </div>
    </div>
  );
}

interface LaneCardProps {
  lane: LaneResult;
}

function LaneCard({ lane }: LaneCardProps) {
  const statusIcon =
    {
      success: '✅',
      failed: '❌',
      escalated: '⚠️',
      'timed-out': '⏱️',
    }[lane.status] || '❓';

  const statusStyles = {
    success: { background: 'rgba(46, 160, 67, 0.15)', color: '#2ea043' },
    failed: { background: 'rgba(248, 81, 73, 0.15)', color: '#f85149' },
    escalated: { background: 'rgba(210, 153, 34, 0.15)', color: '#d29922' },
    'timed-out': { background: 'rgba(140, 140, 140, 0.15)', color: '#8c8c8c' },
  }[lane.status] || { background: 'rgba(140, 140, 140, 0.15)', color: '#8c8c8c' };

  return (
    <div style={styles.lane}>
      <div style={styles.laneHeader}>
        <div style={styles.laneTitle}>{lane.laneId}</div>
        <div style={{ ...styles.laneStatus, ...statusStyles }}>
          <span>{statusIcon}</span>
          <span>{lane.status.toUpperCase()}</span>
        </div>
      </div>
      <div style={styles.checkpoints}>
        {lane.checkpoints.map((checkpoint, idx) => (
          <CheckpointCard key={checkpoint.checkpointId} checkpoint={checkpoint} index={idx} />
        ))}
      </div>
      {lane.error && (
        <div style={styles.errorBox}>
          <p style={styles.errorText}>{lane.error}</p>
        </div>
      )}
    </div>
  );
}

interface CheckpointCardProps {
  checkpoint: CheckpointRecord;
  index: number;
}

function CheckpointCard({ checkpoint, index }: CheckpointCardProps) {
  const cpIcon =
    {
      APPROVE: '✅',
      RETRY: '🔄',
      HANDOFF: '👉',
      ESCALATE: '⚠️',
    }[checkpoint.verdict.type] || '❓';

  return (
    <div style={styles.checkpoint}>
      <div style={styles.checkpointIcon}>{cpIcon}</div>
      <div style={styles.checkpointDetails}>
        <h4 style={styles.checkpointH4}>
          {index + 1}. {checkpoint.checkpointId}
        </h4>
        <p style={styles.checkpointP}>
          Mode: {checkpoint.mode} • Verdict: {checkpoint.verdict.type}
        </p>
        {checkpoint.verdict.instructions && (
          <p style={styles.checkpointP}>Instructions: {checkpoint.verdict.instructions}</p>
        )}
        {checkpoint.verdict.reason && (
          <p style={styles.checkpointP}>Reason: {checkpoint.verdict.reason}</p>
        )}
        {checkpoint.retryCount > 0 && (
          <span style={styles.retryBadge}>
            {checkpoint.retryCount} {checkpoint.retryCount === 1 ? 'retry' : 'retries'}
          </span>
        )}
      </div>
      <div style={styles.checkpointMeta}>
        <div>{(checkpoint.durationMs / 1000).toFixed(2)}s</div>
        <div>{new Date(checkpoint.timestamp).toLocaleTimeString()}</div>
      </div>
    </div>
  );
}

const styles = {
  body: {
    fontFamily: 'var(--vscode-font-family)',
    color: 'var(--vscode-foreground)',
    backgroundColor: 'var(--vscode-editor-background)',
    padding: '1.5rem',
    lineHeight: 1.6,
  },
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
  },
  h1: {
    fontSize: '1.8rem',
    marginBottom: '0.5rem',
    color: 'var(--vscode-textLink-foreground)',
  },
  subtitle: {
    fontSize: '1rem',
    color: 'var(--vscode-descriptionForeground)',
    marginBottom: '1.5rem',
  },
  summary: {
    background: 'var(--vscode-editor-inactiveSelectionBackground)',
    border: '1px solid var(--vscode-panel-border)',
    borderRadius: '8px',
    padding: '1.5rem',
    marginBottom: '1.5rem',
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '1.5rem',
  },
  stat: {
    textAlign: 'center' as const,
  },
  statValue: {
    fontSize: '2rem',
    fontWeight: 'bold' as const,
    marginBottom: '0.25rem',
  },
  statLabel: {
    fontSize: '0.9rem',
    color: 'var(--vscode-descriptionForeground)',
  },
  lane: {
    background: 'var(--vscode-editor-inactiveSelectionBackground)',
    border: '1px solid var(--vscode-panel-border)',
    borderRadius: '8px',
    padding: '1.5rem',
    marginBottom: '1rem',
  },
  laneHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '1rem',
    paddingBottom: '1rem',
    borderBottom: '1px solid var(--vscode-panel-border)',
  },
  laneTitle: {
    fontSize: '1.2rem',
    fontWeight: 'bold' as const,
  },
  laneStatus: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    fontSize: '0.9rem',
    padding: '0.5rem 1rem',
    borderRadius: '4px',
  },
  checkpoints: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '0.75rem',
  },
  checkpoint: {
    background: 'var(--vscode-editor-background)',
    border: '1px solid var(--vscode-panel-border)',
    borderRadius: '6px',
    padding: '1rem',
    display: 'grid',
    gridTemplateColumns: '3rem 1fr auto',
    gap: '1rem',
    alignItems: 'center',
  },
  checkpointIcon: {
    fontSize: '2rem',
    textAlign: 'center' as const,
  },
  checkpointDetails: {},
  checkpointH4: {
    fontSize: '1rem',
    marginBottom: '0.25rem',
    color: 'var(--vscode-textLink-foreground)',
  },
  checkpointP: {
    fontSize: '0.85rem',
    color: 'var(--vscode-descriptionForeground)',
  },
  checkpointMeta: {
    textAlign: 'right' as const,
    fontSize: '0.85rem',
    color: 'var(--vscode-descriptionForeground)',
  },
  retryBadge: {
    display: 'inline-block',
    background: 'rgba(210, 153, 34, 0.15)',
    color: '#d29922',
    padding: '0.25rem 0.5rem',
    borderRadius: '3px',
    fontSize: '0.75rem',
    marginTop: '0.25rem',
  },
  errorBox: {
    background: 'rgba(248, 81, 73, 0.1)',
    borderLeft: '3px solid #f85149',
    padding: '1rem',
    marginTop: '1rem',
    borderRadius: '4px',
  },
  errorText: {
    fontFamily: 'var(--vscode-editor-font-family)',
    fontSize: '0.9rem',
    color: '#f85149',
  },
  footer: {
    marginTop: '2rem',
    paddingTop: '1rem',
    borderTop: '1px solid var(--vscode-panel-border)',
    textAlign: 'center' as const,
    color: 'var(--vscode-descriptionForeground)',
    fontSize: '0.85rem',
  },
} as const;
