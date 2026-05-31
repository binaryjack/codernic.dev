export const FIELD_STYLE: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 4,
  marginBottom: 12,
};

export const LABEL_STYLE: React.CSSProperties = {
  fontSize: '0.8125rem',
  fontWeight: 500,
  color: 'var(--vscode-input-foreground)',
  opacity: 0.75,
};

export const INPUT_STYLE: React.CSSProperties = {
  background: 'var(--vscode-input-background)',
  color: 'var(--vscode-input-foreground)',
  border: '1px solid var(--vscode-input-border, transparent)',
  borderRadius: 2,
  padding: '3px 6px',
  fontSize: 'var(--vscode-font-size)',
  fontFamily: 'var(--vscode-font-family)',
  width: '100%',
  outline: 'none',
};

/** Compact input/select for inline/chat uses — no forced full-width. */
export const INPUT_INLINE_STYLE: React.CSSProperties = {
  background: 'var(--vscode-input-background)',
  color: 'var(--vscode-input-foreground)',
  border: '1px solid var(--vscode-input-border, transparent)',
  borderRadius: 2,
  padding: '2px 6px',
  fontSize: 'var(--vscode-font-size)',
  fontFamily: 'var(--vscode-font-family)',
};
