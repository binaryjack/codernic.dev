import { cx } from '../lib/cx.js'
import type { StatusKey } from '../tokens/index.js'
import { dotClasses, statusClasses } from './badge.classes.js'

interface BadgeProps {
  status?:    StatusKey
  label:      string
  className?: string
  dot?:       boolean
}

export function Badge({
  status    = 'pending',
  label,
  dot       = false,
  className = '',
}: BadgeProps) {
  return (
    <span
      className={cx(
        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium',
        statusClasses[status],
        className,
      )}
    >
      {dot && (
        <span
          className={`h-1.5 w-1.5 rounded-full ${dotClasses[status]}`}
          aria-hidden
        />
      )}
      {label}
    </span>
  )
}
