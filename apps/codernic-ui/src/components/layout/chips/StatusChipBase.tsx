import React from 'react';

export interface StatusChipBaseProps {
  children: React.ReactNode;
  title?: string;
  className?: string;
  style?: React.CSSProperties;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
}

export function StatusChipBase({
  children,
  title,
  className = '',
  style,
  onMouseEnter,
  onMouseLeave
}: StatusChipBaseProps) {
  return (
    <div
      title={title}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      className={`inline-flex items-center gap-1 px-1.5 h-[18px] rounded-[var(--radius-xs)] text-[10px] font-mono font-medium bg-white/5 border border-[var(--border-subtle)] text-[var(--text-body)] ${className}`}
      style={style}
    >
      {children}
    </div>
  );
}
