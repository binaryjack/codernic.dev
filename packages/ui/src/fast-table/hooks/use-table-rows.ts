import type { ErrorLike, TableRowState } from '../types.js'
import type { VirtualWindow } from './use-virtual-rows.js'

const NEAR_RANGE_PAD = 5

export function useTableRows<T>(
  rawRows:     T[],
  getRowId:    (row: T) => string | number,
  activeRowId: string | number | null,
  selectedIds: ReadonlySet<string | number>,
  window:      VirtualWindow,
): TableRowState<T>[] {
  const midpoint = (window.startIndex + window.endIndex) / 2

  return rawRows.map((row, index) => {
    const id        = getRowId(row)
    const isVisible = index >= window.startIndex && index < window.endIndex
    const isInNearVisibleRange = !isVisible
      && Math.abs(index - midpoint) <= NEAR_RANGE_PAD + (window.endIndex - window.startIndex) / 2

    return {
      data:                 row,
      errors:               {} as Record<string, ErrorLike[]>,
      isActive:             id === activeRowId,
      isSelected:           selectedIds.has(id),
      isVisible,
      isInNearVisibleRange,
    }
  })
}
