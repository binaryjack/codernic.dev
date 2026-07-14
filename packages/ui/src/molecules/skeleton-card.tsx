import { Skeleton } from '../atoms/index.js'
import type { ComponentSize } from '../tokens/index.js'
import { useTestId } from '../hooks/useTestId';

interface SkeletonCardProps {
  size?: ComponentSize
  dataTestId?: string;
}

/** Skeleton shaped to match a MetricCard */
export function SkeletonCard({ dataTestId, size = 'sm' }: SkeletonCardProps) {
  
  const { rootId, getTestId } = useTestId('skeleton-card', dataTestId);
const pad    = size === 'lg' ? 'p-5' : 'px-4 py-3'
  const hValue = size === 'lg' ? 'h-8 w-32' : 'h-5 w-20'
  return (
    <div
      aria-hidden="true"
      className={`rounded-lg border border-(--border) bg-(--bg-surface) ${pad} flex flex-col gap-2`}
    >
      <Skeleton data-testid={getTestId('skeleton')} className="h-3 w-16" />
      <Skeleton data-testid={getTestId('skeleton-1')} className={hValue} />
    </div>
  )
}
