import { SkeletonRow } from './skeleton-row.js'

interface SkeletonRowsProps {
  rows?: number
  cols?: number
}

/** Drop-in replacement for `<tbody>` content while loading */
export function SkeletonRows({ rows = 5, cols = 5 }: SkeletonRowsProps) {
  return (
    <>
      {Array.from({ length: rows }, (_, i) => (
        <SkeletonRow data-testid={`skeleton-rows-item-${i}`} key={i} cols={cols} />
      ))}
    </>
  )
}
