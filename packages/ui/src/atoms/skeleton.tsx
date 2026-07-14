import { useTestId } from '../hooks/useTestId';
interface SkeletonProps {
  className?: string
  dataTestId?: string;
}

/** Animated shimmer placeholder block — sized via className */
export function Skeleton({ className = '', dataTestId }: SkeletonProps) {
  const { rootId, getTestId } = useTestId('skeleton', dataTestId);
  return (
    <div
      aria-hidden="true"
      className={`animate-pulse rounded bg-(--bg-alt) ${className}`}
      data-testid={rootId}
    />
  )
}
