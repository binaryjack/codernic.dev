import * as React from 'react';
import { useCallback, useEffect, useState } from 'react';
import type { ContextWindowUI } from '../../../../../shared/types/ai-agencee-types';
import { CircularProgress } from '../atoms/circular-progress.js';
import { ContextWindowPopup } from '../molecules/context-window-popup.js';

export interface ContextWindowWidgetProps {
  readonly contextUI: ContextWindowUI | null;
  readonly size?: number;
  readonly showLabel?: boolean;
  readonly popupPosition?: 'top' | 'bottom';
  readonly onContextWarning?: (severity: 'warning' | 'critical') => void;
}

export function ContextWindowWidget({
  contextUI,
  size = 60,
  showLabel = true,
  popupPosition = 'top',
  onContextWarning,
}: ContextWindowWidgetProps): React.JSX.Element {
  const [isPopupVisible, setIsPopupVisible] = useState(false);
  const [hasWarned, setHasWarned] = useState<'none' | 'warning' | 'critical'>('none');

  useEffect(() => {
    if (!contextUI || !onContextWarning) return;

    if (contextUI.usagePercent >= 95 && hasWarned !== 'critical') {
      onContextWarning('critical');
      setHasWarned('critical');
    } else if (
      contextUI.usagePercent >= 85 &&
      contextUI.usagePercent < 95 &&
      hasWarned === 'none'
    ) {
      onContextWarning('warning');
      setHasWarned('warning');
    } else if (contextUI.usagePercent < 85 && hasWarned !== 'none') {
      setHasWarned('none');
    }
  }, [contextUI, onContextWarning, hasWarned]);

  const handleMouseEnter = useCallback(() => {
    setIsPopupVisible(true);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setIsPopupVisible(false);
  }, []);

  if (!contextUI) {
    return (
      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          padding: '4px 8px',
          borderRadius: '4px',
          backgroundColor: 'var(--vscode-badge-background)',
          color: 'var(--vscode-descriptionForeground)',
          fontSize: '11px',
        }}
      >
        ⟳ Loading context...
      </div>
    );
  }

  const isCritical = contextUI.usagePercent >= 95;
  const isWarning = contextUI.usagePercent >= 85;

  const containerStyle: React.CSSProperties = {
    position: 'relative',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '12px',
    padding: '8px',
    borderRadius: '6px',
    backgroundColor: isCritical
      ? 'rgba(244, 89, 80, 0.08)'
      : isWarning
        ? 'rgba(206, 167, 53, 0.08)'
        : 'transparent',
    border: isCritical
      ? '1px solid rgba(244, 89, 80, 0.3)'
      : isWarning
        ? '1px solid rgba(206, 167, 53, 0.3)'
        : 'none',
    cursor: 'pointer',
    transition: 'background-color 0.2s ease, border-color 0.2s ease',
  };

  const infoStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  };

  const labelStyle: React.CSSProperties = {
    fontSize: '10px',
    color: 'var(--vscode-descriptionForeground)',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  };

  const usageStyle: React.CSSProperties = {
    fontSize: '12px',
    fontWeight: 'bold',
    color: isCritical
      ? 'var(--vscode-errorForeground)'
      : isWarning
        ? 'var(--vscode-list-warningForeground)'
        : 'var(--vscode-foreground)',
    fontFamily: 'monospace',
  };

  return (
    <div
      style={containerStyle}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      title={contextUI.statusMessage}
    >
      {/* Circular Progress */}
      <CircularProgress
        percentage={contextUI.usagePercent}
        size={size}
        strokeWidth={2}
        showPercentage={true}
        critical={isCritical}
        warning={isWarning}
      />

      {/* Info Section */}
      {showLabel && (
        <div style={infoStyle}>
          <span style={labelStyle}>Context</span>
          <span style={usageStyle}>
            {contextUI.currentTokens.toLocaleString()} / {contextUI.maxTokens.toLocaleString()}
          </span>
        </div>
      )}

      {/* Status Indicator */}
      {isWarning && (
        <span
          style={{
            fontSize: '14px',
            animation: isCritical ? 'pulse 1s infinite' : 'none',
          }}
          title={
            isCritical
              ? 'Critical: Context window near capacity'
              : 'Warning: Context window usage high'
          }
        >
          {isCritical ? '🔴' : '🟡'}
        </span>
      )}

      {/* Popup */}
      <ContextWindowPopup
        contextUI={contextUI}
        isVisible={isPopupVisible}
        position={popupPosition}
      />

      {/* Pulse animation for critical state */}
      {isCritical && (
        <style>{`
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.7; }
          }
        `}</style>
      )}
    </div>
  );
}
