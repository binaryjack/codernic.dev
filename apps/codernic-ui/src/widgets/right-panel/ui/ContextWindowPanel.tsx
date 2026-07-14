import { useSelector } from 'react-redux';
import { selectContextStats } from '../../../features/system/store/system.slice';
import { selectContextFiles } from '../../../features/chat/store/chat.slice';
import { selectMetrics } from '../../../features/system/store/system.slice';
import { IconLayers, IconFileText, IconCoins, IconZap, IconActivity } from '@ai-agencee/ui';
import { useTestId } from '@ai-agencee/ui';

/* ── Shared row ── */
function DataRow({ label, value, valueColor }: { label: string; value: React.ReactNode; valueColor?: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px solid var(--border-subtle)' }}>
      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{label}</span>
      <span style={{ fontSize: '11px', fontFamily: 'var(--mono)', fontWeight: 600, color: valueColor || 'var(--text-primary)' }}>
        {value}
      </span>
    </div>
  );
}

export function ContextWindowPanel() {
  
  const { rootId, getTestId } = useTestId('context-window-panel', typeof dataTestId !== 'undefined' ? dataTestId : undefined);
const contextStats = useSelector(selectContextStats);
  const contextFiles = useSelector(selectContextFiles);
  const metrics = useSelector(selectMetrics);

  const maxTokens = contextStats?.max_tokens ?? 128000;
  const currentTokens = metrics?.context_tokens_count ?? contextStats?.current_tokens ?? 0;
  const usagePercent = maxTokens > 0 ? (currentTokens / maxTokens) * 100 : 0;

  const savings = metrics?.cost_saved_usd ?? ((currentTokens / 1_000_000) * 5);
  const ockhamRatio = metrics?.prompt_tokens_original && metrics?.prompt_tokens_compressed
    ? ((1 - (metrics.prompt_tokens_compressed / metrics.prompt_tokens_original)) * 100).toFixed(1)
    : null;

  const gaugeColor =
    usagePercent >= 90 ? 'var(--status-error)' :
    usagePercent >= 60 ? 'var(--amber-400)' :
    'var(--status-ok)';

  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (Math.min(100, usagePercent) / 100) * circumference;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

      {/* Token gauge card */}
      <div
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-md)',
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '12px',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Top accent */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: `linear-gradient(90deg, ${gaugeColor}, transparent)` }} />

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', alignSelf: 'flex-start' }}>
          <IconLayers data-testid={getTestId('icon-layers')} size={12} color="var(--text-muted)" />
          <span className="section-label">Token Management</span>
        </div>

        {/* Donut gauge */}
        <div style={{ position: 'relative', width: '110px', height: '110px', flexShrink: 0 }}>
          <svg width="110" height="110" viewBox="0 0 100 100" style={{ transform: 'rotate(-90deg)' }}>
            {/* Track */}
            <circle cx="50" cy="50" r={radius} fill="transparent" stroke="rgba(255,255,255,0.06)" strokeWidth="8" />
            {/* Progress */}
            <circle
              cx="50" cy="50" r={radius}
              fill="transparent"
              stroke={gaugeColor}
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              style={{ transition: 'stroke-dashoffset 0.5s ease, stroke 0.3s ease' }}
            />
          </svg>
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center',
            }}
          >
            <span style={{ fontSize: '18px', fontWeight: 800, fontFamily: 'var(--mono)', color: gaugeColor, letterSpacing: '-0.04em' }}>
              {usagePercent.toFixed(0)}%
            </span>
            <span style={{ fontSize: '9px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              used
            </span>
          </div>
        </div>

        {/* Token counts */}
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '20px', fontWeight: 800, fontFamily: 'var(--mono)', color: 'var(--text-heading)', letterSpacing: '-0.04em' }}>
            {currentTokens.toLocaleString()}
          </div>
          <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'var(--mono)', marginTop: '2px' }}>
            / {maxTokens.toLocaleString()} tokens
          </div>
        </div>

        {/* Savings chip */}
        <div
          className="badge badge-green"
          style={{ gap: '5px', fontSize: '10px' }}
        >
          <IconCoins size={10} />
          Saved est. ${savings.toFixed(4)}
        </div>
        
        {ockhamRatio && (
          <div
            className="badge badge-amber"
            style={{ gap: '5px', fontSize: '10px', marginTop: '-8px' }}
          >
            Ockham Reduced by {ockhamRatio}%
          </div>
        )}

        {/* Metrics */}
        {metrics && (
          <div style={{ width: '100%', paddingTop: '8px', borderTop: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', gap: '0' }}>
            <DataRow data-testid={getTestId('data-row')}
              label={<span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}><IconZap data-testid={getTestId('icon-zap')} size={11} color="var(--text-muted)" />TTFT</span> as unknown as string}
              value={`${metrics.ttft_ms} ms`}
              valueColor="var(--status-ok)"
            />
            <DataRow data-testid={getTestId('data-row-1')}
              label={<span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}><IconActivity data-testid={getTestId('icon-activity')} size={11} color="var(--text-muted)" />Speed</span> as unknown as string}
              value={`${metrics.tokens_per_second.toFixed(1)} t/s`}
              valueColor="var(--accent-journey)"
            />
          </div>
        )}
      </div>

      {/* Context Files */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <IconFileText data-testid={getTestId('icon-file-text')} size={11} color="var(--text-muted)" />
          <span className="section-label">Attached Files</span>
        </div>
        <div className="divider-gradient" />

        {contextFiles.length === 0 ? (
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontStyle: 'italic' }}>
            No files attached to context.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
            {contextFiles.map((file) => (
              <div
                key={file.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '5px 8px',
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-sm)',
                  gap: '8px',
                  flexShrink: 0,
                }}
              >
                <span
                  style={{
                    flex: 1,
                    fontSize: '10px',
                    fontFamily: 'var(--mono)',
                    color: 'var(--text-primary)',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {file.fileName}
                </span>
                {file.lines && (
                  <span style={{ fontSize: '9px', color: 'var(--text-muted)', fontFamily: 'var(--mono)', flexShrink: 0 }}>
                    L{file.lines[0]}–{file.lines[1]}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
