import React from 'react';

export interface ChatInputHeaderProps {
  sessionName?: string;
}

export function ChatInputHeader({ sessionName }: ChatInputHeaderProps) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '0 4px',
        marginBottom: '8px',
      }}
    >
      <span
        style={{
          fontSize: '11px',
          color: 'var(--text-muted)',
          fontFamily: 'var(--mono)',
          opacity: 0.7,
          letterSpacing: '0.05em',
          textTransform: 'uppercase',
        }}
      >
        {sessionName || 'New Session'}
      </span>
    </div>
  );
}
