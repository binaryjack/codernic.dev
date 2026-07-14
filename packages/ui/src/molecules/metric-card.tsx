import { Text } from '../atoms/index.js'
import { Badge } from '../atoms/badge.js'
import { cx } from '../lib/cx.js'
import type { ComponentSize, StatusKey } from '../tokens/index.js'

export interface MetricCardProps {
  label:      string
  value:      string | number
  unit?:      string
  sublabel?:  string
  status?:    StatusKey
  href?:      string
  /** 'sm' = compact px-4 py-3, 'lg' = spacious p-5 */
  size?:      ComponentSize
  /** 'default' = standard dashboard card, 'marketing' = centered large brand text */
  variant?:   'default' | 'marketing'
  className?: string
  style?:     React.CSSProperties
}

export function MetricCard({ 
  label, 
  value, 
  unit,
  sublabel,
  status,
  href,
  size = 'sm', 
  variant = 'default',
  className = '',
  style
}: MetricCardProps) {
  
  if (variant === 'marketing') {
    const inner = (
      <>
        <span className="text-3xl font-extrabold text-brand-400 dark:text-brand-500">{value}</span>   
        <span className="text-sm font-semibold text-neutral-900 dark:text-neutral-200">{label}</span>   
        {sublabel && <span className="text-xs text-neutral-500">{sublabel}</span>}
      </>
    )
    const containerClasses = cx('flex flex-col items-center gap-1 text-center', className)

    return href ? (
      <a href={href} className={cx(containerClasses, 'transition-opacity hover:opacity-80')} style={style}>
        {inner}
      </a>
    ) : (
      <div className={containerClasses} style={style}>{inner}</div>
    )
  }

  // --- Default Dashboard Variant ---
  const pad   = size === 'lg' ? 'p-5' : 'px-4 py-3'
  const vSize = size === 'lg' ? 'text-2xl' : 'text-xl'

  const innerDefault = (
    <>
      <Text variant="muted" size="sm">{label}</Text>
      
      <div className="flex items-baseline gap-1 mt-1">
        <p className={`tabular-nums font-semibold ${vSize} text-(--text)`}>
          {value}
        </p>
        {unit && (
          <span className="text-xs text-neutral-400">{unit}</span>
        )}
      </div>
      
      {sublabel && <Text variant="muted" size="xs" className="mt-1">{sublabel}</Text>}
      {status && <Badge status={status} label={status} className="mt-2 w-max" dot />}
    </>
  )

  const containerClassesDefault = cx(
    'flex flex-col rounded-lg border border-(--border) bg-(--bg-surface)',
    pad,
    className,
  )

  return href ? (
    <a href={href} className={cx(containerClassesDefault, 'transition-colors hover:border-brand-500 block block-w-full')} style={style}>
      {innerDefault}
    </a>
  ) : (
    <div className={containerClassesDefault} style={style}>
      {innerDefault}
    </div>
  )
}

