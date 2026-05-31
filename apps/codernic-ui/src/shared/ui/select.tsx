import type { SelectHTMLAttributes } from 'react';

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  variant?: 'inline' | 'full';
  glowColor?: string;
}

export function Select({
  children,
  variant = 'inline',
  glowColor,
  className = '',
  style,
  ...props
}: SelectProps) {
  const baseStyle: React.CSSProperties = {
    background: 'var(--vscode-input-background, #1e1e1e)',
    color: 'var(--vscode-input-foreground, #cccccc)',
    border: glowColor ? `1px solid ${glowColor}` : '1px solid var(--border, #27272a)',
    borderRadius: '4px',
    padding: '4px 8px',
    fontSize: '11px',
    fontFamily: 'var(--sans)',
    outline: 'none',
    boxSizing: 'border-box',
    cursor: 'pointer',
    boxShadow: glowColor ? `0 0 6px ${glowColor}33` : 'none',
    transition: 'all 0.2s ease',
    width: variant === 'full' ? '100%' : 'auto',
    ...style,
  };

  return (
    <select
      className={`shared-select ${variant} ${className}`}
      style={baseStyle}
      {...props}
    >
      {children}
    </select>
  );
}
