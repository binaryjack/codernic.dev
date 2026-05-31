import { useEffect, useState } from 'react';
import type { ThinkingState, ThinkingPhase } from '../../../entities/kernel';

const PHASE_META: Record<ThinkingPhase, { label: string; color: string; icon: string }> = {
  thinking: { label: 'Thinking', color: '#a78bfa', icon: '◦' },
  reasoning: { label: 'Reasoning', color: '#818cf8', icon: '◈' },
  considering: { label: 'Considering', color: '#6366f1', icon: '◎' },
  reading: { label: 'Reading', color: '#22d3ee', icon: '▹' },
  searching: { label: 'Searching', color: '#34d399', icon: '⊹' },
  reflecting: { label: 'Reflecting', color: '#f472b6', icon: '◌' },
  planning: { label: 'Planning', color: '#fb923c', icon: '◈' },
  writing: { label: 'Writing', color: '#ef4444', icon: '✎' },
  executing: { label: 'Executing', color: '#eab308', icon: '⚡' },
  loading: { label: 'Loading Model', color: '#94a3b8', icon: '⌛' },
  idle: { label: '', color: 'transparent', icon: '' },
};

interface ThinkingIndicatorProps {
  state: ThinkingState;
}

export function ThinkingIndicator({ state }: ThinkingIndicatorProps) {
  const [dots, setDots] = useState('');

  useEffect(() => {
    if (state.phase === 'idle') {
      setDots('');
      return;
    }
    const id = setInterval(() => setDots((d) => (d.length >= 3 ? '' : d + '.')), 400);
    return () => clearInterval(id);
  }, [state.phase]);

  if (state.phase === 'idle') return null;

  const meta = PHASE_META[state.phase];

  return (
    <div
      style={{
        padding: '8px 12px',
        borderRadius: '6px',
        background: 'rgba(99, 102, 241, 0.04)',
        border: '1px solid rgba(99, 102, 241, 0.15)',
        display: 'flex',
        flexDirection: 'column',
        gap: 3,
        margin: '6px 0',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ color: meta.color, fontSize: '11px', lineHeight: 1 }}>{meta.icon}</span>
        <span
          style={{
            color: meta.color,
            fontSize: '10px',
            fontWeight: 700,
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
            fontFamily: 'var(--mono)',
          }}
        >
          {meta.label}
          {dots}
        </span>
      </div>
      {state.detail && (
        <div
          style={{
            fontSize: '10px',
            color: '#71717a',
            paddingLeft: 14,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            maxWidth: '100%',
          }}
        >
          {state.detail}
        </div>
      )}
    </div>
  );
}
