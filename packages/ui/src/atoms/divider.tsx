import { cx } from '../lib/cx.js'
import type { DividerOrientation } from './divider.types.js'

interface DividerProps {
  orientation?: DividerOrientation
  className?:   string
  label?:       string
}

export function Divider({ orientation = 'horizontal', label, className = '' }: DividerProps) {
  if (orientation === 'vertical') {
    return (
      <div
        className={cx(
          'w-px self-stretch bg-neutral-200 dark:bg-neutral-700',
          className,
        )}
        role="separator"
        aria-orientation="vertical"
      />
    )
  }

  if (label) {
    return (
      <div
        className={cx('flex items-center gap-3', className)}
        role="separator"
      >
        <div className="h-px flex-1 bg-neutral-200 dark:bg-neutral-700" />
        <span className="text-xs text-neutral-400">{label}</span>
        <div className="h-px flex-1 bg-neutral-200 dark:bg-neutral-700" />
      </div>
    )
  }

  return (
    <hr
      className={cx(
        'border-t border-neutral-200 dark:border-neutral-700',
        className,
      )}
      role="separator"
    />
  )
}
