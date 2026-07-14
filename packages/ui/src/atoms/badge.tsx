import { cx } from '../lib/cx.js'
import type { StatusKey } from '../tokens/index.js'
import { dotClasses, statusClasses } from './badge.classes.js'
import { useTestId } from '../hooks/useTestId';

interface BadgeProps {
  status?:    StatusKey
  label:      string
  className?: string
  dot?:       boolean
  dataTestId?: string;
}

export function Badge({
  status    = 'pending',
  label,
  dot       = false,
  className = '',
  dataTestId,
}: BadgeProps) {
  const { rootId, getTestId } = useTestId('badge', dataTestId);
  return (
    <span
      className={cx(
        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium',
        statusClasses[status],
        className,
      )}
      data-testid={rootId}
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
