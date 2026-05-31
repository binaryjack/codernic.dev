import { Skeleton } from '../atoms/index.js'
import type { ComponentSize } from '../tokens/index.js'

interface SkeletonCardProps {
  size?: ComponentSize
}

/** Skeleton shaped to match a MetricCard */
export function SkeletonCard({ size = 'sm' }: SkeletonCardProps) {
  const pad    = size === 'lg' ? 'p-5' : 'px-4 py-3'
  const hValue = size === 'lg' ? 'h-8 w-32' : 'h-5 w-20'
  return (
    <div
      aria-hidden="true"
      className={`rounded-lg border border-(--border) bg-(--bg-surface) ${pad} flex flex-col gap-2`}
    >
      <Skeleton className="h-3 w-16" />
      <Skeleton className={hValue} />
    </div>
  )
}
