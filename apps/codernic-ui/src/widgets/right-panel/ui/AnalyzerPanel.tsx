import type { RootState } from '../../../store';
import { useSelector } from 'react-redux';
import { selectAnalyseProgress, selectIntrospectionEvents, selectPirsigMetrics, setAnalyseProgress } from '../../../features/dag/store/dag.slice';
import { AnalyseProgressPanel } from '../../analyse-progress';
import { useDispatch } from 'react-redux';
import {
  useTestId,
  IconShield, IconPlay, IconCheck, IconX, IconRepeat, IconTool, IconThought, IconDot,
} from '@ai-agencee/ui';

/* ── Shared panel section wrapper ── */
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <div className="divider-gradient" style={{ flex: 1 }} />
        <span className="section-label">{title}</span>
        <div className="divider-gradient" style={{ flex: 1, transform: 'scaleX(-1)' }} />
      </div>
      {children}
    </section>
  );
}

/* ── Data row: label / value pair ── */
function DataRow({ label, value, valueColor }: { label: string; value: React.ReactNode; valueColor?: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 0' }}>
      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{label}</span>
      <span style={{ fontSize: '11px', fontFamily: 'var(--mono)', fontWeight: 600, color: valueColor || 'var(--text-primary)' }}>
        {value}
      </span>
    </div>
  );
}

export function AnalyzerPanel() {
  const { getTestId } = useTestId('analyzer-panel');
  const dispatch = useDispatch();
  const pirsig = useSelector(selectPirsigMetrics);
  const events = useSelector(selectIntrospectionEvents);
  const currentSessionId = useSelector((state: RootState) => state.sessions.currentSessionId) || '';
  const analyseProgress = useSelector((state: RootState) => selectAnalyseProgress(state, currentSessionId));

  const kpiColor = pirsig
    ? pirsig.kpi_score >= 80 ? 'var(--status-ok)'
    : pirsig.kpi_score >= 50 ? 'var(--amber-400)'
    : 'var(--status-error)'
    : undefined;

  /* ── Event icon mapping (SVG icons, no emojis) ── */
  const getEventIcon = (type: string, success?: boolean) => {
    
  const rootId = type['data-testid'] ? `${type['data-testid']}-get-event-icon` : 'get-event-icon';
if (type === 'step_start')               return <IconPlay data-testid={getTestId('icon-play')} size={11} color="var(--accent-ask)" />;
    if (type === 'step_success')             return <IconCheck data-testid={getTestId('icon-check')} size={11} color="var(--status-ok)" />;
    if (type === 'step_retry')               return <IconRepeat data-testid={getTestId('icon-repeat')} size={11} color="var(--amber-400)" />;
    if (type === 'ToolExecutionResult')      return <IconTool data-testid={getTestId('icon-tool')} size={11} color={success ? 'var(--status-ok)' : 'var(--status-error)'} />;
    if (type === 'agent-thinking-stream')    return <IconThought data-testid={getTestId('icon-thought')} size={11} color="var(--text-muted)" />;
    return <IconDot data-testid={getTestId('icon-dot')} size={8} color="var(--text-muted)" />;
  };

  const getEventLabel = (evt: { type: string; payload?: { tool_name?: string; success?: boolean }; step_id?: string }) => {
    if (evt.type === 'step_start')          return 'Step Started';
    if (evt.type === 'step_success')        return 'Step Succeeded';
    if (evt.type === 'step_retry')          return 'Retrying Step';
    if (evt.type === 'ToolExecutionResult') return `Tool: ${evt.payload?.tool_name || 'unknown'}`;
    if (evt.type === 'agent-thinking-stream') return 'Thinking';
    return evt.type;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>

      {/* Project Analysis Progress */}
      {analyseProgress && (
        <Section data-testid={getTestId('section')} title="Project Analysis">
          <AnalyseProgressPanel data-testid={getTestId('analyse-progress-panel')}
            progress={analyseProgress}
            onDismiss={() => dispatch(setAnalyseProgress(null))}
          />
        </Section>
      )}

      {/* Pirsig Quality Audit */}
      <div data-testid="pirsig-widget-root">
        <Section data-testid={getTestId('section-1')} title="Pirsig — Quality Gate">

        {pirsig ? (
          <div
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-md)',
              padding: '12px',
              display: 'flex',
              flexDirection: 'column',
              gap: '0',
            }}
          >
            {/* Top accent line */}
            <div style={{ height: '2px', background: `linear-gradient(90deg, ${kpiColor}, transparent)`, marginBottom: '10px', borderRadius: '1px' }} />

            {/* KPI score — large display */}
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginBottom: '8px' }}>
              <IconShield data-testid={getTestId('icon-shield')} size={13} color={kpiColor} />
              <span style={{ fontSize: '22px', fontWeight: 800, fontFamily: 'var(--mono)', color: kpiColor, letterSpacing: '-0.04em' }}>
                {pirsig.kpi_score.toFixed(1)}
              </span>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>/ 100</span>
            </div>

            <div style={{ height: '1px', background: 'var(--border-subtle)', margin: '4px 0 8px' }} />

            <DataRow data-testid={getTestId('data-row')} label="Symbols Parsed" value={pirsig.symbols_count} />

            {pirsig.qualitative_flags && pirsig.qualitative_flags.length > 0 && (
              <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px solid var(--border-subtle)', display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                {pirsig.qualitative_flags.map((flag, idx) => {
                  const isOk = !flag.toLowerCase().match(/fail|error|warn|bad/);
                  return (
                    <span
                      key={idx}
                      className={isOk ? 'badge badge-green' : 'badge badge-red'}
                      style={{ fontSize: '10px' }}
                    >
                      {isOk ? <IconCheck data-testid={getTestId('icon-check')} size={9} /> : <IconX data-testid={getTestId('icon-x')} size={9} />}
                      {flag}
                    </span>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontStyle: 'italic', padding: '4px 0' }}>
            Awaiting Pirsig AST analysis…
          </div>
        )}
      </Section>
      </div>


      {/* Agent Event Timeline */}
      <Section data-testid={getTestId('section-2')} title="Agent Events">
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {events.length === 0 ? (
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontStyle: 'italic' }}>
              No agent events yet.
            </div>
          ) : (
            <div
              style={{
                position: 'relative',
                paddingLeft: '20px',
                borderLeft: '1px solid var(--border)',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
              }}
            >
              {events.map((evt, idx) => (
                <div key={idx} style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  {/* Timeline dot */}
                  <span
                    style={{
                      position: 'absolute',
                      left: '-25px',
                      top: '2px',
                      background: 'var(--bg-panel)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '16px',
                      height: '16px',
                    }}
                  >
                    {getEventIcon(evt.type, evt.payload?.success)}
                  </span>
                  <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-primary)' }}>
                    {getEventLabel(evt)}
                  </span>
                  {(evt.delta || evt.step_id) && (
                    <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'var(--mono)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {evt.delta || evt.step_id}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </Section>
    </div>
  );
}
