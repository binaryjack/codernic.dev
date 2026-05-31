import type { DiagnosticInfo } from '../../../entities/kernel';

interface DiagnosticCardProps {
  diagnostic: DiagnosticInfo;
}

export function DiagnosticCard({ diagnostic }: DiagnosticCardProps) {
  return (
    <div
      className="diagnostic-card"
      style={{
        marginTop: '8px',
        padding: '10px 12px',
        borderRadius: '6px',
        background: 'rgba(239, 68, 68, 0.05)',
        border: '1px solid rgba(239, 68, 68, 0.2)',
        display: 'flex',
        flexDirection: 'column',
        gap: '4px',
        boxShadow: 'var(--shadow)',
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
        <span>⚠️</span>
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
          padding: '8px 10px',
          background: '#09090b',
          borderRadius: '4px',
          borderLeft: '2px solid #f59e0b',
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
