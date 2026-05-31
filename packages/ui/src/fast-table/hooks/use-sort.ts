'use client'

import { useCallback, useMemo, useState } from 'react'
import type { SortState } from '../types.js'

export interface SortResult<T> {
  sortState:    SortState<T> | null
  setSortState: (s: SortState<T> | null) => void
  sortedRows:   T[]
}

export function useSort<T>(
  rows:          T[],
  defaultSort?:  SortState<T>,
): SortResult<T> {
  const [sortState, setSortState] = useState<SortState<T> | null>(defaultSort ?? null)

  const sortedRows = useMemo<T[]>(() => {
    if (!sortState) return rows

    return [...rows].sort((a, b) => {
      const av = a[sortState.key]
      const bv = b[sortState.key]
      if (av === bv) return 0
      const ascending = av < bv ? -1 : 1
      return sortState.direction === 'asc' ? ascending : -ascending
    })
  }, [rows, sortState])

  const handleSetSortState = useCallback(
    (s: SortState<T> | null) => setSortState(s),
    [],
  )

  return { sortState, setSortState: handleSetSortState, sortedRows }
}
