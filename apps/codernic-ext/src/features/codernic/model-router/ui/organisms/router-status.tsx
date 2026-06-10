import * as React from 'react';
import type { RoutingDecision } from '../../types/model-router.types';

export interface RouterStatusProps {
  readonly route: RoutingDecision | null;
}

export function RouterStatus({ route }: RouterStatusProps): React.JSX.Element | null {
  if (!route) return null;

  const containerStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    padding: '8px',
    backgroundColor: 'var(--vscode-editorActionList-background)',
    border: '1px solid var(--vscode-editorGroup-border)',
    borderRadius: '4px',
    fontSize: '12px',
    fontFamily: 'var(--vscode-font-family)',
  };

  const headerStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '4px',
  };

  const tierColors: Record<string, string> = {
    fast: 'var(--vscode-charts-green)',
    balanced: 'var(--vscode-charts-blue)',
    reasoning: 'var(--vscode-charts-purple)',
  };

  const styleTier = {
    color: tierColors[route.selectedTier] || 'var(--vscode-foreground)',
    fontWeight: 'bold',
    textTransform: 'uppercase' as const,
    fontSize: '10px',
  };

  return (
    <div style={containerStyle} title={route.explanation}>
      <div style={headerStyle}>
        <span style={{ fontWeight: 'bold' }}>Model Route: {route.selectedModelId}</span>
        <span style={styleTier}>{route.selectedTier} Tier</span>
      </div>
      <div style={{ color: 'var(--vscode-descriptionForeground)', fontSize: '11px' }}>
        {route.explanation}
      </div>
    </div>
  );
}
