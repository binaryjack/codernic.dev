import * as React from 'react';
import type { ContextNode } from '../../types/context-x-ray.types';
import { TokenBadge } from '../atoms/token-badge';

export interface ContextNodeRowProps {
  readonly node: ContextNode;
  readonly onRemove?: (id: string) => void;
}

export function ContextNodeRow({ node, onRemove }: ContextNodeRowProps): React.JSX.Element {
  const containerStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '4px 8px',
    borderBottom: '1px solid var(--vscode-panel-border)',
    fontSize: '12px',
  };

  const detailStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  };

  const removeButtonStyle: React.CSSProperties = {
    background: 'none',
    border: 'none',
    color: 'var(--vscode-textLink-foreground)',
    cursor: 'pointer',
    fontSize: '12px',
  };

  return (
    <div style={containerStyle}>
      <div style={detailStyle}>
        <strong style={{ color: 'var(--vscode-symbolIcon-fileForeground)' }}>{node.uri}</strong>
        <span style={{ color: 'var(--vscode-descriptionForeground)', fontSize: '11px' }}>
          {node.type} • {node.inclusionReason}
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <TokenBadge estimate={node.tokenEstimate} />
        {onRemove && (
          <button
            onClick={() => onRemove(node.id)}
            style={removeButtonStyle}
            title="Evict from context"
          >
            ✕
          </button>
        )}
      </div>
    </div>
  );
}
