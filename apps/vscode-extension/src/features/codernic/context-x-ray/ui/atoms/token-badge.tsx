import * as React from 'react';
import type { TokenEstimate } from '../../types/context-x-ray.types';

export interface TokenBadgeProps {
  readonly estimate: TokenEstimate;
}

export function TokenBadge({ estimate }: TokenBadgeProps): React.JSX.Element {
  const getColorForSeverity = (severity: TokenEstimate['severity']): string => {
    switch (severity) {
      case 'low':
        return 'var(--vscode-testing-iconPassed)';
      case 'medium':
        return 'var(--vscode-list-warningForeground)';
      case 'high':
        return 'var(--vscode-editorError-foreground)';
      case 'critical':
        return 'var(--vscode-errorForeground)';
      default:
        return 'var(--vscode-foreground)';
    }
  };

  const style: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '2px 6px',
    borderRadius: '10px',
    fontSize: '11px',
    fontWeight: 'bold',
    backgroundColor: 'var(--vscode-badge-background)',
    color: getColorForSeverity(estimate.severity),
    border: `1px solid ${getColorForSeverity(estimate.severity)}`,
  };

  return (
    <span style={style} title={`${estimate.severity} severity`}>
      {estimate.count.toLocaleString()} tokens
    </span>
  );
}
