interface SkeletonProps {
  className?: string
}

/** Animated shimmer placeholder block — sized via className */
export function Skeleton({ className = '' }: SkeletonProps) {
  return (
    <div
      aria-hidden="true"
      className={`animate-pulse rounded bg-(--bg-alt) ${className}`}
    />
  )
}
