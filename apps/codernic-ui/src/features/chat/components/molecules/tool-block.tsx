import type { ToolCall } from '../../../../entities/kernel/model/types';

interface ToolBlockProps {
  tool: ToolCall;
  'data-testid'?: string;
}

export function ToolBlock({ tool, 'data-testid': dataTestId }: ToolBlockProps) {
  const isRunning = tool.status === 'running';
  const isSuccess = tool.status === 'success';

  return (
    <div
      className="tool-block-container"
      data-testid={dataTestId || "chat-message-tool"}
      data-demo-desc="[CODER] Detailed trace logs for background tool executions (e.g. web search, file reads)."
      style={{
        margin: '6px 0',
        borderLeft: '2px solid #3f3f46',
        background: 'transparent',
        paddingLeft: '10px',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          padding: '2px 0 6px 0',
          fontSize: '11px',
          fontFamily: 'var(--mono)',
          opacity: 0.8,
        }}
      >
        {isRunning ? (
          <span style={{ color: '#3b82f6', animation: 'pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite', display: 'inline-block' }}>[RUNNING]</span>
        ) : isSuccess ? (
          <span style={{ color: '#10b981', fontWeight: 'bold' }}>[SUCCESS]</span>
        ) : (
          <span style={{ color: '#ef4444', fontWeight: 'bold' }}>[FAILED]</span>
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
              padding: '6px 0',
              fontSize: '10px',
              fontFamily: 'var(--mono)',
              background: 'transparent',
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
