import type { ReactNode } from 'react'
import { Text } from '../atoms/index.js'
import { cx } from '../lib/cx.js'

interface EmptyStateProps {
  title:        string
  description?: string
  action?:      ReactNode
  className?:   string
  style?:       React.CSSProperties
}

/** Inbox-tray icon + heading + optional description, for zero-data states */
export function EmptyState({
  title,
  description,
  action,
  className = '',
  style,
}: EmptyStateProps) {
  return (
    <div 
      className={cx('flex flex-col items-center justify-center py-16 gap-4 text-center', className)}
      style={style}
    >
      {/* Inbox / tray SVG icon */}
      <svg
        className="opacity-25"
        aria-hidden="true"
        width="48"
        height="48"
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect x="4" y="14" width="40" height="28" rx="3" stroke="var(--text-muted)" strokeWidth="2" />
        <path
          d="M4 28h10l4 5h12l4-5h10"
          stroke="var(--text-muted)"
          strokeWidth="2"
          strokeLinejoin="round"
        />
        <path d="M16 6h16" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round" />
        <path d="M12 10h24" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round" />
      </svg>

      <Text className="font-medium">{title}</Text>

      {description && (
        <Text variant="muted" size="sm">{description}</Text>
      )}

      {action}
    </div>
  )
}
