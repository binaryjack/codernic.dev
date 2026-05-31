'use client'

import { useCallback, useState } from 'react'

export interface RowSelectionResult {
  selectedIds:      Set<string | number>
  toggleRow:        (id: string | number) => void
  selectAll:        (ids: ReadonlyArray<string | number>) => void
  selectNone:       () => void
  invertSelection:  (allIds: ReadonlyArray<string | number>) => void
  isSelected:       (id: string | number) => boolean
}

export function useRowSelection(
  initialIds?: ReadonlyArray<string | number>,
): RowSelectionResult {
  const [selectedIds, setSelectedIds] = useState<Set<string | number>>(
    () => new Set(initialIds ?? []),
  )

  const toggleRow = useCallback((id: string | number) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }, [])

  const selectAll = useCallback((ids: ReadonlyArray<string | number>) => {
    setSelectedIds(new Set(ids))
  }, [])

  const selectNone = useCallback(() => {
    setSelectedIds(new Set())
  }, [])

  const invertSelection = useCallback(
    (allIds: ReadonlyArray<string | number>) => {
      setSelectedIds(prev => new Set(allIds.filter(id => !prev.has(id))))
    },
    [],
  )

  const isSelected = useCallback(
    (id: string | number) => selectedIds.has(id),
    [selectedIds],
  )

  return { selectedIds, toggleRow, selectAll, selectNone, invertSelection, isSelected }
}
