type Props = {
  label: string;
  /** Optional content rendered on the right side of the header. */
  action?: React.ReactNode;
  children: React.ReactNode;
};

const WRAPPER: React.CSSProperties = {
  marginTop: 16,
  marginBottom: 8,
  borderTop: '1px solid var(--vscode-panel-border)',
  paddingTop: 12,
};

const HEADER: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: 8,
};

const LABEL: React.CSSProperties = {
  fontSize: '0.875rem',
  fontWeight: 500,
  color: 'var(--vscode-input-foreground)',
  opacity: 0.75,
};

export const SectionDivider = ({ label, action, children }: Props) => (
  <div style={WRAPPER}>
    <div style={HEADER}>
      <span style={LABEL}>{label}</span>
      {action}
    </div>
    {children}
  </div>
);
