import type { ContextStats, InfraStats, InferenceMetrics } from '../../../entities/kernel';

interface InfraHudProps {
  infra: InfraStats | null;
  context: ContextStats | null;
  metrics?: InferenceMetrics | null;
}

import { useEffect } from 'react';

export function InfraHud({ infra, context, metrics }: InfraHudProps) {
  useEffect(() => {
    const interval = setInterval(() => {
      fetch('http://localhost:11434/metrics')
        .then(res => res.json())
        .then(data => {
          // Normally we'd dispatch this to redux, but for now we just poll silently
          console.log('Polled metrics:', data);
        })
        .catch(err => console.debug('Metrics endpoint not ready:', err));
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  if (!infra && !context && !metrics) return null;

  const vramPercent = infra ? (infra.vram_used / infra.vram_total) * 100 : 0;
  const isVramHigh = vramPercent > 85;
  const isCtxHigh = context ? context.usage_percent > 80 : false;

  const getBarColor = (high: boolean, type: 'vram' | 'ctx') => {
    if (high) return 'var(--accent-agent, #ef4444)';
    return type === 'vram' ? 'var(--accent-ask, #3b82f6)' : 'var(--accent-analyse, #06b6d4)';
  };

  return (
    <div
      style={{
        padding: '8px 12px',
        background: '#131316',
        borderBottom: '1px solid var(--border, #27272a)',
        display: 'flex',
        flexDirection: 'column',
        gap: '6px',
        fontSize: '10px',
        fontFamily: 'var(--sans)',
        userSelect: 'none',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px' }}>
        {/* VRAM SECTION */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '3px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#a1a1aa', fontWeight: 600 }}>
            <span style={{ fontSize: '9px', letterSpacing: '0.05em' }}>🧠 GPU VRAM</span>
            <span style={{ color: isVramHigh ? '#ef4444' : '#e4e4e7', fontFamily: 'var(--mono)' }}>
              {infra ? `${infra.vram_used.toFixed(1)} / ${infra.vram_total.toFixed(1)} GB` : 'N/A'}
            </span>
          </div>
          <div style={{ height: '4px', background: '#27272a', borderRadius: '2px', overflow: 'hidden' }}>
            <div
              style={{
                height: '100%',
                width: `${vramPercent}%`,
                background: getBarColor(isVramHigh, 'vram'),
                boxShadow: `0 0 6px ${getBarColor(isVramHigh, 'vram')}cc`,
                transition: 'width 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
              }}
            />
          </div>
        </div>

        {/* CONTEXT SECTION */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '3px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#a1a1aa', fontWeight: 600 }}>
            <span style={{ fontSize: '9px', letterSpacing: '0.05em' }}>⚡ CONTEXT BUFFER</span>
            <span style={{ color: isCtxHigh ? '#f59e0b' : '#e4e4e7', fontFamily: 'var(--mono)' }}>
              {context
                ? `${(context.current_tokens / 1000).toFixed(1)}k / ${(context.max_tokens / 1000).toFixed(1)}k`
                : 'N/A'}
            </span>
          </div>
          <div style={{ height: '4px', background: '#27272a', borderRadius: '2px', overflow: 'hidden' }}>
            <div
              style={{
                height: '100%',
                width: `${context ? context.usage_percent : 0}%`,
                background: getBarColor(isCtxHigh, 'ctx'),
                boxShadow: `0 0 6px ${getBarColor(isCtxHigh, 'ctx')}cc`,
                transition: 'width 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
              }}
            />
          </div>
        </div>
      </div>

      {/* METRICS SECTION */}
      {metrics && (
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px', marginTop: '4px' }}>
          <div style={{ flex: 1, display: 'flex', justifyContent: 'space-between', color: '#a1a1aa', fontWeight: 600 }}>
            <span style={{ fontSize: '9px', letterSpacing: '0.05em' }}>⏱️ TTFT</span>
            <span style={{ color: '#10b981', fontFamily: 'var(--mono)' }}>
              {metrics.ttft_ms} ms
            </span>
          </div>
          <div style={{ flex: 1, display: 'flex', justifyContent: 'space-between', color: '#a1a1aa', fontWeight: 600 }}>
            <span style={{ fontSize: '9px', letterSpacing: '0.05em' }}>🚀 SPEED</span>
            <span style={{ color: '#8b5cf6', fontFamily: 'var(--mono)' }}>
              {metrics.tokens_per_second.toFixed(1)} t/s
            </span>
          </div>
        </div>
      )}

      {infra && infra.vram_available < 1.0 && (
        <div
          style={{
            color: '#ef4444',
            fontSize: '9px',
            fontWeight: 700,
            textAlign: 'center',
            letterSpacing: '0.05em',
            animation: 'pulse 2s infinite',
            marginTop: '2px',
          }}
        >
          ⚠️ VRAM CRITICALLY LOW: Amnesia/Context Overflow Hazard Detected
        </div>
      )}
    </div>
  );
}
