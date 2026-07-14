import { useEffect, useState } from 'react';
import type { ThinkingState } from '../../../../entities/kernel/model/types';
import type { ThinkingPhase } from '../../../../entities/kernel/model/types';

const PHASE_META: Record<ThinkingPhase, { label: string; color: string; icon: string }> = {
  thinking: { label: 'Thinking', color: '#a78bfa', icon: '◦' },
  reasoning: { label: 'Reasoning', color: '#818cf8', icon: '◈' },
  considering: { label: 'Considering', color: '#6366f1', icon: '◎' },
  reading: { label: 'Reading', color: '#22d3ee', icon: '▹' },
  searching: { label: 'Searching', color: '#34d399', icon: '⊹' },
  reflecting: { label: 'Reflecting', color: '#f472b6', icon: '◌' },
  planning: { label: 'Planning', color: '#fb923c', icon: '◈' },
  writing: { label: 'Writing', color: '#ef4444', icon: '✎' },
  executing: { label: 'Executing', color: '#eab308', icon: '⭮' },
  loading: { label: 'Loading Model', color: '#94a3b8', icon: '⧖' },
  idle: { label: '', color: 'transparent', icon: '' },
};

interface ThinkingIndicatorProps {
  state: ThinkingState;
  sessionId?: string;
  'data-testid'?: string;
}

export function ThinkingIndicator({ state, sessionId, 'data-testid': testId }: ThinkingIndicatorProps) {
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
      data-testid={testId}
      data-demo-desc="[CODER] Real-time activity indicator visible while the engine compiles or reasons."
      onClick={() => {
        // We dispatch as a plain action type to avoid importing the slice here and creating circular deps
        const targetId = sessionId ? `intro-${sessionId}` : `intro-default`;
        window.dispatchEvent(new CustomEvent('codernic:activate-introspection', { detail: targetId }));
      }}
      className="transition-colors hover:bg-[var(--vscode-list-hoverBackground)]"
      style={{
        padding: '6px 8px',
        borderRadius: '4px',
        background: 'var(--vscode-editor-background, #1e1e1e)',
        border: '1px solid var(--vscode-widget-border, #3f3f46)',
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        gap: 3,
        margin: '6px 0',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ color: 'var(--vscode-descriptionForeground)', fontSize: '11px', lineHeight: 1 }}>{meta.icon}</span>
        <span
          style={{
            color: 'var(--vscode-descriptionForeground)',
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
