'use client'

import { useEffect, useMemo, useState } from 'react'

const MIN_COL_WIDTH = 80

export interface ColSizesResult {
  colWidths:           number[]
  gridTemplateColumns: string
  setColWidth:         (index: number, width: number) => void
  reorderColumns:      (fromIndex: number, toIndex: number) => void
}

function loadFromStorage(key: string, length: number): number[] | null {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return null
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed) || parsed.length !== length) return null
    if (!(parsed as unknown[]).every(v => typeof v === 'number')) return null
    return parsed as number[]
  } catch {
    return null
  }
}

export function useColSizes(
  columns:        { key: string; width?: number }[],
  containerWidth: number,
  tableId:        string,
  minColWidth     = MIN_COL_WIDTH,
): ColSizesResult {
  const storageKey = `ft-col-widths-${tableId}`

  const initialWidths = useMemo((): number[] => {
    const persisted = loadFromStorage(storageKey, columns.length)
    if (persisted) return persisted

    const fixedTotal = columns.reduce((sum, c) => sum + (c.width ?? 0), 0)
    const flexCount  = columns.filter(c => c.width == null).length
    const flexWidth  = flexCount > 0
      ? Math.max(minColWidth, Math.floor((containerWidth - fixedTotal) / flexCount))
      : 0

    return columns.map(c => c.width ?? flexWidth)
  // storageKey only needed once on mount
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const [colWidths, setColWidths] = useState<number[]>(initialWidths)

  // Persist whenever widths change
  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(colWidths))
    } catch {
      // localStorage unavailable (SSR / private mode) — silently ignore
    }
  }, [colWidths, storageKey])

  const gridTemplateColumns = colWidths
    .map(w => `${w}px`)
    .join(' ')

  const setColWidth = (index: number, width: number) => {
    setColWidths(prev => {
      const next = [...prev]
      next[index] = Math.max(minColWidth, width)
      return next
    })
  }

  const reorderColumns = (fromIndex: number, toIndex: number) => {
    setColWidths(prev => {
      const next = [...prev]
      const [moved] = next.splice(fromIndex, 1)
      next.splice(toIndex, 0, moved)
      return next
    })
  }

  return { colWidths, gridTemplateColumns, setColWidth, reorderColumns }
}
