import * as React from 'react';
import type { RunState, ExecutionResult } from '../../types/focused-run.types';

export interface ExecutePanelProps {
  readonly state: RunState;
  readonly command: string;
  readonly result: ExecutionResult | null;
  readonly onTeardown?: () => void;
}

export function ExecutePanel({
  state,
  command,
  result,
  onTeardown,
}: ExecutePanelProps): React.JSX.Element {
  const containerStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    fontFamily: 'var(--vscode-editor-font-family, Consolas, monospace)',
    backgroundColor: 'var(--vscode-editor-background)',
    color: 'var(--vscode-editor-foreground)',
    border: '1px solid var(--vscode-panel-border)',
    borderRadius: '4px',
    overflow: 'hidden',
  };

  const headerStyle: React.CSSProperties = {
    padding: '6px 12px',
    backgroundColor: 'var(--vscode-panel-background)',
    borderBottom: '1px solid var(--vscode-panel-border)',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontSize: '12px',
  };

  const outputStyle: React.CSSProperties = {
    padding: '8px',
    fontSize: '11px',
    whiteSpace: 'pre-wrap',
    maxHeight: '200px',
    overflowY: 'auto',
  };

  const getStatusColor = (s: RunState): string => {
    switch (s) {
      case 'running':
        return 'var(--vscode-charts-blue)';
      case 'completed':
        return 'var(--vscode-testing-iconPassed)';
      case 'failed':
        return 'var(--vscode-testing-iconFailed)';
      default:
        return 'var(--vscode-descriptionForeground)';
    }
  };

  return (
    <div style={containerStyle}>
      <header style={headerStyle}>
        <div>
          <span style={{ fontWeight: 'bold' }}>$ {command}</span>
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <span
            style={{
              color: getStatusColor(state),
              fontWeight: 'bold',
              textTransform: 'uppercase',
              fontSize: '10px',
            }}
          >
            {state}
          </span>
          {onTeardown && state !== 'unmounted' && state !== 'running' && (
            <button
              onClick={onTeardown}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--vscode-textLink-foreground)',
                cursor: 'pointer',
                fontSize: '11px',
              }}
            >
              Teardown Buffer
            </button>
          )}
        </div>
      </header>

      {result && (
        <div style={outputStyle}>
          {result.stdout && <div>{result.stdout}</div>}
          {result.stderr && (
            <div style={{ color: 'var(--vscode-errorForeground)' }}>{result.stderr}</div>
          )}
          <div
            style={{
              marginTop: '8px',
              color: 'var(--vscode-descriptionForeground)',
              fontSize: '10px',
            }}
          >
            Exit code: {result.exitCode} • {result.durationMs}ms
          </div>
        </div>
      )}
    </div>
  );
}
