type Props = {
  label: string;
  /** Optional content rendered inside the summary bar, aligned right. */
  actions?: React.ReactNode;
  children: React.ReactNode;
};

const DETAILS: React.CSSProperties = {
  marginBottom: 10,
  border: '1px solid var(--vscode-panel-border)',
  borderRadius: 3,
};

const SUMMARY: React.CSSProperties = {
  padding: '6px 8px',
  cursor: 'pointer',
  userSelect: 'none',
  fontWeight: 500,
  fontSize: '0.85rem',
  listStyle: 'none',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
};

export const Accordion = ({ label, actions, children }: Props) => (
  <details style={DETAILS}>
    <summary style={SUMMARY}>
      <span>{label}</span>
      {actions}
    </summary>
    {children}
  </details>
);
