import * as React from 'react';
import type { ContextWindowUI } from '../../../../../shared/types/ai-agencee-types';

export interface ContextWindowPopupProps {
  readonly contextUI: ContextWindowUI;
  readonly isVisible: boolean;
  readonly position?: 'top' | 'bottom';
}

export function ContextWindowPopup({
  contextUI,
  isVisible,
  position = 'top',
}: ContextWindowPopupProps): React.JSX.Element {
  if (!isVisible) return <></>;

  const getSeverityIcon = (): string => {
    if (contextUI.usagePercent >= 95) return '⚠️ CRITICAL';
    if (contextUI.usagePercent >= 85) return '⚠️ WARNING';
    if (contextUI.usagePercent >= 50) return 'ℹ️ MODERATE';
    return '✓ HEALTHY';
  };

  const getStatusColor = (): string => {
    if (contextUI.usagePercent >= 95) return 'var(--vscode-errorForeground)';
    if (contextUI.usagePercent >= 85) return 'var(--vscode-list-warningForeground)';
    if (contextUI.usagePercent >= 50) return 'var(--vscode-descriptionForeground)';
    return 'var(--vscode-testing-iconPassed)';
  };

  const containerStyle: React.CSSProperties = {
    position: 'absolute',
    [position === 'top' ? 'bottom' : 'top']: '100%',
    [position === 'top' ? 'marginBottom' : 'marginTop']: '8px',
    left: '50%',
    transform: 'translateX(-50%)',
    backgroundColor: 'var(--vscode-editor-background)',
    border: `1px solid var(--vscode-editor-lineHighlightBorder)`,
    borderRadius: '4px',
    padding: '12px',
    minWidth: '320px',
    maxWidth: '420px',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.4)',
    zIndex: 1000,
    fontSize: '11px',
    lineHeight: '1.5',
    color: 'var(--vscode-foreground)',
  };

  const headerStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '10px',
    paddingBottom: '8px',
    borderBottom: `1px solid var(--vscode-editor-lineHighlightBorder)`,
  };

  const titleStyle: React.CSSProperties = {
    fontWeight: 'bold',
    color: getStatusColor(),
  };

  const metricsGridStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '12px',
    marginBottom: '12px',
  };

  const metricItemStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  };

  const metricLabelStyle: React.CSSProperties = {
    fontSize: '10px',
    color: 'var(--vscode-descriptionForeground)',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  };

  const metricValueStyle: React.CSSProperties = {
    fontSize: '12px',
    fontWeight: 'bold',
    color: 'var(--vscode-foreground)',
    fontFamily: 'monospace',
  };

  const recommendationsStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    marginTop: '12px',
    paddingTop: '8px',
    borderTop: `1px solid var(--vscode-editor-lineHighlightBorder)`,
  };

  const recommendationItemStyle: React.CSSProperties = {
    display: 'flex',
    gap: '6px',
    fontSize: '10px',
    color: 'var(--vscode-descriptionForeground)',
  };

  return (
    <div style={containerStyle}>
      {/* Header */}
      <div style={headerStyle}>
        <span style={titleStyle}>{getSeverityIcon()}</span>
        <span style={{ fontSize: '10px', color: 'var(--vscode-descriptionForeground)' }}>
          Token Usage
        </span>
      </div>

      {/* Metrics Grid */}
      <div style={metricsGridStyle}>
        <div style={metricItemStyle}>
          <span style={metricLabelStyle}>Current</span>
          <span style={metricValueStyle}>{contextUI.currentTokens.toLocaleString()}</span>
        </div>
        <div style={metricItemStyle}>
          <span style={metricLabelStyle}>Maximum</span>
          <span style={metricValueStyle}>{contextUI.maxTokens.toLocaleString()}</span>
        </div>
        <div style={metricItemStyle}>
          <span style={metricLabelStyle}>Usage %</span>
          <span style={{ ...metricValueStyle, color: getStatusColor() }}>
            {Math.round(contextUI.usagePercent)}%
          </span>
        </div>
        <div style={metricItemStyle}>
          <span style={metricLabelStyle}>Turns</span>
          <span style={metricValueStyle}>{contextUI.turnCount}</span>
        </div>
      </div>

      {/* Optimization Stats */}
      {contextUI.turnCount !== undefined && contextUI.optimizedTurnCount < contextUI.turnCount && (
        <div
          style={{
            padding: '8px',
            backgroundColor: 'rgba(88, 166, 255, 0.1)',
            borderRadius: '3px',
            marginBottom: '8px',
          }}
        >
          <div style={{ fontSize: '10px', marginBottom: '4px' }}>
            <strong>Optimization:</strong>
          </div>
          <div style={{ fontSize: '10px', color: 'var(--vscode-descriptionForeground)' }}>
            Kept {contextUI.optimizedTurnCount} turns, removed {contextUI.removedTurnsCount} (ratio:{' '}
            {contextUI.compressionRatio.toFixed(2)}x)
          </div>
        </div>
      )}

      {/* Status Message */}
      <div
        style={{
          padding: '8px',
          backgroundColor: contextUI.atCapacity
            ? 'rgba(244, 89, 80, 0.1)'
            : 'rgba(88, 166, 255, 0.1)',
          borderRadius: '3px',
          marginBottom: '8px',
          fontSize: '10px',
          color: contextUI.atCapacity
            ? 'var(--vscode-errorForeground)'
            : 'var(--vscode-foreground)',
        }}
      >
        {contextUI.statusMessage}
      </div>

      {/* Recommendations */}
      {contextUI.recommendations.length > 0 && (
        <div style={recommendationsStyle}>
          <div style={{ fontSize: '10px', fontWeight: 'bold', color: 'var(--vscode-foreground)' }}>
            💡 Recommendations:
          </div>
          {contextUI.recommendations.map((rec: string, idx: number) => (
            <div key={idx} style={recommendationItemStyle}>
              <span>•</span>
              <span>{rec}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
