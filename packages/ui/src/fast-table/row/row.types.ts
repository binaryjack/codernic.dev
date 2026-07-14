import type { CSSProperties } from 'react'
import type { ColumnDef, TableRowState } from '../types.js'

export interface RowProps<T> {
  rowState:   TableRowState<T>
  columns:    ColumnDef<T>[]
  rowId:      string | number
  isSelected: boolean
  onSelect:   (id: string | number) => void
  onActivate: (id: string | number) => void
  style?:     CSSProperties
}
