import type { DiagnosticInfo } from '../../../../entities/kernel/model/types';

interface DiagnosticCardProps {
  diagnostic: DiagnosticInfo;
  'data-testid'?: string;
}

export function DiagnosticCard({ diagnostic, 'data-testid': dataTestId }: DiagnosticCardProps) {
  return (
    <div
      data-testid={dataTestId || "diagnostic-card"}
      data-demo-desc="[CODER] Automated Pirsig architectural compliance checks flag anomalies in real-time."
      className="diagnostic-card"
      style={{
        marginTop: '8px',
        padding: '6px 12px',
        background: 'transparent',
        borderLeft: '2px solid rgba(239, 68, 68, 0.5)',
        display: 'flex',
        flexDirection: 'column',
        gap: '4px',
      }}
    >
      <div
        style={{
          fontWeight: 700,
          fontSize: '11px',
          color: '#f87171',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
        }}
      >
        <span>[WARNING]</span>
        <span>{diagnostic.title}</span>
        <span style={{ fontFamily: 'var(--mono)', fontSize: '9px', opacity: 0.5 }}>({diagnostic.code})</span>
      </div>
      <div style={{ fontSize: '11px', color: '#e4e4e7', opacity: 0.9 }}>
        {diagnostic.message}
      </div>
      <div
        style={{
          marginTop: '6px',
          fontSize: '11px',
          padding: '6px 10px',
          background: 'transparent',
          borderLeft: '2px solid rgba(245, 158, 11, 0.5)',
          fontFamily: 'var(--mono)',
        }}
      >
        <div style={{ fontWeight: 700, fontSize: '9px', textTransform: 'uppercase', color: '#71717a', marginBottom: '2px' }}>
          Suggested Fix
        </div>
        <div style={{ color: '#fbbf24', whiteSpace: 'pre-wrap' }}>{diagnostic.fix_suggestion}</div>
      </div>
    </div>
  );
}
