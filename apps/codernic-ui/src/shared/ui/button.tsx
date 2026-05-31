import type { ButtonHTMLAttributes } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'accent' | 'danger';
  size?: 'xs' | 'sm' | 'md';
}

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  style,
  ...props
}: ButtonProps) {
  const baseStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: 'inherit',
    fontWeight: 600,
    borderRadius: '4px',
    cursor: props.disabled ? 'default' : 'pointer',
    opacity: props.disabled ? 0.5 : 1,
    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
    border: 'none',
    outline: 'none',
    boxSizing: 'border-box',
    ...style,
  };

  const variants: Record<NonNullable<ButtonProps['variant']>, React.CSSProperties> = {
    primary: {
      background: 'var(--vscode-button-background)',
      color: 'var(--vscode-button-foreground)',
    },
    secondary: {
      background: '#27272a',
      color: '#e4e4e7',
      border: '1px solid #3f3f46',
    },
    accent: {
      background: 'rgba(59, 130, 246, 0.1)',
      color: '#60a5fa',
      border: '1px solid rgba(59, 130, 246, 0.3)',
    },
    danger: {
      background: '#991b1b',
      color: '#fee2e2',
    },
  };

  const sizes: Record<NonNullable<ButtonProps['size']>, React.CSSProperties> = {
    xs: {
      padding: '2px 6px',
      fontSize: '10px',
    },
    sm: {
      padding: '4px 10px',
      fontSize: '11px',
    },
    md: {
      padding: '6px 14px',
      fontSize: '13px',
    },
  };

  const combinedStyle = {
    ...baseStyle,
    ...variants[variant],
    ...sizes[size],
  };

  return (
    <button
      className={`shared-button ${variant} ${size} ${className}`}
      style={combinedStyle}
      {...props}
    >
      {children}
    </button>
  );
}
