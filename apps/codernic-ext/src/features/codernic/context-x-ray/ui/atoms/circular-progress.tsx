import * as React from 'react';

export interface CircularProgressProps {
  readonly percentage: number;
  readonly size?: number;
  readonly strokeWidth?: number;
  readonly showPercentage?: boolean;
  readonly critical?: boolean;
  readonly warning?: boolean;
}

export function CircularProgress({
  percentage,
  size = 60,
  strokeWidth = 3,
  showPercentage = true,
  critical = false,
  warning = false,
}: CircularProgressProps): React.JSX.Element {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;

  const getProgressColor = (): string => {
    if (critical) return 'var(--vscode-errorForeground)';
    if (warning) return 'var(--vscode-list-warningForeground)';
    return 'var(--vscode-testing-iconPassed)';
  };

  const center = size / 2;

  return (
    <div
      style={{
        position: 'relative',
        width: size,
        height: size,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <svg
        width={size}
        height={size}
        style={{
          transform: 'rotate(-90deg)',
        }}
      >
        {/* Background circle */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="var(--vscode-notebookStatusRunning)"
          strokeWidth={strokeWidth}
          opacity={0.2}
        />

        {/* Progress circle */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={getProgressColor()}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{
            transition: 'stroke-dashoffset 0.3s ease',
          }}
        />
      </svg>

      {/* Percentage text */}
      {showPercentage && (
        <span
          style={{
            position: 'absolute',
            fontSize: '11px',
            fontWeight: 'bold',
            color: getProgressColor(),
          }}
        >
          {Math.round(percentage)}%
        </span>
      )}
    </div>
  );
}
