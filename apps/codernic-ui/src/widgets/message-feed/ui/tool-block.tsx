import type { ToolCall } from '../../../entities/kernel';

interface ToolBlockProps {
  tool: ToolCall;
}

export function ToolBlock({ tool }: ToolBlockProps) {
  const isRunning = tool.status === 'running';
  const isSuccess = tool.status === 'success';

  return (
    <div
      style={{
        margin: '8px 0',
        borderRadius: '6px',
        border: isSuccess
          ? '1px solid rgba(16, 185, 129, 0.3)'
          : isRunning
          ? '1px solid rgba(59, 130, 246, 0.3)'
          : '1px solid rgba(239, 68, 68, 0.3)',
        background: isSuccess
          ? 'rgba(16, 185, 129, 0.04)'
          : isRunning
          ? 'rgba(59, 130, 246, 0.04)'
          : 'rgba(239, 68, 68, 0.04)',
        overflow: 'hidden',
        boxShadow: 'var(--shadow)',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '6px 10px',
          fontSize: '11px',
          fontFamily: 'var(--mono)',
        }}
      >
        {isRunning ? (
          <span style={{ color: '#3b82f6', animation: 'spin 1s linear infinite', display: 'inline-block' }}>⚙️</span>
        ) : isSuccess ? (
          <span style={{ color: '#10b981', fontWeight: 'bold' }}>✓</span>
        ) : (
          <span style={{ color: '#ef4444', fontWeight: 'bold' }}>✗</span>
        )}
        <span style={{ fontWeight: 600, color: 'var(--text-h)' }}>{tool.name}</span>
      </div>

      {!isRunning && (
        <details style={{ borderTop: '1px solid var(--border, #27272a)' }}>
          <summary
            style={{
              padding: '4px 10px',
              fontSize: '9px',
              color: '#71717a',
              cursor: 'pointer',
              userSelect: 'none',
              fontFamily: 'var(--sans)',
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.color = '#e4e4e7';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.color = '#71717a';
            }}
          >
            Inspect Payload & Result
          </summary>
          <div
            style={{
              padding: '10px',
              fontSize: '10px',
              fontFamily: 'var(--mono)',
              background: '#09090b',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
            }}
          >
            <div style={{ color: '#71717a', textTransform: 'uppercase', fontSize: '9px', fontWeight: 600 }}>Arguments</div>
            <pre style={{ margin: 0, color: '#93c5fd', whiteSpace: 'pre-wrap', overflowX: 'auto' }}>
              {JSON.stringify(tool.args, null, 2)}
            </pre>
            {tool.result && (
              <>
                <div style={{ color: '#71717a', textTransform: 'uppercase', fontSize: '9px', fontWeight: 600, marginTop: '4px' }}>
                  Result
                </div>
                <pre style={{ margin: 0, color: '#e4e4e7', whiteSpace: 'pre-wrap', overflowX: 'auto' }}>
                  {tool.result}
                </pre>
              </>
            )}
          </div>
        </details>
      )}
    </div>
  );
}
