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
        <SkeletonRow key={i} cols={cols} />
      ))}
    </>
  )
}
