'use client'

import { createContext, useContext } from 'react'
import type { DataTransporter } from './transport/transporter.types.js'
import type { ColumnDef, RowStyleRule, SortState, TableRowState } from './types.js'

// ─── Context value shape ─────────────────────────────────────────────────────

export interface FastTableContextValue<T> {
  // data
  transporter:  DataTransporter<T> | null

  // displayed rows (decorated with flags, virtualised)
  visibleRows:  TableRowState<T>[]

  // columns
  columns:      ColumnDef<T>[]

  // sorting
  sortState:    SortState<T> | null
  setSortState: (s: SortState<T> | null) => void

  // style rules applied to every row
  rowRules:     RowStyleRule<T>[]

  // scroll / virtual window
  rowHeight:        number
  containerHeight:  number
  scrollTop:        number
  setScrollTop:     (v: number) => void

  // identity
  getRowId:     (row: T) => string | number
}

// ─── Context + throwing hook ─────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const FastTableContext = createContext<FastTableContextValue<any> | null>(null)

FastTableContext.displayName = 'FastTableContext'

export { FastTableContext }

export function useFastTableContext<T>(): FastTableContextValue<T> {
  const ctx = useContext(FastTableContext) as FastTableContextValue<T> | null
  if (!ctx) {
    throw new Error(
      'useFastTableContext: must be used inside <FastTable>. ' +
      'Did you forget to wrap your component?',
    )
  }
  return ctx
}
