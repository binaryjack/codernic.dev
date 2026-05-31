import { useEffect, useRef, useState } from 'react';
import type { AnalyseStepStatus } from '../../../../../vscode-extension/src/features/codernic/model/analyse-runner';
import type { AnalyseProgressState, AnalyseStep } from '../../../entities/kernel';
import { Button } from '../../../shared';

const STEP_CONFIG: Record<AnalyseStep, { label: string; icon: string; description: string }> = {
  'tech-identification': {
    label: 'Tech Identification',
    icon: '🔍',
    description: 'Scan config files — detect stack, frameworks, runtimes',
  },
  'convention-mining': {
    label: 'Convention Mining',
    icon: '📐',
    description: 'Extract naming conventions, code style, patterns',
  },
  'agent-generation': {
    label: 'Agent Rules',
    icon: '⚙️',
    description: 'Generate doNot.xml rules + agent system prompt hints',
  },
};

const STEP_ORDER: AnalyseStep[] = ['tech-identification', 'convention-mining', 'agent-generation'];

const STATUS_ICON: Record<AnalyseStepStatus, string> = {
  pending: '◌',
  skipped: '–',
  running: '⟳',
  done: '✓',
  error: '✗',
};

const STATUS_COLOR: Record<AnalyseStepStatus, string> = {
  pending: '#71717a',
  skipped: '#3f3f46',
  running: '#3b82f6',
  done: '#10b981',
  error: '#ef4444',
};

function ElapsedTimer({ startedAt }: { startedAt: number }) {
  const [elapsed, setElapsed] = useState(Date.now() - startedAt);
  useEffect(() => {
    const id = setInterval(() => setElapsed(Date.now() - startedAt), 500);
    return () => clearInterval(id);
  }, [startedAt]);
  const s = Math.floor(elapsed / 1000);
  const m = Math.floor(s / 60);
  return (
    <span>
      {m > 0 ? `${m}m ` : ''}
      {s % 60}s
    </span>
  );
}

interface AnalyseProgressPanelProps {
  progress: AnalyseProgressState;
  onDismiss: () => void;
}

export function AnalyseProgressPanel({ progress, onDismiss }: AnalyseProgressPanelProps) {
  const startedAtRef = useRef(Date.now());
  const endRef = useRef<HTMLDivElement>(null);

  const isDone = progress.currentStep === null;
  const hasError = !!progress.errorMessage;
  const headerColor = hasError ? '#ef4444' : isDone ? '#10b981' : '#3b82f6';

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [progress]);

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
      {/* Header */}
      <div
        style={{
          flexShrink: 0,
          padding: '8px 12px',
          background: '#18181b',
          borderBottom: `1px solid ${headerColor}55`,
          display: 'flex',
          alignItems: 'center',
          gap: 10,
        }}
      >
        <div style={{ width: 4, height: 20, borderRadius: 2, background: headerColor }} />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-h)' }}>🔬 Codebase Analysis</div>
          <div style={{ fontSize: '10px', color: '#a1a1aa', opacity: 0.8, marginTop: 1 }}>
            {progress.profile ? `Profile: ${progress.profile}` : 'standard'} · Cost: ${progress.totalCostUSD.toFixed(4)}
          </div>
        </div>
        <div style={{ fontSize: '10px', color: '#a1a1aa', fontFamily: 'var(--mono)', marginRight: '6px' }}>
          {isDone ? (
            hasError ? (
              <span style={{ color: '#ef4444' }}>✗ ERROR</span>
            ) : (
              <span style={{ color: '#10b981' }}>✓ DONE</span>
            )
          ) : (
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              ⟳ <ElapsedTimer startedAt={startedAtRef.current} />
            </span>
          )}
        </div>
        {isDone && (
          <Button onClick={onDismiss} variant="secondary" size="xs">
            Dismiss
          </Button>
        )}
      </div>

      {/* Step list */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '10px 12px',
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
        }}
      >
        {STEP_ORDER.map((stepId) => {
          const cfg = STEP_CONFIG[stepId];
          const status = progress.steps[stepId] ?? 'pending';
          const color = STATUS_COLOR[status];
          const isRunning = status === 'running';

          return (
            <div
              key={stepId}
              style={{
                padding: '8px 10px',
                borderRadius: '6px',
                background: isRunning ? `${color}0d` : '#09090b',
                border: `1px solid ${isRunning ? color : 'var(--border, #27272a)'}`,
                display: 'flex',
                alignItems: 'flex-start',
                gap: 10,
                transition: 'all 0.2s ease',
              }}
            >
              {/* Status icon */}
              <div
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: '50%',
                  background: `${color}1a`,
                  border: `1px solid ${color}4d`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '11px',
                  fontFamily: 'var(--mono)',
                  color: color,
                  flexShrink: 0,
                  animation: isRunning ? 'spin 1.5s linear infinite' : 'none',
                }}
              >
                {STATUS_ICON[status]}
              </div>

              {/* Step info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '11px', fontWeight: 600, color: color }}>
                  {cfg.icon} {cfg.label}
                </div>
                <div style={{ fontSize: '10px', color: '#71717a', marginTop: 2 }}>
                  {cfg.description}
                </div>
                {status === 'skipped' && (
                  <div
                    style={{ fontSize: '9px', color: '#71717a', marginTop: 2, fontFamily: 'var(--mono)' }}
                  >
                    Skipped by profile (no changes detected)
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* Error message */}
        {hasError && (
          <div
            style={{
              padding: '8px 10px',
              borderRadius: '6px',
              background: 'rgba(239, 68, 68, 0.08)',
              border: '1px solid rgba(239, 68, 68, 0.25)',
              fontSize: '11px',
              color: '#f87171',
            }}
          >
            ✗ {progress.errorMessage}
          </div>
        )}

        {/* Done state summary */}
        {isDone && !hasError && (
          <div
            style={{
              padding: '8px 10px',
              borderRadius: '6px',
              background: 'rgba(16, 185, 129, 0.08)',
              border: '1px solid rgba(16, 185, 129, 0.25)',
              fontSize: '11px',
              color: '#34d399',
            }}
          >
            <div>✅ Intelligence artifacts stored in <code>.agencee/config/intelligence/</code></div>
            <div style={{ fontSize: '10px', color: '#71717a', marginTop: 4 }}>
              Total cost: ${progress.totalCostUSD.toFixed(4)} · Switch to Ask or Agent mode to consume.
            </div>
          </div>
        )}

        <div ref={endRef} />
      </div>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
