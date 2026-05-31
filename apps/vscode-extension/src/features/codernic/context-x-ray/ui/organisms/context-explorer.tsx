import * as React from 'react';
import type { ContextGraph } from '../../types/context-x-ray.types';
import { ContextNodeRow } from '../molecules/context-node-row';

export interface ContextExplorerProps {
  readonly graph: ContextGraph;
  readonly onRemoveNode?: (id: string) => void;
  readonly onClearContext?: () => void;
}

export function ContextExplorer({
  graph,
  onRemoveNode,
  onClearContext,
}: ContextExplorerProps): React.JSX.Element {
  const containerStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    width: '100%',
    fontFamily: 'var(--vscode-font-family)',
    border: '1px solid var(--vscode-panel-border)',
    borderRadius: '4px',
    backgroundColor: 'var(--vscode-sideBar-background)',
    overflow: 'hidden',
  };

  const headerStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '8px 12px',
    borderBottom: '1px solid var(--vscode-panel-border)',
    backgroundColor: 'var(--vscode-sideBarSectionHeader-background)',
    fontWeight: 'bold',
    fontSize: '12px',
  };

  const actionLinkStyle: React.CSSProperties = {
    color: 'var(--vscode-textLink-foreground)',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontSize: '11px',
    textDecoration: 'underline',
  };

  const getCapacityColor = (status: ContextGraph['capacityStatus']): string => {
    switch (status) {
      case 'exceeded':
        return 'var(--vscode-errorForeground)';
      case 'warning':
        return 'var(--vscode-list-warningForeground)';
      default:
        return 'var(--vscode-testing-iconPassed)';
    }
  };

  return (
    <div style={containerStyle}>
      <header style={headerStyle}>
        <span>🏷️ Expected Context: {graph.totalTokens.toLocaleString()} tokens</span>
        <span style={{ color: getCapacityColor(graph.capacityStatus) }}>
          Status: {graph.capacityStatus.toUpperCase()}
        </span>
        {onClearContext && graph.nodes.length > 0 && (
          <button style={actionLinkStyle} onClick={onClearContext}>
            Clear All
          </button>
        )}
      </header>

      <div style={{ overflowY: 'auto', maxHeight: '300px' }}>
        {graph.nodes.length === 0 ? (
          <div
            style={{
              padding: '16px',
              textAlign: 'center',
              color: 'var(--vscode-descriptionForeground)',
              fontSize: '11px',
            }}
          >
            No context loaded. Agent has a blank slate.
          </div>
        ) : (
          graph.nodes.map((node) => (
            <ContextNodeRow key={node.id} node={node} onRemove={onRemoveNode} />
          ))
        )}
      </div>
    </div>
  );
}
